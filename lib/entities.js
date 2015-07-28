'use strict';

var extend = require('extend')
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var boxIntersect = require('box-intersect')
var EntitySystem = require('ensy')

module.exports = function (noa, opts) {
	return new EntityManager(noa, opts)
}

var defaults = {
	shadowDistance: 10,
}


/*
 *
 *   Wrangles entities.
 *		Encapsulates an ECS. Exposes helpers for adding entities, components, 
 * 		and getting component data for entities. 
 *
*/

function EntityManager(noa, opts) {
	this.noa = noa
	opts = extend(defaults, opts)
	
	// internals
	this.shadowDist = opts.shadowDistance
	this._toRemove = []
	
	// set up ECS and built-in components
	this.ecs = new EntitySystem()
	this.components = {}
	setupComponents(this)
	
	var self = this
	noa.on('beforeRender', function(dt){ beforeRender(self, dt) })
	noa.on('tick',         function(dt){ tick(self, dt) })
}
var proto = EntityManager.prototype




/*
 *
 *    ECS API - hides/encapsulates ensy library
 *
*/

proto.createComponent = function (name, data) {
	if (!data) data = {}
	return this.ecs.addComponent(name, { state:data })
}
proto.removeComponent = function (name) {
	return this.ecs.removeComponent(name)
}

proto.createEntity = function (compList) {
	return this.ecs.createEntity(compList || [])
}
proto.removeEntity = function (entID) {
	return this.ecs.removeEntity(entID)
}

proto.addComponent = function (entID, comp, data) {
	this.ecs.addComponentsToEntity([comp], entID)
	if (!data) return
	var entData = this.ecs.getComponentDataForEntity(comp, entID)
	for (var s in data) {
		if (!entData.hasOwnProperty(s)) throw new Error("Supplied data object doesn't match component data")
		entData[s] = data[s]
	}
}
proto.removeComponent = function (entID, comps) {
	if (!(comps.length && typeof comps==='object')) comps = [comps]
	return this.ecs.removeComponentsFromEntity(comps, entID)
}
proto.hasComponent = function (entID, compName) {
	return this.ecs.entityHasComponent(entID, compName)
}

proto.getData = function (entID, compName) {
	return this.ecs.getComponentDataForEntity(compName, entID)
}
proto.getDataList = function (compName) {
	return this.ecs.getComponentsData(compName)
}

// Accessor for 'systems' to map a function over each item in a component data list
// takes: function(componentData, id) 
// breaks early if fn() returns false
proto.loopOverComponent = function(component, fn) {
	var entList = this.ecs.getComponentsData( component )
	var ids = Object.keys(entList)
	for (var i=0; i<ids.length; ++i) {
		var id = ids[i]
		var res = fn(entList[id], id)
		if (res === false) return false
	}
	return true
}




/*
 *
 *		BUILT IN COMPONENTS
 *
*/

function setupComponents(self) {
	var comps = self.components
	
	comps.aabb = 'aabb'
	comps.shadow = 'has-shadow'
	comps.physics = 'physics-body'
	comps.mesh = 'has-mesh'
	comps.player = 'is-player'
	comps.collideTerrain = 'collide-terrain'
	comps.collideEntities = 'collide-entities'
	comps.countdown = 'countdown'
	
	self.createComponent( comps.aabb,            {aabb: null })
	self.createComponent( comps.shadow,          {mesh: null, size:0.5 })
	self.createComponent( comps.physics,         {body: null })
	self.createComponent( comps.mesh,            {mesh: null, offset: null, isSprite:false })
	self.createComponent( comps.player,          {})
	self.createComponent( comps.collideTerrain,  { callback:null })
	self.createComponent( comps.collideEntities, { callback:null })
	self.createComponent( comps.countdown,       { delay:0.5, callback:null })
	
	// internal use
	comps.autoStepping = 'autostepping'
	self.createComponent( comps.autoStepping, { time:100.1 })
}



/*
 *  Built-in component data accessors
 *	Hopefully monomorphic and easy to optimize..
*/


proto.isPlayer = function(eid) {
	return this.hasComponent(eid, this.components.player)
}
proto.getAABB = function(eid) {
	return this.getData(eid, this.components.aabb).aabb
}
proto.getPosition = function(eid) {
	var box = this.getData(eid, this.components.aabb).aabb
	var loc = box.base
	var size = box.vec
	return [ loc[0] + size[0]/2, loc[1], loc[2] + size[2]/2 ]
}
proto.getPhysicsBody = function(eid) {
	return this.getData(eid, this.components.physics).body
}
proto.getMeshData = function(eid) {
	return this.getData(eid, this.components.mesh)
}




/*
 *
 *    ENTITY MANAGER API
 *
*/


proto.isTerrainBlocked = function (x, y, z) {
	// checks if terrain location is blocked by entities
	var newbb = new aabb([x, y, z], [1, 1, 1])
	var self = this
	var res = this.loopOverComponent(this.components.collideTerrain, function(data, id) {
		var bb = self.getAABB(id)
		if (bb.intersects(newbb) && !bb.touches(newbb)) return false;
	})
	return !res // res==false --> broke early --> blocked	
}


// Add a new entity, and automatically populates the main components 
// based on arguments if they're present
proto.add = function (position, width, height, // required
                      mesh, meshOffset, 
					  doPhysics,
                      collideTerrain, onCollideTerr, 
                      collideEntities, onCollideEnt, 
                      shadow, isSprite) {
	var comps = this.components
	var self = this
	
	// new entity
	var eid = this.createEntity()
		  
	// bounding box for new entity
	var box = new aabb([position[0] - width / 2, position[1], position[2] - width / 2],
		[width, height, width])
	
	// rigid body in physics simulator
	var body
	if (doPhysics) {
		body = this.noa.physics.addBody(box)
		this.addComponent(eid, comps.physics, {body:body})
		
		// handler for physics engine to call on auto-step
		body.onStep = function() {
			self.addComponent(eid, self.components.autoStepping)
		}
	}	
	
	// aabb component - use aabb from physics body if it's present
	var boxData = {aabb:box}
	if (body) boxData.aabb = body.aabb
	this.addComponent(eid, comps.aabb, boxData)
	
	// mesh for the entity
	if (mesh) {
		if (!meshOffset) meshOffset = vec3.create()
		var meshData = {
			mesh: mesh,
			offset: meshOffset,
			isSprite: isSprite
		}
		this.addComponent(eid, comps.mesh, meshData)
		
		this.noa.rendering.addDynamicMesh(mesh)
		if (isSprite) { // TODO: ECS-ify
			this.noa.rendering.setUpSpriteMesh(mesh)
		}
	}
	
	// managed shadow mesh for the entity
	if (shadow) {
		var shadowMesh = this.noa.rendering.makeMeshInstance('shadow', false)
		var shadowDat = {mesh:shadowMesh, size:width}
		this.addComponent(eid, comps.shadow, shadowDat)
	}
	
	// flag and optional callback for colliding w/ terrain
	if (collideTerrain) {
		var terrDat = {}
		if (onCollideTerr) terrDat.callback = onCollideTerr
		this.addComponent(eid, comps.collideTerrain, terrDat)
		// collide handler for physics engine to call
		if (body) {
			var collideComp = this.components.collideTerrain
			body.onCollide = function(impulse) {
				if (self.hasComponent(eid, collideComp)) {
					var cb = self.getData(eid, collideComp).callback
					if (cb) cb(impulse, eid)
				}
			}
		}
	}

	// flag and optional callback for colliding w/ other entities
	if (collideEntities) {
		var centDat = {}
		if (onCollideEnt) centDat.callback = onCollideEnt
		this.addComponent(eid, comps.collideEntities, centDat)
	}

	return eid
}


proto.remove = function (eid) {
	// defer removal until next tick function, since entities are likely to
	// call this on themselves during collsion handlers or tick functions
	if (this._toRemove.indexOf(eid) < 0) this._toRemove.push(eid);	
}






/*
*
*  INTERNALS
*
*/



function tick(self, dt) {
	// handle any deferred entities that need removing
	doDeferredRemovals(self)
	// 			ECS processors	
	// entity-entity collisions
	doEntityCollisions(self)
	// set all shadow heights
	updateShadowHeights(self)
	// countdown processor
	self.loopOverComponent(self.components.countdown, function(data) {
		data.delay -= dt
		if (data.delay < 0) data.callback()
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
	var comps = self.components
	var pos = tempvec
	self.loopOverComponent(comps.mesh, function(data, id) {
		var mesh = data.mesh
		var offset = data.offset
		var body = self.getPhysicsBody(id)
		
		vec3.add(pos, body.aabb.base, offset)
		vec3.scaleAndAdd(pos, pos, body.velocity, dt/1000)
		mesh.position.x = pos[0]
		mesh.position.z = pos[2]
		
		if (self.hasComponent(id, comps.autoStepping)) {
			// soften player mesh movement for a short while after autosteps
			mesh.position.y += .3 * (pos[1] - mesh.position.y)
			var dat = self.getData(id, comps.autoStepping)
			dat.time -= dt
			if (dat.time < 0) self.removeComponent(id, comps.autoStepping)
		} else {
			mesh.position.y = pos[1]
		}

		if (self.hasComponent(id, comps.shadow)) {
			var shadow = self.getData(id, comps.shadow).mesh
			shadow.position.x = pos[0]
			shadow.position.z = pos[2]
		}
	})
}



/*
 *
 *		SYSTEMS - i.e. functions that loop over component data each tick or render
 *
*/


var tempvec = vec3.create()
var down = vec3.fromValues(0, -1, 0)

function updateShadowHeights(self) {
	self.loopOverComponent(self.components.shadow, function(data, id) {
		var mesh = data.mesh
		var size = data.size
		var loc = self.getPosition(id)
		
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
	var comps = self.components
	while (self._toRemove.length) {
		var eid = self._toRemove.pop()
		if (self.hasComponent(eid, comps.mesh)) {
			self.getMeshData(eid).mesh.dispose()
		}
		if (self.hasComponent(eid, comps.shadow)) {
			self.getData(eid, comps.shadow).mesh.dispose()
		}
		if (self.hasComponent(eid, comps.physics)) {
			self.noa.physics.removeBody( self.getPhysicsBody(eid) )
		}
		self.removeEntity(eid)
	}
}



function doEntityCollisions(self) {
	// build array of [lo, lo, hi, hi] arrays
	var intervals = [], ids = []
	self.loopOverComponent(self.components.collideEntities, function(data, id) {
		var box = self.getAABB(id)
		var lo = box.base
		var s = box.vec
		intervals.push([lo[0], lo[1], lo[2], lo[0]+s[0], lo[1]+s[1], lo[2]+s[2]])
		ids.push(id)
	})
	var collideEnt = self.components.collideEntities
	boxIntersect( intervals, function(i, j) {
		var iid = ids[i]
		var jid = ids[j]
		var ihandler = self.getData(iid, collideEnt).callback
		if (ihandler) ihandler(iid, jid)
		var jhandler = self.getData(jid, collideEnt).callback
		if (jhandler) jhandler(jid, iid)
	})
}





