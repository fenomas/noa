'use strict';

var extend = require('extend')
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var boxIntersect = require('box-intersect')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

module.exports = function (noa, opts) {
	return new EntityManager(noa, opts)
}

var defaults = {
	shadowDistance: 10,
}


/* 
*  Wrangles entities.
*    An entity is anything with a physics body, bounding box, or mesh
*    Entities emit: tick, collideTerrain, collideEntity
*/

function EntityManager(noa, opts) {
	this.noa = noa
	opts = extend(defaults, opts)

	this.shadowDist = opts.shadowDistance

	this._toRemove = []

	// internals
	this._lerpPlayerMeshFrames = 0

	// experimental
	setupComponents(noa)
	var self = this
	noa.on('beforeRender', function(dt){ beforeRender(self, dt) })
	noa.on('tick',         function(dt){ tick(self, dt) })
}
var proto = EntityManager.prototype



/*
*
*    ENTITY MANAGER API
*
*/


proto.isTerrainBlocked = function (x, y, z) {
	// checks if terrain location is blocked by entities
	var newbb = new aabb([x, y, z], [1, 1, 1])
	var self = this
	var res = this.loopOverComponentData(this.noa.components.collideTerrain, function(data) {
		var bb = self.getEntityPositionData(data.__id).aabb
		if (bb.intersects(newbb) && !bb.touches(newbb)) return false;
	})
	return !res // res==false --> broke early --> blocked	
}


// Add a new entity to be managed.
// shape modeled only as an AABB, 'position' at center of bottom face.
// meshCreateFcn is of signature 'function(scene)'
proto.add = function (position, width, height, // required
                      mesh, meshOffset,
                      data, doPhysics,
                      collideTerrain, onCollideTerr, 
                      collideEntities, onCollideEnt, 
                      shadow, isSprite) {
	// bounding box
	var bb = new aabb([position[0] - width / 2, position[1], position[2] - width / 2],
		[width, height, width])
	// rigid body in physics simulator
	var body = (doPhysics) ? this.noa.physics.addBody(bb) : null
	// entity class (data struct more or less)
	// var ent = new Entity(bb, body, mesh, meshOffset, data,
	// 	collideTerrain, collideEntities, isSprite)

	// experimental
	var ecs = this.noa.ecs
	var comp = this.noa.components
	var eid = ecs.createEntity()
	
	ecs.addEntityComponents(eid, [comp.position])
	// use same aabb for position and physics if possible
	ecs.getEntityComponentData(eid, comp.position).aabb = (body) ? body.aabb : bb
	
	if (body) {
		ecs.addEntityComponents(eid, [comp.physics])
		ecs.getEntityComponentData(eid, comp.physics).body = body
	}
	
	if (mesh) {
		ecs.addEntityComponents(eid, [comp.mesh])
		var dat = ecs.getEntityComponentData(eid, comp.mesh)
		dat.mesh = mesh
		if (!meshOffset) meshOffset = vec3.create()
		dat.offset = meshOffset
		dat.isSprite = Boolean(isSprite)
		
		this.noa.rendering.addDynamicMesh(mesh)
		if (isSprite) { // TODO: ECS-ify
			this.noa.rendering.setUpSpriteMesh(mesh)
		}
	}
	
	if (shadow) {
		var shadowMesh = this.noa.rendering.makeMeshInstance('shadow', false)
		ecs.addEntityComponents(eid, [comp.shadow])
		var sdat = ecs.getEntityComponentData(eid, comp.shadow)
		sdat.mesh = shadowMesh
		sdat.size = width
	}
	
	if (collideTerrain) {
		ecs.addEntityComponents(eid, [comp.collideTerrain])
		ecs.getEntityComponentData(eid, comp.collideTerrain).onCollide = onCollideTerr 
	}

	if (collideEntities) {
		ecs.addEntityComponents(eid, [comp.collideEntities])
		ecs.getEntityComponentData(eid, comp.collideEntities).onCollide = onCollideEnt 
	}

	return eid
}


proto.remove = function (ent) {
	// defer removal until next tick function, since entities are likely to
	// call this on themselves during collsion handlers or tick functions
	if (this._toRemove.indexOf(ent) == -1) this._toRemove.push(ent);	
}

// todo: move this into a physics-body setting
proto._onPlayerAutoStep = function () {
	// When player entity, autosteps, lerp its mesh position for a few frames
	this._lerpPlayerMeshFrames = 4
}



/*
 *  Built-in component data accessors
 *	Hopefully monomorphic and easy to optimize..
*/


proto.isPlayer = function(eid) {
	return this.noa.ecs.entityHasComponent(eid, this.noa.components.player)
}
proto.getEntityPositionData = function(eid) {
	return this.noa.ecs.getEntityComponentData(eid, this.noa.components.position)
}
proto.getEntityPosition = function(eid) {
	var box = this.noa.ecs.getEntityComponentData(eid, this.noa.components.position).aabb
	var loc = box.base
	var size = box.vec
	return [ loc[0] + size[0]/2, loc[1], loc[2] + size[2]/2 ]
}
proto.getEntityPhysicsData = function(eid) {
	return this.noa.ecs.getEntityComponentData(eid, this.noa.components.physics)
}
proto.getEntityMeshData = function(eid) {
	return this.noa.ecs.getEntityComponentData(eid, this.noa.components.mesh)
}


// Experimental convenient 'System' proxy
// takes: function(componentData) 
// breaks early if fn() returns false

proto.loopOverComponentData = function(component, fn) {
	var entList = this.noa.ecs.getComponentDataList( component )
	var ids = Object.keys(entList)
	for (var i=0; i<ids.length; ++i) {
		var res = fn(entList[ids[i]])
		if (res === false) return false
	}
	return true
}



/*
*
*  INTERNALS
*
*/


function setupComponents(noa) {
	var ecs = noa.ecs
	var comp = noa.components
	comp.shadow = 'entity-shadow'
	comp.position = 'position'
	comp.physics = 'physics-body'
	comp.mesh = 'has-mesh'
	comp.player = 'is-player'
	comp.collideTerrain = 'collide-terrain'
	comp.collideEntities = 'collide-entities'
	ecs.createComponent(comp.shadow,   {mesh: null, size:0.5 })
	ecs.createComponent(comp.position, {aabb: null })
	ecs.createComponent(comp.physics,  {body: null })
	ecs.createComponent(comp.mesh,     {mesh: null, offset: null, isSprite:false })
	ecs.createComponent(comp.player,   {})
	ecs.createComponent(comp.collideTerrain,  { onCollision:null })
	ecs.createComponent(comp.collideEntities, { onCollision:null })
}



function tick(self, dt) {
	// handle any deferred entities that need removing
	doDeferredRemovals(self)
	// entity-entity collisions
	doEntityCollisions(self)
	// set all shadow heights
	updateShadowHeights(self)
	
	// TODO: ECS-ify facing code
	
	// adjust sprite entitiy mesh heights to face camera angle
	// var i, len = self.entities.length
	// var entarr = []
	// for (i = 0; i < len; ++i) {
	// 	if (self.entities[i].isSprite) entarr.push(self.entities[i])
	// }
	// if (entarr.length) self.noa.rendering.adjustSpriteMeshHeights(entarr)
	// // call tick functions
	// for (i = 0; i < len; ++i) {
	// 	self.entities[i].emit('tick', dt)
	// }
}




function beforeRender (self, dt) {
	// update meshes to physics positions, advanced into the future by dt
	// dt is time (ms) since physics engine tick, to avoid temporal aliasing
	// http://gafferongames.com/game-physics/fix-your-timestep/
	var ecs = self.noa.ecs
	var comp = self.noa.components
	var pos = tempvec
	self.loopOverComponentData(self.noa.components.mesh, function(data) {
		var mesh = data.mesh
		var offset = data.offset
		var eid = data.__id
		var body = self.getEntityPhysicsData(eid).body
		
		vec3.add(pos, body.aabb.base, offset)
		vec3.scaleAndAdd(pos, pos, body.velocity, dt/1000)
		mesh.position.x = pos[0]
		mesh.position.z = pos[2]

		if (self._lerpPlayerMeshFrames && ecs.entityHasComponent(eid, comp.player)) {
			// soften player mesh movement for a few frames after autosteps
			mesh.position.y += .4 * (pos[1] - mesh.position.y)
			self._lerpPlayerMeshFrames--
		} else {
			mesh.position.y = pos[1]
		}
		
		if (ecs.entityHasComponent(eid, comp.shadow)) {
			var shadow = ecs.getEntityComponentData(eid, comp.shadow).mesh
			shadow.position.x = pos[0]
			shadow.position.z = pos[2]
		}
	})
}



var tempvec = vec3.create()
var down = vec3.fromValues(0, -1, 0)

function updateShadowHeights(self) {
	self.loopOverComponentData(self.noa.components.shadow, function(data) {
		var mesh = data.mesh
		var size = data.size
		var box = self.getEntityPositionData(data.__id).aabb
		var loc = tempvec
		loc[0] = box.base[0] + box.vec[0]/2
		loc[1] = box.base[1]
		loc[2] = box.base[2] + box.vec[2]/2
		
		var pick = self.noa.pick(loc, down, self.shadowDist)
		if (pick) {
			var y = pick.position[1]
			mesh.position.y = y + 0.05
			var dist = loc[1] - y
			var scale = size * 0.7 * (1-dist/self.shadowDist)
			mesh.scaling.copyFromFloats(scale, scale, scale)
			mesh.setEnabled(true)
		} else {
			mesh.setEnabled(false)
		}	
	})
}



// TODO: edit and test
function doDeferredRemovals(self) {
	while (self._toRemove.length) {
		var ent = self._toRemove.pop()
		self.noa.ecs.removeEntity(ent.id)
		var i = self.entities.indexOf(ent)
		if (i>-1) self.entities.splice(i,1)
		if (ent.mesh) ent.mesh.dispose()
		if (ent.body) self.noa.physics.removeBody(ent.body)
		// in case it helps the GC
		ent.removeAllListeners()
		ent.body = ent.mesh = ent.bb = ent.data = null
	}
}



function doEntityCollisions(self) {
	// build array of [lo, lo, hi, hi] arrays
	var intervals = [], eids = []
	self.loopOverComponentData(self.noa.components.collideEntities, function(data) {
		var box = self.getEntityPositionData(data.__id).aabb
		var lo = box.base
		var s = box.vec
		intervals.push([lo[0], lo[1], lo[2], lo[0]+s[0], lo[1]+s[1], lo[2]+s[2]])
		eids.push(data.__id)
	})
	var ecs = self.noa.ecs
	var collide = self.noa.components.collideEntities
	boxIntersect( intervals, function(i, j) {
		var iid = eids[i]
		var jid = eids[j]
		var ihandler = ecs.getEntityComponentData(iid, collide).onCollide
		if (ihandler) ihandler(iid, jid)
		var jhandler = ecs.getEntityComponentData(jid, collide).onCollide
		if (jhandler) jhandler(jid, iid)
	})
}






/*
*  ENTITY struct:
*
*  bb:       bounding box (effectively overridden by physics body if there is one)
*  body:     optional reference to rigid body managed by physics engine
*  mesh:     optional reference to mesh managed by renderer
*  meshOffset: offset from base of aabb to mesh's registration point
*  data:     arbtitrary object
*  collTerr: whether to prevent new terrain overlapping the entity
*  collEnt:  whether to collision test with other entities
*  isSprite: whether mesh should be handled like a 2D billboard sprite
*/

// function Entity(bb, body, mesh, meshOffset, data,
// 	collTerr, collEnt, isSprite) {
// 	this.body = body || null
// 	this.mesh = mesh || null
// 	this.meshOffset = meshOffset || [0,0,0]
// 	this.data = data || null
// 	this.bb = (body) ? body.aabb : bb
// 	this.collideEntities = collEnt
// 	this.collideTerrain = collTerr
// 	this.isSprite = isSprite
// 	// if physics terrain collisions needed, wrap physics engine's onCollide
// 	if (body && collTerr) {
// 		this.body.onCollide = onTerrainCollide.bind(null, this)
// 	}
// 	this.shadowMesh = null
// }
// inherits(Entity, EventEmitter)
// function onTerrainCollide(entity, impulse) {
// 	entity.emit('collideTerrain', impulse)
// }


// // Entity APIs:

// // get "feet" position - center of bottom face
// Entity.prototype.getPosition = function() {
// 	var loc = this.bb.base
// 	var size = this.bb.vec
// 	return [ loc[0] + size[0]/2, loc[1], loc[2] + size[2]/2 ]
// }





