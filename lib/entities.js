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
var processorHash = {}

proto.createComponent = function (comp, dataRemove) {
	
	// todo: remove after converting components to objects
	if (typeof comp === 'string') {
		comp = {
			name:comp,
			state: dataRemove || {}
		}
	}
		
	this.ecs.addComponent(comp.name, comp)
	
	if (comp.processor) {
		var ecs = this.ecs
		var name = comp.name
		var proc = comp.processor
		processorHash[name] = { update: function(dt) {
			var states = ecs.getComponentsData(name)
			proc(dt, states)
		}}
		this.ecs.addProcessor(processorHash[name])
	}
}

proto.deleteComponent = function (comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	this.ecs.removeProcessor(processorHash[name])
	return this.ecs.removeComponent(name)
}

proto.createEntity = function (compList) {
	var eid = this.ecs.createEntity([])
	if (compList && compList.length) {
		for (var i=0; i<compList.length; ++i) {
			this.addComponent(eid, compList[i])
		}
	}
	return eid
}

proto.removeEntity = function (entID) {
	// manually remove components so that callbacks can fire
	var compNames = this.ecs.getComponentsList()
	for (var i=0; i<compNames.length; ++i) {
		var name = compNames[i]
		if (this.ecs.entityHasComponent(entID, name)) {
			this.removeComponent(entID, name)
		}
	}
	return this.ecs.removeEntity(entID)
}

var addCompArray = []
proto.addComponent = function (entID, comp, data) {
	var name = (typeof comp === 'string') ? comp : comp.name
	addCompArray[0] = name
	this.ecs.addComponentsToEntity(addCompArray, entID)
	
	var compData = this.ecs.getComponentDataForEntity(name, entID)
	if (data) {
		for (var s in data) {
			if (!compData.hasOwnProperty(s)) throw new Error("Supplied data object doesn't match component data")
			compData[s] = data[s]
		}
	}
	var compDef = this.ecs.components[name]
	if (compDef.onAdd) compDef.onAdd(entID, compData)
}

proto.removeComponent = function (entID, comp) {
	if (comp.length && typeof comp==='object') throw new Error("Remove one component at a time..")

	var name = (typeof comp === 'string') ? comp : comp.name
	var compDef = this.ecs.components[name]
	if (compDef.onRemove) {	
		var compData = this.ecs.getComponentDataForEntity(name, entID)
		compDef.onRemove(entID, compData)
	}
	return this.ecs.removeComponentsFromEntity([name], entID)
}

proto.hasComponent = function (entID, comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.entityHasComponent(entID, name)
}

proto.getData = function (entID, comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.getComponentDataForEntity(name, entID)
}

proto.getDataList = function (comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.getComponentsData(name)
}

// Accessor for 'systems' to map a function over each item in a component data list
// takes: function(componentData, id) 
// breaks early if fn() returns false
proto.loopOverComponent = function(comp, fn) {
	var name = (typeof comp === 'string') ? comp : comp.name
	var ents = this.ecs.getComponentsData( name )
	for (var i=0; i<ents.length; ++i) {
		var dat = ents[i]
		var res = fn(dat, dat.__id)
		if (res === false) return false
	}
	return true
}

proto.update = function (dt) {
	this.ecs.update(dt)
}



/*
 *
 *		BUILT IN COMPONENTS
 *
*/

function setupComponents(self) {
	var comps = self.components
	
	comps.aabb = require('../components/aabb')(self.noa)
	comps.shadow = require('../components/shadow')(self.noa)
	comps.physics = require('../components/physics')(self.noa)
	comps.mesh = 'has-mesh'
	comps.player = require('../components/player')()
	comps.collideTerrain = 'collide-terrain'
	comps.collideEntities = 'collide-entities'
	comps.countdown = require('../components/countdown')(self.noa)
	comps.sprite = require('../components/sprite')()
	
	self.createComponent( comps.aabb )
	self.createComponent( comps.shadow )
	self.createComponent( comps.physics )
	self.createComponent( comps.mesh,            {mesh: null, offset: null, isSprite:false })
	self.createComponent( comps.player )
	self.createComponent( comps.collideTerrain,  { callback:null })
	self.createComponent( comps.collideEntities, { callback:null })
	self.createComponent( comps.countdown )
	self.createComponent( comps.sprite )
	
	// internal use
	comps.autoStepping = require('../components/autostepping')()
	self.createComponent( comps.autoStepping )
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
		// body = this.noa.physics.addBody(box)
		this.addComponent(eid, comps.physics)
		body = this.getPhysicsBody(eid)
		body.aabb = box
		
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
			offset: meshOffset
		}
		this.addComponent(eid, comps.mesh, meshData)
		
		this.noa.rendering.addDynamicMesh(mesh)
		if (isSprite) {
			this.addComponent(eid, comps.sprite)
			// just turns on billboard.Y
			this.noa.rendering.setUpSpriteMesh(mesh)
		}
	}
	
	// managed shadow mesh for the entity
	if (shadow) {
		this.addComponent(eid, comps.shadow, {size:width})
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
	// facing processor - faces sprite meshes towards camera
	self.loopOverComponent(self.components.sprite, function(data, id) {
		var box = self.getAABB(id)
		var mesh = self.getMeshData(id).mesh
		self.noa.rendering.adjustSpriteMeshHeight(box, mesh)
	})	
}




function beforeRender (self, dt) {
	// update meshes to physics positions, advanced into the future by dt
	// dt is time (ms) since physics engine tick, to avoid temporal aliasing
	// http://gafferongames.com/game-physics/fix-your-timestep/
	var comps = self.components
	var pos = tempvec
	self.loopOverComponent(comps.mesh, function(data, id) {
		if (!self.hasComponent(id, self.components.physics)) return
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




function doDeferredRemovals(self) {
	var comps = self.components
	while (self._toRemove.length) {
		var eid = self._toRemove.pop()
		if (self.hasComponent(eid, comps.mesh)) {
			self.getMeshData(eid).mesh.dispose()
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





