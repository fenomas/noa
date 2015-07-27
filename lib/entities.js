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
	setupComponents(this)
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
		var bb = self.getPositionData(data.__id).aabb
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
		ecs.getEntityComponentData(eid, comp.collideTerrain).callback = onCollideTerr 
	}

	if (collideEntities) {
		ecs.addEntityComponents(eid, [comp.collideEntities])
		ecs.getEntityComponentData(eid, comp.collideEntities).callback = onCollideEnt 
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
proto.getPositionData = function(eid) {
	return this.noa.ecs.getEntityComponentData(eid, this.noa.components.position)
}
proto.getPosition = function(eid) {
	var box = this.noa.ecs.getEntityComponentData(eid, this.noa.components.position).aabb
	var loc = box.base
	var size = box.vec
	return [ loc[0] + size[0]/2, loc[1], loc[2] + size[2]/2 ]
}
proto.getPhysicsData = function(eid) {
	return this.noa.ecs.getEntityComponentData(eid, this.noa.components.physics)
}
proto.getMeshData = function(eid) {
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


function setupComponents(self) {
	var ecs = self.noa.ecs
	var comp = self.noa.components
	comp.shadow = 'entity-shadow'
	comp.position = 'position'
	comp.physics = 'physics-body'
	comp.mesh = 'has-mesh'
	comp.player = 'is-player'
	comp.collideTerrain = 'collide-terrain'
	comp.collideEntities = 'collide-entities'
	comp.countdown = 'countdown'
	ecs.createComponent(comp.shadow,   {mesh: null, size:0.5 })
	ecs.createComponent(comp.position, {aabb: null })
	ecs.createComponent(comp.physics,  {body: null })
	ecs.createComponent(comp.mesh,     {mesh: null, offset: null, isSprite:false })
	ecs.createComponent(comp.player,   {})
	ecs.createComponent(comp.collideTerrain,  { callback:null })
	ecs.createComponent(comp.collideEntities, { callback:null })
	ecs.createComponent(comp.countdown, { time:0.5, callback:null })
}



function tick(self, dt) {
	// handle any deferred entities that need removing
	doDeferredRemovals(self)
	// 			ECS processors	
	// entity-entity collisions
	doEntityCollisions(self)
	// set all shadow heights
	updateShadowHeights(self)
	// countdown processor
	self.loopOverComponentData(self.noa.components.countdown, function(data) {
		data.time -= dt
		if (data.time < 0) data.callback()
	})
	
	
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
		var body = self.getPhysicsData(eid).body
		
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
		var box = self.getPositionData(data.__id).aabb
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




function doDeferredRemovals(self) {
	var ecs = self.noa.ecs
	var comp = self.noa.components
	while (self._toRemove.length) {
		var eid = self._toRemove.pop()
		if (ecs.entityHasComponent(eid, comp.mesh)) {
			self.getMeshData(eid).mesh.dispose()
		}
		if (ecs.entityHasComponent(eid, comp.shadow)) {
			ecs.getEntityComponent(eid, comp.shadow).mesh.dispose()
		}
		if (ecs.entityHasComponent(eid, comp.physics)) {
			self.noa.physics.removeBody( self.getPhysicsData(eid).body )
		}
		self.noa.ecs.removeEntity(eid)
	}
}



function doEntityCollisions(self) {
	// build array of [lo, lo, hi, hi] arrays
	var intervals = [], eids = []
	self.loopOverComponentData(self.noa.components.collideEntities, function(data) {
		var box = self.getPositionData(data.__id).aabb
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
		var ihandler = ecs.getEntityComponentData(iid, collide).callback
		if (ihandler) ihandler(iid, jid)
		var jhandler = ecs.getEntityComponentData(jid, collide).callback
		if (jhandler) jhandler(jid, iid)
	})
}





