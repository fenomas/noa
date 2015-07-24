'use strict';

var EntitySystem = require('ensy')

module.exports = function () {
	return new ECS()
}

/*
*    An Entity Component System
*
*  Basically just wraps require('ensy'), in case I need to change the 
*  underlying implementation later
*/



function ECS() {
	this._ecs = new EntitySystem()
}


ECS.prototype.createEntity = function (compList) {
	if (!compList) compList = []
	return this._ecs.createEntity(compList)
}
ECS.prototype.removeEntity = function (entID) {
	return this._ecs.removeEntity(entID)
}



ECS.prototype.createComponent = function (name, data) {
	if (!data) data = {}
	return this._ecs.addComponent(name, { state:data })
}
ECS.prototype.removeComponent = function (name) {
	return this._ecs.removeComponent(name)
}



ECS.prototype.addEntityComponents = function (entID, compList) {
	var isArr = (compList.length && typeof compList === 'object')
	if (!isArr) throw new Error('Components list must be an array!')
	return this._ecs.addComponentsToEntity(compList, entID)
}
ECS.prototype.removeEntityComponents = function (entID, compList) {
	return this._ecs.removeComponentsToEntity(compList, entID)
}
ECS.prototype.entityHasComponent = function (entID, compName) {
	return this._ecs.entityHasComponent(entID, compName)
}



ECS.prototype.getEntityComponentData = function (entID, compName) {
	return this._ecs.getComponentDataForEntity(compName, entID)
}

ECS.prototype.getComponentDataList = function (compName) {
	return this._ecs.getComponentsData(compName)
}




ECS.prototype.createAssemblage = function (assID, assemblage) {
	return this._ecs.addAssemblage(assID, assemblage)
}
ECS.prototype.removeAssemblage = function (assID) {
	return this._ecs.removeAssemblage(assID)
}
ECS.prototype.createEntityFromAssemblage = function (assID) {
	return this._ecs.createEntityFromAssemblage(assID)
}




ECS.prototype.addProcessor = function (processor) {
	return this._ecs.addProcessor(processor)
}
ECS.prototype.removeProcessor = function (processor) {
	return this._ecs.removeProcessor(processor)
}




ECS.prototype.update = function (dt) {
	return this._ecs.update(dt)
}







