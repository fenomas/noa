var EventEmitter = require("events").EventEmitter;
import Chunk from "./chunk";
import {
    sortByReferenceArray,
    loopForTime,
    numberOfVoxelsInSphere,
} from "./util";

var PROFILE = 0;
var PROFILE_QUEUES = 0;

export default function (noa, opts) {
    return new World(noa, opts);
}

var defaultOptions = {
    chunkSize: 24,
    chunkAddDistance: 3,
    chunkRemoveDistance: 4,
};

/**
 * @class
 * @typicalname noa.world
 * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
 * @emits chunkAdded(chunk)
 * @emits chunkBeingRemoved(id, ndarray, userData)
 * @classdesc Manages the world and its chunks
 *
 * Extends `EventEmitter`
 */

function World(noa, opts) {
    this.noa = noa;
    opts = Object.assign({}, defaultOptions, opts);

    this.playerChunkLoaded = false;
    this.Chunk = Chunk;

    this.chunkSize = opts.chunkSize;
    this.chunkAddDistance = opts.chunkAddDistance;
    this.chunkRemoveDistance = opts.chunkRemoveDistance;
    if (this.chunkRemoveDistance < this.chunkAddDistance) {
        this.chunkRemoveDistance = this.chunkAddDistance;
    }

    // set this higher to cause chunks not to mesh until they have some neighbors
    this.minNeighborsToMesh = 6;

    // settings for tuning worldgen behavior and throughput
    this.maxChunksPendingCreation = 10;
    this.maxChunksPendingMeshing = 10;
    this.maxProcessingPerTick = 9; // ms
    this.maxProcessingPerRender = 5; // ms

    // set up internal state
    this._cachedWorldName = "";
    this._lastPlayerChunkID = "";
    this._chunkStorage = {};
    initChunkQueues(this);
    initChunkStorage(this);

    // triggers a short visit to the meshing queue before renders
    noa.on("beforeRender", () => beforeRender(this));

    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    var cs = this.chunkSize;
    if ((cs & (cs - 1)) === 0) {
        var shift = Math.log2(cs) | 0;
        var mask = (cs - 1) | 0;
        this._worldCoordToChunkCoord = (coord) => (coord >> shift) | 0;
        this._worldCoordToChunkIndex = (coord) => (coord & mask) | 0;
    } else {
        this._worldCoordToChunkCoord = (coord) => Math.floor(coord / cs) | 0;
        this._worldCoordToChunkIndex = (coord) => ((coord % cs) + cs) % cs | 0;
    }
}
World.prototype = Object.create(EventEmitter.prototype);

/*
 *
 *
 *
 *
 *                  PUBLIC API
 *
 *
 *
 *
 */

/** @param x,y,z */
World.prototype.getBlockID = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) return 0;
    return chunk.get(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z)
    );
};

/** @param x,y,z */
World.prototype.getBlockSolidity = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) return false;
    return !!chunk.getSolidityAt(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z)
    );
};

/** @param x,y,z */
World.prototype.getBlockOpacity = function (x, y, z) {
    var id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockOpacity(id);
};

/** @param x,y,z */
World.prototype.getBlockFluidity = function (x, y, z) {
    var id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockFluidity(id);
};

/** @param x,y,z */
World.prototype.getBlockProperties = function (x, y, z) {
    var id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockProps(id);
};

/** @param x,y,z */
World.prototype.getBlockObjectMesh = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) return 0;
    return chunk.getObjectMeshAt(
        this._worldCoordToChunkIndex(x),
        this._worldCoordToChunkIndex(y),
        this._worldCoordToChunkIndex(z)
    );
};

/** @param x,y,z */
World.prototype.setBlockID = function (val, x, y, z) {
    var i = this._worldCoordToChunkCoord(x);
    var j = this._worldCoordToChunkCoord(y);
    var k = this._worldCoordToChunkCoord(z);
    var ix = this._worldCoordToChunkIndex(x);
    var iy = this._worldCoordToChunkIndex(y);
    var iz = this._worldCoordToChunkIndex(z);

    // logic inside the chunk will trigger a remesh for chunk and
    // any neighbors that need it
    var chunk = this._getChunk(i, j, k);
    if (chunk) chunk.set(ix, iy, iz, val);
};

/** @param x,y,z */
World.prototype.isBoxUnobstructed = function (box) {
    var base = box.base;
    var max = box.max;
    for (var i = Math.floor(base[0]); i < max[0] + 1; i++) {
        for (var j = Math.floor(base[1]); j < max[1] + 1; j++) {
            for (var k = Math.floor(base[2]); k < max[2] + 1; k++) {
                if (this.getBlockSolidity(i, j, k)) return false;
            }
            ``;
        }
    }
    return true;
};

/** client should call this after creating a chunk's worth of data (as an ndarray)
 * If userData is passed in it will be attached to the chunk
 * @param id
 * @param array
 * @param userData
 */
World.prototype.setChunkData = function (id, array, userData, objectsData) {
    setChunkData(this, id, array, userData, objectsData);
};

/** Tells noa to discard voxel data within a given `AABB` (e.g. because
 * the game client received updated data from a server).
 * The engine will mark all affected chunks for disposal, and will later emit
 * new `worldDataNeeded` events (if the chunk is still in draw range).
 * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event
 * for the client to save data from.
 */
World.prototype.invalidateVoxelsInAABB = function (box) {
    invalidateChunksInBox(this, box);
};

/*
 *
 *
 *
 *                  internals:
 *
 *          tick functions that process queues and trigger events
 *
 *
 *
 */

World.prototype.tick = function () {
    var tickStartTime = performance.now();

    // if world has changed, mark everything to be removed and re-requested
    if (this._cachedWorldName !== this.noa.worldName) {
        markAllChunksForRemoval(this);
        this._cachedWorldName = this.noa.worldName;
    }

    // current player chunk changed since last tick?
    var pos = getPlayerChunkCoords(this);
    var chunkID = getChunkID(pos[0], pos[1], pos[2]);
    var changedChunks = chunkID != this._lastPlayerChunkID;
    if (changedChunks) {
        this.emit("playerEnteredChunk", pos[0], pos[1], pos[2]);
        this._lastPlayerChunkID = chunkID;
    }
    profile_hook("start");
    profile_queues_hook("start");

    // possibly scan for chunks to add/remove
    if (changedChunks) {
        findDistantChunksToRemove(this, pos[0], pos[1], pos[2]);
        profile_hook("remQueue");
    }
    var numChunks = numberOfVoxelsInSphere(this.chunkAddDistance);
    if (changedChunks || this._chunkIDsKnown.length < numChunks) {
        findNewChunksInRange(this, pos[0], pos[1], pos[2]);
        profile_hook("addQueue");
    }

    // process (create or mesh) some chunks, up to max iteration time
    loopForTime(
        this.maxProcessingPerTick,
        () => {
            var done = processRequestQueue(this);
            profile_hook("requests");
            done = done && processRemoveQueue(this);
            profile_hook("removes");
            done = done && processMeshingQueue(this, false);
            profile_hook("meshes");
            return done;
        },
        tickStartTime
    );

    // when time is left over, look for low-priority extra meshing
    var dt = performance.now() - tickStartTime;
    if (dt + 2 < this.maxProcessingPerTick) {
        lookForChunksToMesh(this);
        profile_hook("looking");
        loopForTime(
            this.maxProcessingPerTick,
            () => {
                var done = processMeshingQueue(this, false);
                profile_hook("meshes");
                return done;
            },
            tickStartTime,
            true
        );
    }

    // track whether the player's local chunk is loaded and ready or not
    var pChunk = this._getChunk(pos[0], pos[1], pos[2]);
    this.playerChunkLoaded = !!pChunk;

    profile_queues_hook("end");
    profile_hook("end");
};

function beforeRender(world) {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    loopForTime(world.maxProcessingPerRender, () => {
        return processMeshingQueue(world, true);
    });
}

/*
 *
 *
 *
 *              chunk IDs, storage, and lookup/retrieval
 *
 *
 *
 */

function getChunkID(i, j, k) {
    // chunk coords -> canonical string ID
    return i + "|" + j + "|" + k;
}

function parseChunkID(id) {
    // chunk ID -> coords
    var arr = id.split("|");
    return [parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2])];
}

function initChunkStorage(world) {
    // var chunkHash = ndHash([1024, 1024, 1024])
    world._getChunk = (i, j, k) => {
        var id = getChunkID(i, j, k);
        return world._chunkStorage[id] || null;
    };
    world._setChunk = (i, j, k, value) => {
        var id = getChunkID(i, j, k);
        if (value) {
            world._chunkStorage[id] = value;
        } else {
            delete world._chunkStorage[id];
        }
    };
    // chunk accessor for internal use
    world._getChunkByCoords = function (x, y, z) {
        var i = world._worldCoordToChunkCoord(x);
        var j = world._worldCoordToChunkCoord(y);
        var k = world._worldCoordToChunkCoord(z);
        return world._getChunk(i, j, k);
    };
}

function getPlayerChunkCoords(world) {
    var pos = world.noa.entities.getPosition(world.noa.playerEntity);
    var i = world._worldCoordToChunkCoord(pos[0]);
    var j = world._worldCoordToChunkCoord(pos[1]);
    var k = world._worldCoordToChunkCoord(pos[2]);
    return [i, j, k];
}

/*
 *
 *
 *
 *              chunk queues and queue processing
 *
 *
 *
 */

function initChunkQueues(world) {
    world._chunkIDsKnown = []; // all chunks existing in any queue
    world._chunkIDsToRequest = []; // not yet requested from client
    world._chunkIDsPending = []; // requested, awaiting creation
    world._chunkIDsToMesh = []; // created but not yet meshed
    world._chunkIDsToMeshFirst = []; // priority meshing queue
    world._chunkIDsToRemove = []; // chunks awaiting disposal
    // accessor for chunks to queue themselves for remeshing
    world._queueChunkForRemesh = (chunk) => {
        queueChunkForRemesh(world, chunk);
    };
}

// process neighborhood chunks, add missing ones to "toRequest" and "inMemory"
function findNewChunksInRange(world, ci, cj, ck) {
    var add = Math.ceil(world.chunkAddDistance);
    var addDistSq = world.chunkAddDistance * world.chunkAddDistance;
    var known = world._chunkIDsKnown;
    var toRequest = world._chunkIDsToRequest;
    // search all nearby chunk locations
    for (var i = ci - add; i <= ci + add; ++i) {
        for (var j = cj - add; j <= cj + add; ++j) {
            for (var k = ck - add; k <= ck + add; ++k) {
                var id = getChunkID(i, j, k);
                if (known.includes(id)) continue;
                var di = i - ci;
                var dj = j - cj;
                var dk = k - ck;
                var distSq = di * di + dj * dj + dk * dk;
                if (distSq > addDistSq) continue;
                enqueueID(id, known);
                enqueueID(id, toRequest);
            }
        }
    }
    sortChunkIDQueue(world, toRequest);
}

// rebuild queue of chunks to be removed from around (ci,cj,ck)
function findDistantChunksToRemove(world, ci, cj, ck) {
    var remDistSq = world.chunkRemoveDistance * world.chunkRemoveDistance;
    var toRemove = world._chunkIDsToRemove;
    world._chunkIDsKnown.forEach((id) => {
        if (toRemove.includes(id)) return;
        var loc = parseChunkID(id);
        var di = loc[0] - ci;
        var dj = loc[1] - cj;
        var dk = loc[2] - ck;
        var distSq = di * di + dj * dj + dk * dk;
        if (distSq < remDistSq) return;
        // flag chunk for removal and remove it from work queues
        enqueueID(id, world._chunkIDsToRemove);
        unenqueueID(id, world._chunkIDsToRequest);
        unenqueueID(id, world._chunkIDsToMesh);
        unenqueueID(id, world._chunkIDsToMeshFirst);
    });
    sortChunkIDQueue(world, toRemove);
}

// invalidate chunks overlapping the given AABB
function invalidateChunksInBox(world, box) {
    var min = box.base.map((n) => Math.floor(world._worldCoordToChunkCoord(n)));
    var max = box.max.map((n) => Math.floor(world._worldCoordToChunkCoord(n)));
    world._chunkIDsKnown.forEach((id) => {
        var pos = parseChunkID(id);
        for (var i = 0; i < 3; i++) {
            if (pos[i] < min[i] || pos[i] > max[i]) return;
        }
        if (world._chunkIDsToRemove.includes(id)) return;
        enqueueID(id, world._chunkIDsToRequest);
    });
}

// when current world changes - empty work queues and mark all for removal
function markAllChunksForRemoval(world) {
    world._chunkIDsToRemove = world._chunkIDsKnown.slice();
    world._chunkIDsToRequest.length = 0;
    world._chunkIDsToMesh.length = 0;
    world._chunkIDsToMeshFirst.length = 0;
    sortChunkIDQueue(world, world._chunkIDsToRemove);
}

// look for chunks that could stand to be re-meshed
function lookForChunksToMesh(world) {
    var queue = world._chunkIDsKnown;
    var ct = Math.min(50, queue.length);
    var numQueued =
        world._chunkIDsToMesh.length + world._chunkIDsToMeshFirst.length;
    for (var i = 0; i < ct; i++) {
        lookIndex = (lookIndex + 1) % queue.length;
        var id = queue[lookIndex];
        var chunk = world._chunkStorage[id];
        if (!chunk) continue;
        var nc = chunk._neighborCount;
        if (nc < world.minNeighborsToMesh) continue;
        if (nc <= chunk._maxMeshedNeighbors) continue;
        queueChunkForRemesh(world, chunk);
        if (++numQueued > 10) return;
    }
}
var lookIndex = 0;

// run through chunk tracking queues looking for work to do next
function processRequestQueue(world) {
    var queue = world._chunkIDsToRequest;
    if (queue.length === 0) return true;
    // skip if too many outstanding requests, or if meshing queue is full
    var pending = world._chunkIDsPending.length;
    var toMesh = world._chunkIDsToMesh.length;
    if (pending >= world.maxChunksPendingCreation) return true;
    if (toMesh >= world.maxChunksPendingMeshing) return true;
    var id = queue.shift();

    requestNewChunk(world, id);
    return queue.length === 0;
}

function processRemoveQueue(world) {
    var queue = world._chunkIDsToRemove;
    if (queue.length === 0) return true;
    removeChunk(world, queue.shift());
    return queue.length === 0;
}

// similar to above but for chunks waiting to be meshed
function processMeshingQueue(world, firstOnly) {
    var queue = world._chunkIDsToMeshFirst;
    if (queue.length === 0 && !firstOnly) queue = world._chunkIDsToMesh;
    if (queue.length === 0) return true;

    var id = queue.shift();
    if (world._chunkIDsToRemove.includes(id)) return;
    var chunk = world._chunkStorage[id];
    if (chunk) doChunkRemesh(world, chunk);
}

/*
 *
 *
 *
 *              chunk lifecycle - create / set / remove / modify
 *
 *
 *
 */

// create chunk object and request voxel data from client
function requestNewChunk(world, id) {
    var pos = parseChunkID(id);
    var i = pos[0];
    var j = pos[1];
    var k = pos[2];
    var size = world.chunkSize;
    var dataArr = Chunk._createVoxelArray(world.chunkSize);
    var worldName = world.noa.worldName;
    var requestID = [i, j, k, worldName].join("|");
    var x = i * size;
    var y = j * size;
    var z = k * size;
    enqueueID(id, world._chunkIDsPending);
    world.emit("worldDataNeeded", requestID, dataArr, x, y, z, worldName);
    profile_queues_hook("request");
}

// called when client sets a chunk's voxel data
// If userData is passed in it will be attached to the chunk
function setChunkData(world, reqID, array, userData, objectsData) {
    var arr = reqID.split("|");
    var i = parseInt(arr.shift());
    var j = parseInt(arr.shift());
    var k = parseInt(arr.shift());
    var worldName = arr.join("|");
    var id = getChunkID(i, j, k);
    unenqueueID(id, world._chunkIDsPending);
    // discard data if it's for a world that's no longer current
    if (worldName !== world.noa.worldName) return;
    // discard if chunk is no longer needed
    if (!world._chunkIDsKnown.includes(id)) return;
    if (world._chunkIDsToRemove.includes(id)) return;
    var chunk = world._chunkStorage[id];
    if (!chunk) {
        // if chunk doesn't exist, create and init
        var size = world.chunkSize;
        chunk = new Chunk(world.noa, id, i, j, k, size, array);
        world._setChunk(i, j, k, chunk);
        chunk.requestID = reqID;
        chunk.userData = userData;
        updateNeighborsOfChunk(world, i, j, k, chunk);
        world.noa.rendering.prepareChunkForRendering(chunk);
        world.emit("chunkAdded", chunk);
    } else {
        // else we're updating data for an existing chunk
        chunk._updateVoxelArray(array);
        // assume neighbors need remeshing
        var list = chunk._neighbors.data;
        list.forEach((nab) => {
            if (!nab || nab === chunk) return;
            if (nab._neighborCount > 20) queueChunkForRemesh(world, nab);
        });
    }
    // Add objects data to the chunk, update block coordinates to object ID mapping
    Object.entries(objectsData).forEach(([objectID, object]) => {
        chunk.objects.set(objectID, object);
        if (object.coords) {
            object.coords.forEach((coord) => {
                chunk.coordsToObjectID.set(coord, objectID);
            });
        }
    });

    // chunk can now be meshed...
    queueChunkForRemesh(world, chunk);
    profile_queues_hook("receive");
}

// remove a chunk that wound up in the remove queue
function removeChunk(world, id) {
    var loc = parseChunkID(id);
    var chunk = world._getChunk(loc[0], loc[1], loc[2]);
    if (chunk) {
        world.emit(
            "chunkBeingRemoved",
            chunk.requestID,
            chunk.voxels,
            chunk.userData
        );
        world.noa.rendering.disposeChunkForRendering(chunk);
        chunk.dispose();
        profile_queues_hook("dispose");
        updateNeighborsOfChunk(world, loc[0], loc[1], loc[2], null);
    }
    world._setChunk(loc[0], loc[1], loc[2], null);
    unenqueueID(id, world._chunkIDsKnown);
    unenqueueID(id, world._chunkIDsToMesh);
    unenqueueID(id, world._chunkIDsToMeshFirst);
}

function queueChunkForRemesh(world, chunk) {
    var nc = chunk._neighborCount;
    var limit = Math.min(world.minNeighborsToMesh, 26);
    if (nc < limit) return;
    chunk._terrainDirty = true;
    var queue = nc === 26 ? world._chunkIDsToMeshFirst : world._chunkIDsToMesh;
    enqueueID(chunk.id, queue);
}

function doChunkRemesh(world, chunk) {
    unenqueueID(chunk.id, world._chunkIDsToMesh);
    unenqueueID(chunk.id, world._chunkIDsToMeshFirst);
    chunk.updateMeshes();
    profile_queues_hook("mesh");
}

/*
 *
 *
 *
 *          misc helpers and implementation functions
 *
 *
 *
 */

// uniquely enqueue a string id into an array of them
function enqueueID(id, queue) {
    var i = queue.indexOf(id);
    if (i >= 0) return;
    queue.push(id);
}

// remove string id from queue if it exists
function unenqueueID(id, queue) {
    var i = queue.indexOf(id);
    if (i >= 0) queue.splice(i, 1);
}

// sorts a queue of chunk IDs by distance from player (ascending)
function sortChunkIDQueue(world, queue) {
    var loc = getPlayerChunkCoords(world);
    var dists = queue.map((id) => {
        var pos = parseChunkID(id);
        var dx = pos[0] - loc[0];
        var dy = pos[1] - loc[1];
        var dz = pos[2] - loc[2];
        // bias towards keeping verticals together for now
        return 3 * (dx * dx + dz * dz) + Math.abs(dy);
    });
    sortByReferenceArray(queue, dists);
}

// keep neighbor data updated when chunk is added or removed
function updateNeighborsOfChunk(world, ci, cj, ck, chunk) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            for (var k = -1; k <= 1; k++) {
                if ((i | j | k) === 0) continue;
                var nid = getChunkID(ci + i, cj + j, ck + k);
                var neighbor = world._chunkStorage[nid];
                if (!neighbor) continue;
                if (chunk) {
                    chunk._neighborCount++;
                    chunk._neighbors.set(i, j, k, neighbor);
                    neighbor._neighborCount++;
                    neighbor._neighbors.set(-i, -j, -k, chunk);
                    // flag for remesh when chunk gets its last neighbor
                    if (neighbor._neighborCount === 26) {
                        queueChunkForRemesh(world, neighbor);
                    }
                } else {
                    neighbor._neighborCount--;
                    neighbor._neighbors.set(-i, -j, -k, null);
                }
            }
        }
    }
}

/*
 *
 *
 *
 *
 *                  debugging
 *
 *
 *
 *
 */

World.prototype.report = function () {
    console.log("World report - playerChunkLoaded: ", this.playerChunkLoaded);
    _report(this, "  known:     ", this._chunkIDsKnown, true);
    _report(this, "  to request:", this._chunkIDsToRequest);
    _report(this, "  to remove: ", this._chunkIDsToRemove);
    _report(this, "  creating:  ", this._chunkIDsPending);
    _report(
        this,
        "  to mesh:   ",
        this._chunkIDsToMesh.concat(this._chunkIDsToMeshFirst)
    );
};

function _report(world, name, arr, ext) {
    var full = 0,
        empty = 0,
        exist = 0,
        surrounded = 0,
        remeshes = [];
    arr.forEach((id) => {
        var chunk = world._chunkStorage[id];
        if (!chunk) return;
        exist++;
        remeshes.push(chunk._timesMeshed);
        if (chunk.isFull) full++;
        if (chunk.isEmpty) empty++;
        if (chunk._neighborCount === 26) surrounded++;
    });
    var out = arr.length.toString().padEnd(8);
    out += ("exist: " + exist).padEnd(12);
    out += ("full: " + full).padEnd(12);
    out += ("empty: " + empty).padEnd(12);
    out += ("surr: " + surrounded).padEnd(12);
    if (ext) {
        var sum = remeshes.reduce((acc, val) => acc + val);
        var max = remeshes.reduce((acc, val) => Math.max(acc, val));
        var min = remeshes.reduce((acc, val) => Math.min(acc, val));
        out += "times meshed: avg " + (sum / exist).toFixed(2);
        out += "  max " + max;
        out += "  min " + min;
    }
    console.log(name, out);
}

import { makeProfileHook, makeThroughputHook } from "./util";
var profile_hook = PROFILE ? makeProfileHook(100, "world ticks:") : () => {};
var profile_queues_hook = PROFILE_QUEUES
    ? makeThroughputHook(100, "chunks/sec:")
    : () => {};
