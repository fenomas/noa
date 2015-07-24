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

	this.entities = []
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
	for (var i = 0; i < this.entities.length; ++i) {
		if (this.entities[i].collideTerrain) {
			var bb = this.entities[i].bb
			if (bb.intersects(newbb) && !bb.touches(newbb)) return true;
		}
	}
	return false
}


// Add a new entity to be managed.
// shape modeled only as an AABB, 'position' at center of bottom face.
// meshCreateFcn is of signature 'function(scene)'
proto.add = function (position, width, height, // required
	mesh, meshOffset,
	data, doPhysics,
	collideTerrain, collideEntities,
	shadow, isSprite) {
	// bounding box
	var bb = new aabb([position[0] - width / 2, position[1], position[2] - width / 2],
		[width, height, width])
	// rigid body in physics simulator
	var body = (doPhysics) ? this.noa.physics.addBody(bb) : null
	// entity class (data struct more or less)
	var ent = new Entity(bb, body, mesh, meshOffset, data,
		collideTerrain, collideEntities, isSprite)
	if (mesh) this.noa.rendering.addDynamicMesh(mesh)
	if (mesh && isSprite) {
		this.noa.rendering.setUpSpriteMesh(mesh)
	}

	// experimental
	var ecs = this.noa.ecs
	var comp = this.noa.components
	var eid = ecs.createEntity()
	ent.id = eid
	
	ecs.addEntityComponents(eid, [comp.position])
	ecs.getEntityComponentData(eid, comp.position).aabb = bb
	
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
	}
	
	if (shadow) {
		var shadowMesh = this.noa.rendering.makeMeshInstance('shadow', false)
		ecs.addEntityComponents(eid, [comp.shadow])
		ecs.getEntityComponentData(eid, comp.shadow).mesh = shadowMesh
	}

	this.entities.push(ent)
	return ent
}


proto.remove = function (ent) {
	// defer removal until next tick function, since entities are likely to
	// call this on themselves during collsion handlers or tick functions
	if (this._toRemove.indexOf(ent) == -1) this._toRemove.push(ent);	
}

proto._onPlayerAutoStep = function () {
	// When player entity, autosteps, lerp its mesh position for a few frames
	this._lerpPlayerMeshFrames = 4
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
	ecs.createComponent(comp.shadow,   {mesh: null })
	ecs.createComponent(comp.position, {aabb: null })
	ecs.createComponent(comp.physics,  {body: null })
	ecs.createComponent(comp.mesh,     {mesh: null, offset: null, isSprite:false })
	ecs.createComponent(comp.player,   {})
}



function tick(self, dt) {
	// handle any deferred entities that need removing
	doDeferredRemovals(self)
	// update position component of physics-managed entities
	updatePositions(self)
	// entity-entity collisions
	doEntityCollisions(self)
	// set all shadow heights
	updateShadowHeights(self)
	// adjust sprite entitiy mesh heights to face camera angle
	var i, len = self.entities.length
	var entarr = []
	for (i = 0; i < len; ++i) {
		if (self.entities[i].isSprite) entarr.push(self.entities[i])
	}
	if (entarr.length) self.noa.rendering.adjustSpriteMeshHeights(entarr)
	// call tick functions
	for (i = 0; i < len; ++i) {
		self.entities[i].emit('tick', dt)
	}
}




function beforeRender (self, dt) {
	// update meshes to physics positions, advanced into the future by dt
	// dt is time (ms) since physics engine tick, to avoid temporal aliasing
	// http://gafferongames.com/game-physics/fix-your-timestep/

	var ecs = self.noa.ecs
	var comp = self.noa.components
	var entList = ecs.getComponentDataList( comp.mesh )
	var ids = Object.keys(entList)
	var pos = tempvec
	for (var i=0; i<ids.length; ++i) {
		var data = entList[ids[i]]
		var mesh = data.mesh
		var offset = data.offset
		var eid = data.__id
		var body = ecs.getEntityComponentData(eid, comp.physics).body
		
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
	}
}



var tempvec = vec3.create()
var down = vec3.fromValues(0, -1, 0)

function updateShadowHeights(self) {
	var ecs = self.noa.ecs
	var comp = self.noa.components
	var entList = ecs.getComponentDataList( comp.shadow )
	var ids = Object.keys(entList)
	for (var i=0; i<ids.length; ++i) {
		var data = entList[ids[i]]
		var mesh = data.mesh
		var box = ecs.getEntityComponentData(data.__id, comp.position).aabb
		var loc = tempvec
		loc[0] = box.base[0] + box.vec[0]/2
		loc[1] = box.base[1]
		loc[2] = box.base[2] + box.vec[2]/2
		
		var pick = self.noa.pick(loc, down, self.shadowDist)
		if (pick) {
			var y = pick.position[1]
			mesh.position.y = y + 0.05
			var scale = box.vec[0] // TODO: revisit for non-square entities?
			var dist = loc[1] - y
			scale *= 0.7 * (1-dist/self.shadowDist)
			mesh.scaling.copyFromFloats(scale, scale, scale)
			mesh.setEnabled(true)
		} else {
			if (data.__id==0) console.log('pick failed')
			mesh.setEnabled(false)
		}	
	}
}




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


function updatePositions(self) {
	var ecs = self.noa.ecs
	var comp = self.noa.components
	var entList = ecs.getComponentDataList( comp.physics )
	var ids = Object.keys(entList)
	for (var i=0; i<ids.length; ++i) {
		var data = entList[ids[i]]
		if (! ecs.entityHasComponent(data.__id, comp.position)) continue
		var box = ecs.getEntityComponentData(data.__id, comp.position).aabb
		vec3.copy(box.base, data.body.aabb.base)
	}
}


function doEntityCollisions(self) {
	// build array of [lo, lo, hi, hi] arrays
	var intervals = [], indexes = []
	for (var i=0; i<self.entities.length; ++i) {
		var e = self.entities[i]
		if (e.collideEntities) {
			var lo = e.bb.base
			var s = e.bb.vec
			intervals.push([lo[0], lo[1], lo[2], lo[0]+s[0], lo[1]+s[1], lo[2]+s[2]])
			indexes.push(i)
		}
	}
	// collision test them and send events
	boxIntersect( intervals, entEntCollision.bind(null, self.entities, indexes) )
}
function entEntCollision(entities, indexes, i, j) {
	var ei = entities[indexes[i]]
	var ej = entities[indexes[j]]
	ei.emit('collideEntity', ej)
	ej.emit('collideEntity', ei)
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

function Entity(bb, body, mesh, meshOffset, data,
	collTerr, collEnt, isSprite) {
	this.body = body || null
	this.mesh = mesh || null
	this.meshOffset = meshOffset || [0,0,0]
	this.data = data || null
	this.bb = (body) ? body.aabb : bb
	this.collideEntities = collEnt
	this.collideTerrain = collTerr
	this.isSprite = isSprite
	// if physics terrain collisions needed, wrap physics engine's onCollide
	if (body && collTerr) {
		this.body.onCollide = onTerrainCollide.bind(null, this)
	}
	this.shadowMesh = null
}
inherits(Entity, EventEmitter)
function onTerrainCollide(entity, impulse) {
	entity.emit('collideTerrain', impulse)
}


// Entity APIs:

// get "feet" position - center of bottom face
Entity.prototype.getPosition = function() {
	var loc = this.bb.base
	var size = this.bb.vec
	return [ loc[0] + size[0]/2, loc[1], loc[2] + size[2]/2 ]
}





