'use strict';

var extend = require('extend')
var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var EntitySystem = require('ensy')

module.exports = function (noa, opts) {
	return new Entities(noa, opts)
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

function Entities(noa, opts) {
	this.noa = noa
	opts = extend(defaults, opts)
	
	// internals
	this.shadowDist = opts.shadowDistance
	this._toRemove = []
	
	// set up ECS and built-in components
	this.ecs = new EntitySystem()
	this.components = {}
	this.processors = {}
	setupComponents(this)

	var self = this
	noa.on('beforeRender', function (dt) {
		updateMeshPositions(self, dt)
		doCameraTracking(self, dt) 
	})
	noa.on('tick', function (dt) { tick(self, dt) })
}




/*
 *
 *    ECS API - hides/encapsulates ensy library
 *
*/

Entities.prototype.createComponent = function (comp, dataRemove) {
	
	// todo: remove after converting components to objects
	if (typeof comp === 'string') {
		comp = {
			name: comp,
			state: dataRemove || {}
		}
	}

	this.ecs.addComponent(comp.name, comp)

	if (comp.processor) {
		var ecs = this.ecs
		var name = comp.name
		var proc = comp.processor
		this.processors[name] = {
			update: function runProcessor(dt) {
				var states = ecs.getComponentsData(name)
				proc(dt, states)
			}
		}
		this.ecs.addProcessor(this.processors[name])
	}
}

Entities.prototype.deleteComponent = function (comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	this.ecs.removeProcessor(this.processors[name])
	return this.ecs.removeComponent(name)
}

Entities.prototype.createEntity = function (compList) {
	var eid = this.ecs.createEntity([])
	if (compList && compList.length) {
		for (var i = 0; i < compList.length; ++i) {
			this.addComponent(eid, compList[i])
		}
	}
	return eid
}

Entities.prototype.removeEntity = function (entID) {
	// manually remove components so that callbacks can fire
	var compNames = this.ecs.getComponentsList()
	for (var i = 0; i < compNames.length; ++i) {
		var name = compNames[i]
		if (this.ecs.entityHasComponent(entID, name)) {
			this.removeComponent(entID, name)
		}
	}
	return this.ecs.removeEntity(entID)
}

var tmpArray = ['foo']
Entities.prototype.addComponent = function (entID, comp, data) {
	var name = (typeof comp === 'string') ? comp : comp.name
	tmpArray[0] = name
	this.ecs.addComponentsToEntity(tmpArray, entID)

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

Entities.prototype.removeComponent = function (entID, comp) {
	if (comp.length && typeof comp === 'object') throw new Error("Remove one component at a time..")

	var name = (typeof comp === 'string') ? comp : comp.name
	var compDef = this.ecs.components[name]
	if (compDef.onRemove) {
		var compData = this.ecs.getComponentDataForEntity(name, entID)
		compDef.onRemove(entID, compData)
	}
	return this.ecs.removeComponentsFromEntity([name], entID)
}

Entities.prototype.hasComponent = function (entID, comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.entityHasComponent(entID, name)
}

Entities.prototype.getData = function (entID, comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.getComponentDataForEntity(name, entID)
}

Entities.prototype.getDataList = function (comp) {
	var name = (typeof comp === 'string') ? comp : comp.name
	return this.ecs.getComponentsData(name)
}

// Accessor for 'systems' to map a function over each item in a component data list
// takes: function(componentData, id) 
// breaks early if fn() returns false
Entities.prototype.loopOverComponent = function (comp, fn) {
	var name = (typeof comp === 'string') ? comp : comp.name
	var ents = this.ecs.getComponentsData(name)
	for (var i = 0; i < ents.length; ++i) {
		var dat = ents[i]
		var res = fn(dat, dat.__id)
		if (res === false) return false
	}
	return true
}

Entities.prototype.update = function (dt) {
	this.ecs.update(dt)
}



/*
 *
 *		BUILT IN COMPONENTS
 *
*/

function setupComponents(self) {
	var comps = self.components
	var noa = self.noa

	comps.aabb = require('../components/aabb')(noa)
	comps.shadow = require('../components/shadow')(noa)
	comps.physics = require('../components/physics')(noa)
	comps.mesh = require('../components/mesh')(noa)
	comps.player = require('../components/player')(noa)
	comps.collideTerrain = require('../components/collideTerrain')(noa)
	comps.collideEntities = require('../components/collideEntities')(noa)
	comps.countdown = require('../components/countdown')(noa)
	comps.autoStepping = require('../components/autostepping')(noa)
	comps.movement = require('../components/movement')(noa)
	comps.receivesInputs = require('../components/receivesInputs')(noa)
	comps.followsPlayer = require('../components/followsPlayer')(noa)
	comps.fadeOnZoom = require('../components/fadeOnZoom')(noa)

	var names = Object.keys(comps)
	for (var i = 0; i < names.length; i++) {
		self.createComponent(comps[names[i]])
	}
}



/*
 *  Built-in component data accessors
 *	Hopefully monomorphic and easy to optimize..
*/


Entities.prototype.isPlayer = function (eid) {
	return this.hasComponent(eid, this.components.player)
}
Entities.prototype.getAABB = function (eid) {
	return this.getData(eid, this.components.aabb).aabb
}
Entities.prototype.getPosition = function (eid) {
	var box = this.getData(eid, this.components.aabb).aabb
	var loc = box.base
	var size = box.vec
	return vec3.fromValues(
		loc[0] + size[0] / 2,
		loc[1],
		loc[2] + size[2] / 2
		)
}
Entities.prototype.getPhysicsBody = function (eid) {
	return this.getData(eid, this.components.physics).body
}
Entities.prototype.getMeshData = function (eid) {
	return this.getData(eid, this.components.mesh)
}




/*
 *
 *    ENTITY MANAGER API
 *
*/


Entities.prototype.isTerrainBlocked = function (x, y, z) {
	// checks if terrain location is blocked by entities
	var newbb = new aabb([x, y, z], [1, 1, 1])
	var datArr = this.getDataList(this.components.collideTerrain)
	for (var i = 0; i < datArr.length; i++) {
		var bb = this.getAABB(datArr[i].__id)
		if (newbb.intersects(bb) && !newbb.touches(bb)) return true;
	}
	return false
}


// Add a new entity, and automatically populates the main components 
// based on arguments if they're present
Entities.prototype.add = function (position, width, height, // required
	mesh, meshOffset,
	doPhysics, shadow) {
		
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
		body.onStep = function () {
			self.addComponent(eid, self.components.autoStepping)
		}
	}	
	
	// aabb component - use aabb from physics body if it's present
	var boxData = { aabb: box }
	if (body) boxData.aabb = body.aabb
	this.addComponent(eid, comps.aabb, boxData)
	
	// mesh for the entity
	if (mesh) {
		if (!meshOffset) meshOffset = vec3.create()
		this.addComponent(eid, comps.mesh, {
			mesh: mesh,
			offset: meshOffset
		})
	}
	
	// add shadow-drawing component
	if (shadow) {
		this.addComponent(eid, comps.shadow, { size: width })
	}
	
	return eid
}


Entities.prototype.remove = function (eid) {
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
	var comps = self.components
	while (self._toRemove.length) {
		var eid = self._toRemove.pop()
		if (self.hasComponent(eid, comps.mesh)) {
			self.getMeshData(eid).mesh.dispose()
		}
		self.removeEntity(eid)
	}
}



var tempvec = vec3.create()


function updateMeshPositions(self, dt) {
	// update meshes to physics positions, advanced into the future by dt
	// dt is time (ms) since physics engine tick, to avoid temporal aliasing
	// http://gafferongames.com/game-physics/fix-your-timestep/
	var comps = self.components
	var pos = tempvec

	var states = self.ecs.getComponentsData(comps.mesh.name)
	for (var i = 0; i < states.length; ++i) {
		var data = states[i]
		var id = data.__id

		if (!self.hasComponent(id, comps.physics)) continue
		var mesh = data.mesh
		var offset = data.offset
		var body = self.getPhysicsBody(id)

		vec3.add(pos, body.aabb.base, offset)
		vec3.scaleAndAdd(pos, pos, body.velocity, dt / 1000)
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
	}
}


function doCameraTracking(self, dt) {
	// set the camera target entity to track the player mesh's position
	// tests for the tracking component so that client can easily override
	
	var cid = self.noa.cameraTarget
	if (!self.hasComponent(cid, self.components.followsPlayer)) return
	
	var pid = self.noa.playerEntity
	var cam = self.getAABB(cid)
	var player = self.getAABB(pid)
	
	// camera target at 90% of entity's height
	if (self.hasComponent(pid, self.components.mesh)) {
		var pos = self.getMeshData(pid).mesh.position
		vec3.set(cam.base, pos.x, pos.y, pos.z)
		cam.base[1] += player.vec[1] * 0.4
	} else {
		vec3.scaleAndAdd(cam.base, player.base, player.vec, 0.5)  
		cam.base[1] += player.vec[1] * 0.4
	}
}





