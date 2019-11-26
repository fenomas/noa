

// helper to swap item to end and pop(), instead of splice()ing
export function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) { return }
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
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
