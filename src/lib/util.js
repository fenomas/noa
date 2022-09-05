/** 
 * @module 
 * @internal exclude this file from API docs 
*/


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
    if (typeof src === 'number') {
        doNdarrayFill(src, tgt, tgtPos[0], tgtPos[1], tgtPos[2],
            size[0], size[1], size[2])
    } else {
        doNdarrayCopy(src, tgt, pos[0], pos[1], pos[2],
            size[0], size[1], size[2], tgtPos[0], tgtPos[1], tgtPos[2])
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

function doNdarrayFill(value, tgt, i0, j0, k0, si, sj, sk) {
    var dx = tgt.stride[2]
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var ix = tgt.index(i0 + i, j0 + j, k0)
            for (var k = 0; k < sk; k++) {
                tgt.data[ix] = value
                ix += dx
            }
        }
    }
}




// iterates over 3D positions a given manhattan distance from (0,0,0)
// and exit early if the callback returns true
// skips locations beyond a horiz or vertical max distance
export function iterateOverShellAtDistance(d, xmax, ymax, cb) {
    if (d === 0) return cb(0, 0, 0)
    // larger top/bottom planes of current shell
    var dx = Math.min(d, xmax)
    var dy = Math.min(d, ymax)
    if (d <= ymax) {
        for (var x = -dx; x <= dx; x++) {
            for (var z = -dx; z <= dx; z++) {
                if (cb(x, d, z)) return true
                if (cb(x, -d, z)) return true
            }
        }
    }
    // smaller side planes of shell
    if (d <= xmax) {
        for (var i = -d; i < d; i++) {
            for (var y = -dy + 1; y < dy; y++) {
                if (cb(i, y, d)) return true
                if (cb(-i, y, -d)) return true
                if (cb(d, y, -i)) return true
                if (cb(-d, y, i)) return true
            }
        }
    }
    return false
}






// function to hash three indexes (i,j,k) into one integer
// note that hash wraps around every 1024 indexes.
//      i.e.:   hash(1, 1, 1) === hash(1025, 1, -1023)
export function locationHasher(i, j, k) {
    return (i & 1023)
        | ((j & 1023) << 10)
        | ((k & 1023) << 20)
}



/*
 * 
 *      chunkStorage - a Map-backed abstraction for storing/
 *      retrieving chunk objects by their location indexes
 * 
*/

export function ChunkStorage() {
    var hash = {}
    // exposed API - getting and setting
    this.getChunkByIndexes = (i, j, k) => {
        return hash[locationHasher(i, j, k)] || null
    }
    this.storeChunkByIndexes = (i, j, k, chunk) => {
        hash[locationHasher(i, j, k)] = chunk
    }
    this.removeChunkByIndexes = (i, j, k) => {
        delete hash[locationHasher(i, j, k)]
    }
}






/*
 * 
 *      LocationQueue - simple array of [i,j,k] locations, 
 *      backed by a hash for O(1) existence checks.
 *      removals by value are O(n).
 * 
*/

export class LocationQueue {
    constructor() {
        this.arr = []
        this.hash = {}
    }
    forEach(cb, thisArg) {
        this.arr.forEach(cb, thisArg)
    }
    includes(i, j, k) {
        var id = locationHasher(i, j, k)
        return !!this.hash[id]
    }
    add(i, j, k, toFront = false) {
        var id = locationHasher(i, j, k)
        if (this.hash[id]) return
        if (toFront) {
            this.arr.unshift([i, j, k, id])
        } else {
            this.arr.push([i, j, k, id])
        }
        this.hash[id] = true
    }
    removeByIndex(ix) {
        var el = this.arr[ix]
        delete this.hash[el[3]]
        this.arr.splice(ix, 1)
    }
    remove(i, j, k) {
        var id = locationHasher(i, j, k)
        if (!this.hash[id]) return
        delete this.hash[id]
        for (var ix = 0; ix < this.arr.length; ix++) {
            if (id === this.arr[ix][3]) {
                this.arr.splice(ix, 1)
                return
            }
        }
        throw 'internal bug with location queue - hash value overlapped'
    }
    count() { return this.arr.length }
    isEmpty() { return (this.arr.length === 0) }
    empty() {
        this.arr = []
        this.hash = {}
    }
    pop() {
        var el = this.arr.pop()
        delete this.hash[el[3]]
        return el
    }
    copyFrom(queue) {
        this.arr = queue.arr.slice()
        this.hash = {}
        for (var key in queue.hash) this.hash[key] = true
    }
    sortByDistance(locToDist, reverse = false, partialOK = false) {
        var len = this.arr.length
        // should we only do a partial sort?
        var doPartial = (partialOK && len > 1000)
        if (!doPartial) {
            sortLocationArrByDistance(this.arr, locToDist, reverse)
            return
        }
        // sort just the first/last 100 elements
        var subset = this.arr.slice(0, 100).concat(this.arr.slice(len - 100))
        sortLocationArrByDistance(subset, locToDist, reverse)
        // copy the subset back over main array
        for (var i = 0; i < 100; i++) {
            this.arr[i] = subset[i]
            this.arr[len - i] = subset[200 - i]
        }
    }
}

// internal helper for preceding class
function sortLocationArrByDistance(arr, distFn, reverse) {
    var hash = {}
    for (var loc of arr) {
        hash[loc[3]] = distFn(loc[0], loc[1], loc[2])
    }
    if (reverse) {
        arr.sort((a, b) => hash[a[3]] - hash[b[3]]) // ascending
    } else {
        arr.sort((a, b) => hash[b[3]] - hash[a[3]]) // descending
    }
    hash = null
}











// simple thing for reporting time split up between several activities
export function makeProfileHook(every, title = '', filter) {
    if (!(every > 0)) return () => { }
    var times = {}
    var started = 0, last = 0, iter = 0, total = 0

    var start = () => {
        started = last = performance.now()
        iter++
    }
    var add = (name) => {
        var t = performance.now()
        times[name] = (times[name] || 0) + (t - last)
        last = t
    }
    var report = () => {
        total += performance.now() - started
        if (iter < every) return
        var out = `${title}: ${(total / every).toFixed(2)}ms  --  `
        out += Object.keys(times).map(name => {
            if (filter && (times[name] / total) < 0.05) return ''
            return `${name}: ${(times[name] / iter).toFixed(2)}ms`
        }).join('  ')
        console.log(out + `    (avg over ${every} runs)`)
        times = {}
        iter = total = 0
    }
    return (state) => {
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
