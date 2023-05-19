
/**
 * This works around some old node-style code in a
 * dependency of box-intersect.
*/
if (window && !window['global']) {
    window['global'] = window.globalThis || {}
}

