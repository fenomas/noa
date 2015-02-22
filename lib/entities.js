'use strict';

var extend = require('extend')
,   aabb = require('aabb-3d')
,   vec3 = require('gl-vec3')

module.exports = function(noa, opts) {
  return new EntityManager(noa, opts)
}

var defaults = {

}


/* 
 *  Wrangles entities.
 *    An entity is anything with a physics body, a mesh, or a .tick()
*/

function EntityManager(noa, opts) {
  this.noa = noa
  var _opts = extend(defaults, opts)

  this.entitites = []
}


/*
 *    ENTITY MANAGER API
*/

EntityManager.prototype.tick = function(dt) {
  for (var i=0; i<this.entitites.length; ++i) {
    var ent = this.entitites[i]
    if (ent.tick) ent.tick(dt);
    if (ent.mesh) {
      ent.mesh.position.x = ent.body.base[0]
      ent.mesh.position.y = ent.body.base[1]
      ent.mesh.position.z = ent.body.base[2]
    }
  }
}


EntityManager.prototype.isTerrainBlocked = function(x,y,z) {
  // checks if terrain location is blocked by entities
  var newbb = new aabb( [x,y,z], [1,1,1] )
  for (var i=0; i<this.entitites.length; ++i) {
    if (this.entitites[i].blocksTerrain) {
      var bb = this.entitites[i].bb
      if (bb.intersects(newbb) && ! bb.touches(newbb)) return true;
    }
  }
  return false
}


// Add a new entity to be managed.
// shape modeled only as an AABB, 'position' at center of bottom face.
// meshCreateFcn is of signature 'function(scene)'
EntityManager.prototype.add = function( position, width, height, // required
                                         mesh, tickFcn,
                                         blocksTerrain, doPhysics ) {
  // bounding box
  var bb = new aabb([position[0]-width/2, position[1], position[2]-width/2],
                    [width, height, width])
  // rigid body in physics simulator
  var body = (doPhysics) ? this.noa.physics.addBody({}, bb) : null
  // entity class (data struct more or less)
  var ent = new Entity( bb, body, mesh, tickFcn, blocksTerrain )
  this.entitites.push(ent)
  return ent
}


EntityManager.prototype.remove = function(ent) {
  var i = this.entitites.indexOf(ent)
  if (i<0) return
  // todo: dispose the entity if needed?
  this.entitites.splice(i,1);
}






/*
 *  ENTITY struct:
 *
 *  bb:       bounding box (effectively overridden by physics body if there is one)
 *  body:     optional reference to rigid body managed by physics engine
 *  mesh:     optional reference to mesh managed by renderer
 *  tickFcn:  optional function to be called each tick
 *  blocksTerrain: whether to deny new blocks that overlap with entity's aabb
*/

function Entity(bb, body, mesh, tickFcn, blocksTerrain) {
  this.body = body || null
  this.mesh = mesh || null
  this.tick = tickFcn || null
  this.bb = (body) ? body.aabb : bb
  this.blocksTerrain = blocksTerrain
}

// get "feet" position - center of bottom face
Entity.prototype.getPosition = function() {
  var loc = this.bb.base
  var size = this.bb.vec
  return [ loc[0]+size[0]/2, loc[1], loc[2]+size[2]/2 ]
}





