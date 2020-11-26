

// helper to swap item to end and pop(), instead of splice()ing
export function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) return
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
}



// loop over a function for a few ms, or until it returns true
export function loopForTime(maxTimeInMS, callback, startTime) {
    var t0 = startTime || performance.now()
    var res = callback()
    if (res) return
    var t1 = performance.now(), dt = t1 - startTime
    // tweak time to make the average delay equal to the desired amt
    var cutoff = t0 + maxTimeInMS - dt / 2
    if (t1 > cutoff) return
    var maxIter = 1000 // sanity check
    for (var i = 0; i < maxIter; i++) {
        if (callback() || performance.now() > cutoff) return
    }
}





// ....
export function numberOfVoxelsInSphere(rad) {
    if (rad === prevRad) return prevAnswer
    var ext = Math.ceil(rad), ct = 0, rsq = rad * rad
    for (var i = -ext; i <= ext; ++i) {
        for (var j = -ext; j <= ext; ++j) {
            for (var k = -ext; k <= ext; ++k) {
                var dsq = i * i + j * j + k * k
                if (dsq < rsq) ct++
            }
        }
    }
    prevRad = rad
    prevAnswer = ct
    return ct
}
var prevRad = 0, prevAnswer = 0





// partly "unrolled" loops to copy contents of ndarrays
// when there's no source, zeroes out the array instead
export function copyNdarrayContents(src, tgt, pos, size, tgtPos) {
    if (src) {
        doNdarrayCopy(src, tgt, pos[0], pos[1], pos[2],
            size[0], size[1], size[2], tgtPos[0], tgtPos[1], tgtPos[2])
    } else {
        doNdarrayZero(tgt, tgtPos[0], tgtPos[1], tgtPos[2],
            size[0], size[1], size[2])
    }
}
function doNdarrayCopy(src, tgt, i0, j0, k0, si, sj, sk, ti, tj, tk) {
    var sdx = src.stride[2]
    var tdx = tgt.stride[2]
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var six = src.index(i0 + i, j0 + j, k0)
            var tix = tgt.index(ti + i, tj + j, tk)
            for (var k = 0; k < sk; k++) {
                tgt.data[tix] = src.data[six]
                six += sdx
                tix += tdx
            }
        }
    }
}

function doNdarrayZero(tgt, i0, j0, k0, si, sj, sk) {
    var dx = tgt.stride[2]
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var ix = tgt.index(i0 + i, j0 + j, k0)
            for (var k = 0; k < sk; k++) {
                tgt.data[ix] = 0
                ix += dx
            }
        }
    }
}




//  hash an array of indexes [i,j,k] to an integer ID. 
//  Used by stuff below. Wraps every 1024 indexes.
var hashLocation = (() => {
    var bits = 10, twobits = bits * 2
    var mask = (1 << bits) - 1
    return function hashLocation(i, j, k) {
        var id = i & mask
        id += (j & mask) << bits
        id += (k & mask) << twobits
        return id
    }
})()



/*
 * 
 *      chunkStorage - a Map-backed abstraction for storing/
 *      retrieving chunk objects by their location indexes
 * 
*/

export function ChunkStorage() {
    var map = new Map()
    // exposed API - getting and setting
    this.getChunkByIndexes = (i, j, k) => {
        var id = hashLocation(i, j, k)
        return map.get(id) || null
    }
    this.storeChunkByIndexes = (i, j, k, chunk) => {
        var id = hashLocation(i, j, k)
        if (chunk) { map.set(id, chunk); return }
        map.delete(id)
    }
}







/*
 * 
 *      LocationQueue - simple array of [i,j,k] locations, 
 *      backed by a Set for O(1) existence checks.
 *      removals by value are O(n).
 * 
*/

export function LocationQueue() {
    this.arr = []
    this.set = new Set()
}
LocationQueue.prototype.forEach = function (a, b) { this.arr.forEach(a, b) }
LocationQueue.prototype.includes = function (i, j, k) {
    var id = hashLocation(i, j, k)
    return this.set.has(id)
}
LocationQueue.prototype.add = function (i, j, k) {
    var id = hashLocation(i, j, k)
    if (this.set.has(id)) return
    this.arr.push([i, j, k])
    this.set.add(id)
}
LocationQueue.prototype.removeByIndex = function (ix) {
    var el = this.arr[ix]
    var id = hashLocation(el[0], el[1], el[2])
    this.set.delete(id)
    this.arr.splice(ix, 1)
}
LocationQueue.prototype.remove = function (i, j, k) {
    var id = hashLocation(i, j, k)
    if (!this.set.has(id)) return
    this.set.delete(id)
    for (var ix = 0; ix < this.arr.length; ix++) {
        var el = this.arr[ix]
        if (el[0] !== i || el[1] !== j || el[2] !== k) continue
        this.arr.splice(ix, 1)
        return
    }
    throw 'internal bug with location queue - hash value overlapped'
}
LocationQueue.prototype.count = function () { return this.arr.length }
LocationQueue.prototype.isEmpty = function () { return (this.arr.length === 0) }
LocationQueue.prototype.empty = function () {
    this.arr.length = 0
    this.set.clear()
}
LocationQueue.prototype.pop = function () {
    var el = this.arr.pop()
    var id = hashLocation(el[0], el[1], el[2])
    this.set.delete(id)
    return el
}
LocationQueue.prototype.copyFrom = function (queue) {
    this.arr = queue.arr.slice()
    this.set.clear()
    queue.set.forEach((val, key) => this.set.add(key, true))
}
LocationQueue.prototype.sortByDistance = function (locToDist) {
    var map = new Map()
    this.arr.forEach((loc, i) => { map.set(loc, locToDist(loc)) })
    this.arr.sort((a, b) => map.get(b) - map.get(a)) // DESCENDING!
}











// simple thing for reporting time split up between several activities
export function makeProfileHook(every, title, filter) {
    if (!(every > 0)) return () => { }
    title = title || ''
    var times = []
    var names = []
    var started = 0
    var last = 0
    var iter = 0
    var total = 0
    var clearNext = true

    var start = function () {
        if (clearNext) {
            times.length = names.length = 0
            clearNext = false
        }
        started = last = performance.now()
        iter++
    }
    var add = function (name) {
        var t = performance.now()
        if (names.indexOf(name) < 0) names.push(name)
        var i = names.indexOf(name)
        if (!times[i]) times[i] = 0
        times[i] += t - last
        last = t
    }
    var report = function () {
        total += performance.now() - started
        if (iter === every) {
            var head = title + ' total ' + (total / every).toFixed(2) + 'ms (avg, ' + every + ' runs)    '
            console.log(head, names.map(function (name, i) {
                if (filter && times[i] / total < 0.05) return ''
                return name + ': ' + (times[i] / every).toFixed(2) + 'ms    '
            }).join(''))
            clearNext = true
            iter = 0
            total = 0
        }
    }
    return function profile_hook(state) {
        if (state === 'start') start()
        else if (state === 'end') report()
        else add(state)
    }
}




// simple thing for reporting time actions/sec
export function makeThroughputHook(_every, _title, filter) {
    var title = _title || ''
    var every = _every || 1
    var counts = {}
    var started = performance.now()
    var iter = 0
    return function profile_hook(state) {
        if (state === 'start') return
        if (state === 'end') {
            if (++iter < every) return
            var t = performance.now()
            console.log(title + '   ' + Object.keys(counts).map(k => {
                var through = counts[k] / (t - started) * 1000
                counts[k] = 0
                return k + ':' + through.toFixed(2) + '   '
            }).join(''))
            started = t
            iter = 0
        } else {
            if (!counts[state]) counts[state] = 0
            counts[state]++
        }
    }
}
