'use strict'


module.exports = {
    Timer: Timer,
}




// simple thing for reporting time split up between several activities
function Timer(_every, _title) {
    var title = _title || ''
    var every = _every || 1
    var times = []
    var names = []
    var last = 0
    var iter = 0
    var clearNext = true

    this.start = function () {
        if (clearNext) {
            times.length = names.length = 0
            clearNext = false
        }
        last = performance.now()
        iter++
    }
    this.add = function (name) {
        var t = performance.now()
        if (names.indexOf(name) < 0) names.push(name)
        var i = names.indexOf(name)
        if (!times[i]) times[i] = 0
        times[i] += t - last
        last = t
    }
    this.report = function () {
        if (iter === every) {
            console.log(title + ':', names.map(function (name, i) {
                return name + ': ' + (times[i] / every).toFixed(2) + 'ms    '
            }).join(''), (every > 1) ? '  (avg over ' + every + ' runs)' : '')
            clearNext = true
            iter = 0
        }
    }
}



