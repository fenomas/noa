

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
    var cutoff = (startTime || performance.now()) + maxTimeInMS
    var maxIter = 1000 // sanity check
    for (var i = 0; i < maxIter; i++) {
        var res = callback()
        if (res || performance.now() > cutoff) return
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
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var six = src.index(i0 + i, j0 + j, k0)
            var tix = tgt.index(ti + i, tj + j, tk)
            for (var k = 0; k < sk; k++) {
                tgt.data[tix] = src.data[six]
                six += src.stride[2]
                tix += tgt.stride[2]
            }
        }
    }
}

function doNdarrayZero(tgt, i0, j0, k0, si, sj, sk) {
    for (var i = 0; i < si; i++) {
        for (var j = 0; j < sj; j++) {
            var ix = tgt.index(i0 + i, j0 + j, k0)
            for (var k = 0; k < sk; k++) {
                tgt.data[ix] = 0
                ix += tgt.stride[2]
            }
        }
    }
}







/*
 * 
 *      strList - internal data structure for lists of chunk IDs
 * 
*/

export function StringList() {
    this.arr = []
    this.hash = {}
}
StringList.prototype.includes = function (key) {
    return this.hash[key]
}
StringList.prototype.add = function (key) {
    if (this.hash[key]) return
    this.arr.push(key)
    this.hash[key] = true
}
StringList.prototype.remove = function (key) {
    if (!this.hash[key]) return
    this.arr.splice(this.arr.indexOf(key), 1)
    delete this.hash[key]
}
StringList.prototype.count = function () { return this.arr.length }
StringList.prototype.forEach = function (a, b) { return this.arr.forEach(a, b) }
StringList.prototype.slice = function (a, b) { return this.arr.slice(a, b) }
StringList.prototype.isEmpty = function () { return (this.arr.length === 0) }
StringList.prototype.empty = function () {
    this.arr.length = 0
    this.hash = {}
}
StringList.prototype.pop = function () {
    var key = this.arr.pop()
    delete this.hash[key]
    return key
}
StringList.prototype.sort = function (keyToDistanceFn) {
    var mapping = {}
    this.arr.forEach(key => { mapping[key] = keyToDistanceFn(key) })
    this.arr.sort((a, b) => mapping[b] - mapping[a]) // DESCENDING!
}
StringList.prototype.copyFrom = function (list) {
    this.arr = list.arr.slice()
    this.hash = Object.assign({}, list.hash)
}











// simple thing for reporting time split up between several activities
export function makeProfileHook(_every, _title) {
    var title = _title || ''
    var every = _every || 1
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
export function makeThroughputHook(_every, _title) {
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
