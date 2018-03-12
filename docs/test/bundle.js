/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 19);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  create: __webpack_require__(9)
  , clone: __webpack_require__(21)
  , angle: __webpack_require__(22)
  , fromValues: __webpack_require__(10)
  , copy: __webpack_require__(23)
  , set: __webpack_require__(24)
  , add: __webpack_require__(25)
  , subtract: __webpack_require__(26)
  , multiply: __webpack_require__(27)
  , divide: __webpack_require__(28)
  , min: __webpack_require__(29)
  , max: __webpack_require__(30)
  , scale: __webpack_require__(31)
  , scaleAndAdd: __webpack_require__(32)
  , distance: __webpack_require__(33)
  , squaredDistance: __webpack_require__(34)
  , length: __webpack_require__(35)
  , squaredLength: __webpack_require__(36)
  , negate: __webpack_require__(37)
  , inverse: __webpack_require__(38)
  , normalize: __webpack_require__(11)
  , dot: __webpack_require__(12)
  , cross: __webpack_require__(39)
  , lerp: __webpack_require__(40)
  , random: __webpack_require__(41)
  , transformMat4: __webpack_require__(42)
  , transformMat3: __webpack_require__(43)
  , transformQuat: __webpack_require__(44)
  , rotateX: __webpack_require__(45)
  , rotateY: __webpack_require__(46)
  , rotateZ: __webpack_require__(47)
  , forEach: __webpack_require__(48)
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = {
    Timer: Timer,
    removeUnorderedListItem: removeUnorderedListItem,
}




// helper to swap item to end and pop(), instead of splice()ing
function removeUnorderedListItem(list, item) {
    var i = list.indexOf(item)
    if (i < 0) { return }
    if (i === list.length - 1) {
        list.pop()
    } else {
        list[i] = list.pop()
    }
}




// simple thing for reporting time split up between several activities
function Timer(_every, _title) {
    var title = _title || ''
    var every = _every || 1
    var times = []
    var names = []
    var started = 0
    var last = 0
    var iter = 0
    var total = 0
    var clearNext = true

    this.start = function () {
        if (clearNext) {
            times.length = names.length = 0
            clearNext = false
        }
        started = last = performance.now()
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
}





/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = AABB

var vec3 = __webpack_require__(0)

function AABB(pos, vec) {

  if(!(this instanceof AABB)) {
    return new AABB(pos, vec)
  }

  var pos2 = vec3.create()
  vec3.add(pos2, pos, vec)
 
  this.base = vec3.min(vec3.create(), pos, pos2)
  this.vec = vec3.clone(vec)
  this.max = vec3.max(vec3.create(), pos, pos2)

  this.mag = vec3.length(this.vec)

}

var cons = AABB
  , proto = cons.prototype

proto.width = function() {
  return this.vec[0]
}

proto.height = function() {
  return this.vec[1]
}

proto.depth = function() {
  return this.vec[2]
}

proto.x0 = function() {
  return this.base[0]
}

proto.y0 = function() {
  return this.base[1]
}

proto.z0 = function() {
  return this.base[2]
}

proto.x1 = function() {
  return this.max[0]
}

proto.y1 = function() {
  return this.max[1]
}

proto.z1 = function() {
  return this.max[2]
}

proto.translate = function(by) {
  vec3.add(this.max, this.max, by)
  vec3.add(this.base, this.base, by)
  return this
}

proto.setPosition = function(pos) {
  vec3.add(this.max, pos, this.vec)
  vec3.copy(this.base, pos)
  return this
}

proto.expand = function(aabb) {
  var max = vec3.create()
    , min = vec3.create()

  vec3.max(max, aabb.max, this.max)
  vec3.min(min, aabb.base, this.base)
  vec3.subtract(max, max, min)

  return new AABB(min, max)
}

proto.intersects = function(aabb) {
  if(aabb.base[0] > this.max[0]) return false
  if(aabb.base[1] > this.max[1]) return false
  if(aabb.base[2] > this.max[2]) return false
  if(aabb.max[0] < this.base[0]) return false
  if(aabb.max[1] < this.base[1]) return false
  if(aabb.max[2] < this.base[2]) return false

  return true
}

proto.touches = function(aabb) {

  var intersection = this.union(aabb);

  return (intersection !== null) &&
         ((intersection.width() == 0) ||
         (intersection.height() == 0) || 
         (intersection.depth() == 0))

}

proto.union = function(aabb) {
  if(!this.intersects(aabb)) return null

  var base_x = Math.max(aabb.base[0], this.base[0])
    , base_y = Math.max(aabb.base[1], this.base[1])
    , base_z = Math.max(aabb.base[2], this.base[2])
    , max_x = Math.min(aabb.max[0], this.max[0])
    , max_y = Math.min(aabb.max[1], this.max[1])
    , max_z = Math.min(aabb.max[2], this.max[2])

  return new AABB([base_x, base_y, base_z], [max_x - base_x, max_y - base_y, max_z - base_z])
}






/***/ }),
/* 4 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var iota = __webpack_require__(13)
var isBuffer = __webpack_require__(49)

var hasTypedArrays  = ((typeof Float64Array) !== "undefined")

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride
  var terms = new Array(stride.length)
  var i
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i]
  }
  terms.sort(compare1st)
  var result = new Array(terms.length)
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1]
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("")
  if(dimension < 0) {
    className = "View_Nil" + dtype
  }
  var useGetters = (dtype === "generic")

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}"
    var procedure = new Function(code)
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}"
    var procedure = new Function("TrivialArray", code)
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"]

  //Create constructor for view
  var indices = iota(dimension)
  var args = indices.map(function(i) { return "i"+i })
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+")
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",")
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",")
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension)

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})")

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]")
  } else {
    code.push("Object.defineProperty(proto,'order',{get:")
    if(dimension < 4) {
      code.push("function "+className+"_order(){")
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})")
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})")
      }
    } else {
      code.push("ORDER})")
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){")
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}")
  } else {
    code.push("return this.data["+index_str+"]=v}")
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){")
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}")
  } else {
    code.push("return this.data["+index_str+"]}")
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}")

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}")

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" })
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" })
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","))
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}")

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil")
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}")

  //view.transpose():
  var tShape = new Array(dimension)
  var tStride = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]"
    tStride[i] = "b[i"+i+"]"
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}")

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset")
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}")
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}")

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}")

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"))
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "buffer":[],
  "generic":[]
}

;(function() {
  for(var id in CACHED_CONSTRUCTORS) {
    CACHED_CONSTRUCTORS[id].push(compileConstructor(id, -1))
  }
});

function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0]
    return ctor([])
  } else if(typeof data === "number") {
    data = [data]
  }
  if(shape === undefined) {
    shape = [ data.length ]
  }
  var d = shape.length
  if(stride === undefined) {
    stride = new Array(d)
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz
      sz *= shape[i]
    }
  }
  if(offset === undefined) {
    offset = 0
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i]
      }
    }
  }
  var dtype = arrayDType(data)
  var ctor_list = CACHED_CONSTRUCTORS[dtype]
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1))
  }
  var ctor = ctor_list[d+1]
  return ctor(data, shape, stride, offset)
}

module.exports = wrappedNDArrayCtor


/***/ }),
/* 6 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, Buffer) {

var bits = __webpack_require__(8)
var dup = __webpack_require__(92)

//Legacy pool support
if(!global.__TYPEDARRAY_POOL) {
  global.__TYPEDARRAY_POOL = {
      UINT8   : dup([32, 0])
    , UINT16  : dup([32, 0])
    , UINT32  : dup([32, 0])
    , INT8    : dup([32, 0])
    , INT16   : dup([32, 0])
    , INT32   : dup([32, 0])
    , FLOAT   : dup([32, 0])
    , DOUBLE  : dup([32, 0])
    , DATA    : dup([32, 0])
    , UINT8C  : dup([32, 0])
    , BUFFER  : dup([32, 0])
  }
}

var hasUint8C = (typeof Uint8ClampedArray) !== 'undefined'
var POOL = global.__TYPEDARRAY_POOL

//Upgrade pool
if(!POOL.UINT8C) {
  POOL.UINT8C = dup([32, 0])
}
if(!POOL.BUFFER) {
  POOL.BUFFER = dup([32, 0])
}

//New technique: Only allocate from ArrayBufferView and Buffer
var DATA    = POOL.DATA
  , BUFFER  = POOL.BUFFER

exports.free = function free(array) {
  if(Buffer.isBuffer(array)) {
    BUFFER[bits.log2(array.length)].push(array)
  } else {
    if(Object.prototype.toString.call(array) !== '[object ArrayBuffer]') {
      array = array.buffer
    }
    if(!array) {
      return
    }
    var n = array.length || array.byteLength
    var log_n = bits.log2(n)|0
    DATA[log_n].push(array)
  }
}

function freeArrayBuffer(buffer) {
  if(!buffer) {
    return
  }
  var n = buffer.length || buffer.byteLength
  var log_n = bits.log2(n)
  DATA[log_n].push(buffer)
}

function freeTypedArray(array) {
  freeArrayBuffer(array.buffer)
}

exports.freeUint8 =
exports.freeUint16 =
exports.freeUint32 =
exports.freeInt8 =
exports.freeInt16 =
exports.freeInt32 =
exports.freeFloat32 = 
exports.freeFloat =
exports.freeFloat64 = 
exports.freeDouble = 
exports.freeUint8Clamped = 
exports.freeDataView = freeTypedArray

exports.freeArrayBuffer = freeArrayBuffer

exports.freeBuffer = function freeBuffer(array) {
  BUFFER[bits.log2(array.length)].push(array)
}

exports.malloc = function malloc(n, dtype) {
  if(dtype === undefined || dtype === 'arraybuffer') {
    return mallocArrayBuffer(n)
  } else {
    switch(dtype) {
      case 'uint8':
        return mallocUint8(n)
      case 'uint16':
        return mallocUint16(n)
      case 'uint32':
        return mallocUint32(n)
      case 'int8':
        return mallocInt8(n)
      case 'int16':
        return mallocInt16(n)
      case 'int32':
        return mallocInt32(n)
      case 'float':
      case 'float32':
        return mallocFloat(n)
      case 'double':
      case 'float64':
        return mallocDouble(n)
      case 'uint8_clamped':
        return mallocUint8Clamped(n)
      case 'buffer':
        return mallocBuffer(n)
      case 'data':
      case 'dataview':
        return mallocDataView(n)

      default:
        return null
    }
  }
  return null
}

function mallocArrayBuffer(n) {
  var n = bits.nextPow2(n)
  var log_n = bits.log2(n)
  var d = DATA[log_n]
  if(d.length > 0) {
    return d.pop()
  }
  return new ArrayBuffer(n)
}
exports.mallocArrayBuffer = mallocArrayBuffer

function mallocUint8(n) {
  return new Uint8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocUint8 = mallocUint8

function mallocUint16(n) {
  return new Uint16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocUint16 = mallocUint16

function mallocUint32(n) {
  return new Uint32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocUint32 = mallocUint32

function mallocInt8(n) {
  return new Int8Array(mallocArrayBuffer(n), 0, n)
}
exports.mallocInt8 = mallocInt8

function mallocInt16(n) {
  return new Int16Array(mallocArrayBuffer(2*n), 0, n)
}
exports.mallocInt16 = mallocInt16

function mallocInt32(n) {
  return new Int32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocInt32 = mallocInt32

function mallocFloat(n) {
  return new Float32Array(mallocArrayBuffer(4*n), 0, n)
}
exports.mallocFloat32 = exports.mallocFloat = mallocFloat

function mallocDouble(n) {
  return new Float64Array(mallocArrayBuffer(8*n), 0, n)
}
exports.mallocFloat64 = exports.mallocDouble = mallocDouble

function mallocUint8Clamped(n) {
  if(hasUint8C) {
    return new Uint8ClampedArray(mallocArrayBuffer(n), 0, n)
  } else {
    return mallocUint8(n)
  }
}
exports.mallocUint8Clamped = mallocUint8Clamped

function mallocDataView(n) {
  return new DataView(mallocArrayBuffer(n), 0, n)
}
exports.mallocDataView = mallocDataView

function mallocBuffer(n) {
  n = bits.nextPow2(n)
  var log_n = bits.log2(n)
  var cache = BUFFER[log_n]
  if(cache.length > 0) {
    return cache.pop()
  }
  return new Buffer(n)
}
exports.mallocBuffer = mallocBuffer

exports.clearCache = function clearCache() {
  for(var i=0; i<32; ++i) {
    POOL.UINT8[i].length = 0
    POOL.UINT16[i].length = 0
    POOL.UINT32[i].length = 0
    POOL.INT8[i].length = 0
    POOL.INT16[i].length = 0
    POOL.INT32[i].length = 0
    POOL.FLOAT[i].length = 0
    POOL.DOUBLE[i].length = 0
    POOL.UINT8C[i].length = 0
    DATA[i].length = 0
    BUFFER[i].length = 0
  }
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(88).Buffer))

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

 "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}



/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = create;

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
    var out = new Float32Array(3)
    out[0] = 0
    out[1] = 0
    out[2] = 0
    return out
}

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = fromValues;

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
    var out = new Float32Array(3)
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = normalize;

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    var len = x*x + y*y + z*z
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
        out[0] = a[0] * len
        out[1] = a[1] * len
        out[2] = a[2] * len
    }
    return out
}

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = dot;

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(53);

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(54);

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(52)))

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



// reused array instances

var tr_arr = []
var ldi_arr = []
var tri_arr = []
var step_arr = []
var tDelta_arr = []
var tNext_arr = []
var vec_arr = []
var normed_arr = []
var base_arr = []
var max_arr = []
var left_arr = []
var result_arr = []



// core implementation:

function sweep_impl(getVoxel, callback, vec, base, max, epsilon) {

    // consider algo as a raycast along the AABB's leading corner
    // as raycast enters each new voxel, iterate in 2D over the AABB's 
    // leading face in that axis looking for collisions
    // 
    // original raycast implementation: https://github.com/andyhall/fast-voxel-raycast
    // original raycast paper: http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf

    var tr = tr_arr
    var ldi = ldi_arr
    var tri = tri_arr
    var step = step_arr
    var tDelta = tDelta_arr
    var tNext = tNext_arr
    var normed = normed_arr

    var floor = Math.floor
    var cumulative_t = 0.0
    var t = 0.0
    var max_t = 0.0
    var axis = 0
    var i = 0


    // init for the current sweep vector and take first step
    initSweep()
    if (max_t === 0) return 0

    axis = stepForward()

    // loop along raycast vector
    while (t <= max_t) {

        // sweeps over leading face of AABB
        if (checkCollision(axis)) {
            // calls the callback and decides whether to continue
            var done = handleCollision()
            if (done) return cumulative_t
        }

        axis = stepForward()
    }

    // reached the end of the vector unobstructed, finish and exit
    cumulative_t += max_t
    for (i = 0; i < 3; i++) {
        base[i] += vec[i]
        max[i] += vec[i]
    }
    return cumulative_t





    // low-level implementations of each step:
    function initSweep() {

        // parametrization t along raycast
        t = 0.0
        max_t = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2])
        if (max_t === 0) return
        for (var i = 0; i < 3; i++) {
            var dir = (vec[i] >= 0)
            step[i] = dir ? 1 : -1
            // trailing / trailing edge coords
            var lead = dir ? max[i] : base[i]
            tr[i] = dir ? base[i] : max[i]
            // int values of lead/trail edges
            ldi[i] = leadEdgeToInt(lead, step[i])
            tri[i] = trailEdgeToInt(tr[i], step[i])
            // normed vector
            normed[i] = vec[i] / max_t
            // distance along t required to move one voxel in each axis
            tDelta[i] = Math.abs(1 / normed[i])
            // location of nearest voxel boundary, in units of t 
            var dist = dir ? (ldi[i] + 1 - lead) : (lead - ldi[i])
            tNext[i] = (tDelta[i] < Infinity) ? tDelta[i] * dist : Infinity
        }

    }


    // check for collisions - iterate over the leading face on the advancing axis

    function checkCollision(i_axis) {
        var stepx = step[0]
        var x0 = (i_axis === 0) ? ldi[0] : tri[0]
        var x1 = ldi[0] + stepx

        var stepy = step[1]
        var y0 = (i_axis === 1) ? ldi[1] : tri[1]
        var y1 = ldi[1] + stepy

        var stepz = step[2]
        var z0 = (i_axis === 2) ? ldi[2] : tri[2]
        var z1 = ldi[2] + stepz

        // var j_axis = (i_axis + 1) % 3
        // var k_axis = (i_axis + 2) % 3
        // var s = ['x', 'y', 'z'][i_axis]
        // var js = ['x', 'y', 'z'][j_axis]
        // var ks = ['x', 'y', 'z'][k_axis]
        // var i0 = [x0, y0, z0][i_axis]
        // var j0 = [x0, y0, z0][j_axis]
        // var k0 = [x0, y0, z0][k_axis]
        // var i1 = [x1 - stepx, y1 - stepy, z1 - stepz][i_axis]
        // var j1 = [x1 - stepx, y1 - stepy, z1 - stepz][j_axis]
        // var k1 = [x1 - stepx, y1 - stepy, z1 - stepz][k_axis]
        // console.log('=== step', s, 'to', i0, '   sweep', js, j0 + ',' + j1, '   ', ks, k0 + ',' + k1)

        for (var x = x0; x != x1; x += stepx) {
            for (var y = y0; y != y1; y += stepy) {
                for (var z = z0; z != z1; z += stepz) {
                    if (getVoxel(x, y, z)) return true
                }
            }
        }
        return false
    }


    // on collision - call the callback and return or set up for the next sweep

    function handleCollision() {

        // set up for callback
        cumulative_t += t
        var dir = step[axis]

        // vector moved so far, and left to move
        var done = t / max_t
        var left = left_arr
        for (i = 0; i < 3; i++) {
            var dv = vec[i] * done
            base[i] += dv
            max[i] += dv
            left[i] = vec[i] - dv
        }

        // set leading edge of stepped axis exactly to voxel boundary
        // else we'll sometimes rounding error beyond it
        if (dir > 0) {
            max[axis] = Math.round(max[axis])
        } else {
            base[axis] = Math.round(base[axis])
        }
        
        // call back to let client update the "left to go" vector
        var res = callback(cumulative_t, axis, dir, left)

        // bail out out on truthy response
        if (res) return true

        // init for new sweep along vec
        for (i = 0; i < 3; i++) vec[i] = left[i]
        initSweep()
        if (max_t === 0) return true // no vector left

        return false
    }


    // advance to next voxel boundary, and return which axis was stepped

    function stepForward() {
        var axis = (tNext[0] < tNext[1]) ?
            ((tNext[0] < tNext[2]) ? 0 : 2) :
            ((tNext[1] < tNext[2]) ? 1 : 2)
        var dt = tNext[axis] - t
        t = tNext[axis]
        ldi[axis] += step[axis]
        tNext[axis] += tDelta[axis]
        for (i = 0; i < 3; i++) {
            tr[i] += dt * normed[i]
            tri[i] = trailEdgeToInt(tr[i], step[i])
        }

        return axis
    }



    function leadEdgeToInt(coord, step) {
        return floor(coord - step * epsilon)
    }
    function trailEdgeToInt(coord, step) {
        return floor(coord + step * epsilon)
    }

}





// conform inputs

function sweep(getVoxel, box, dir, callback, noTranslate, epsilon) {

    var vec = vec_arr
    var base = base_arr
    var max = max_arr
    var result = result_arr

    // init parameter float arrays
    for (var i = 0; i < 3; i++) {
        vec[i] = +dir[i]
        max[i] = +box.max[i]
        base[i] = +box.base[i]
    }

    if (!epsilon) epsilon = 1e-10

    // run sweep implementation
    var dist = sweep_impl(getVoxel, callback, vec, base, max, epsilon)

    // translate box by distance needed to updated base value
    if (!noTranslate) {
        for (i = 0; i < 3; i++) {
            result[i] = (dir[i] > 0) ? max[i] - box.max[i] : base[i] - box.base[i]
        }
        box.translate(result)
    }

    // return value is total distance moved (not necessarily magnitude of [end]-[start])
    return dist
}

module.exports = sweep



/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = {}
module.exports = constants


/* 
 *  Internal voxel data representation
 *
 *  Each voxel is stored as a Uint16.
 *  Voxel id is stored in lowest bits, and flags stored in upper bits for fast retrieval
 *  
 *  Stores, from right to left:
 *     9 bits of voxel ID
 *     4 bits of variation (e.g. orientation)  --- Not yet being used!
 *     1 bit solidity (i.e. physics-wise)
 *     1 bit opacity (whether voxel obscures neighboring faces)
 *     1 bit object marker (marks non-terrain blocks with custom meshes)
*/


var ID_BITS = 9
var ID_MASK = (1 << ID_BITS) - 1

var VAR_BITS = 4
var VAR_OFFSET = ID_BITS
var VAR_MASK = ((1 << VAR_BITS) - 1) << VAR_OFFSET

var n = ID_BITS + VAR_BITS
var SOLID_BIT = 1 << n++
var OPAQUE_BIT = 1 << n++
var OBJECT_BIT = 1 << n++

// exports

constants.ID_MASK = ID_MASK
constants.VAR_MASK = VAR_MASK
constants.SOLID_BIT =  SOLID_BIT
constants.OPAQUE_BIT = OPAQUE_BIT
constants.OBJECT_BIT = OBJECT_BIT




/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  init:           sqInit,
  sweepBipartite: sweepBipartite,
  sweepComplete:  sweepComplete,
  scanBipartite:  scanBipartite,
  scanComplete:   scanComplete
}

var pool  = __webpack_require__(7)
var bits  = __webpack_require__(8)
var isort = __webpack_require__(93)

//Flag for blue
var BLUE_FLAG = (1<<28)

//1D sweep event queue stuff (use pool to save space)
var INIT_CAPACITY      = 1024
var RED_SWEEP_QUEUE    = pool.mallocInt32(INIT_CAPACITY)
var RED_SWEEP_INDEX    = pool.mallocInt32(INIT_CAPACITY)
var BLUE_SWEEP_QUEUE   = pool.mallocInt32(INIT_CAPACITY)
var BLUE_SWEEP_INDEX   = pool.mallocInt32(INIT_CAPACITY)
var COMMON_SWEEP_QUEUE = pool.mallocInt32(INIT_CAPACITY)
var COMMON_SWEEP_INDEX = pool.mallocInt32(INIT_CAPACITY)
var SWEEP_EVENTS       = pool.mallocDouble(INIT_CAPACITY * 8)

//Reserves memory for the 1D sweep data structures
function sqInit(count) {
  var rcount = bits.nextPow2(count)
  if(RED_SWEEP_QUEUE.length < rcount) {
    pool.free(RED_SWEEP_QUEUE)
    RED_SWEEP_QUEUE = pool.mallocInt32(rcount)
  }
  if(RED_SWEEP_INDEX.length < rcount) {
    pool.free(RED_SWEEP_INDEX)
    RED_SWEEP_INDEX = pool.mallocInt32(rcount)
  }
  if(BLUE_SWEEP_QUEUE.length < rcount) {
    pool.free(BLUE_SWEEP_QUEUE)
    BLUE_SWEEP_QUEUE = pool.mallocInt32(rcount)
  }
  if(BLUE_SWEEP_INDEX.length < rcount) {
    pool.free(BLUE_SWEEP_INDEX)
    BLUE_SWEEP_INDEX = pool.mallocInt32(rcount)
  }
  if(COMMON_SWEEP_QUEUE.length < rcount) {
    pool.free(COMMON_SWEEP_QUEUE)
    COMMON_SWEEP_QUEUE = pool.mallocInt32(rcount)
  }
  if(COMMON_SWEEP_INDEX.length < rcount) {
    pool.free(COMMON_SWEEP_INDEX)
    COMMON_SWEEP_INDEX = pool.mallocInt32(rcount)
  }
  var eventLength = 8 * rcount
  if(SWEEP_EVENTS.length < eventLength) {
    pool.free(SWEEP_EVENTS)
    SWEEP_EVENTS = pool.mallocDouble(eventLength)
  }
}

//Remove an item from the active queue in O(1)
function sqPop(queue, index, count, item) {
  var idx = index[item]
  var top = queue[count-1]
  queue[idx] = top
  index[top] = idx
}

//Insert an item into the active queue in O(1)
function sqPush(queue, index, count, item) {
  queue[count] = item
  index[item]  = count
}

//Recursion base case: use 1D sweep algorithm
function sweepBipartite(
    d, visit,
    redStart,  redEnd, red, redIndex,
    blueStart, blueEnd, blue, blueIndex) {

  //store events as pairs [coordinate, idx]
  //
  //  red create:  -(idx+1)
  //  red destroy: idx
  //  blue create: -(idx+BLUE_FLAG)
  //  blue destroy: idx+BLUE_FLAG
  //
  var ptr      = 0
  var elemSize = 2*d
  var istart   = d-1
  var iend     = elemSize-1

  for(var i=redStart; i<redEnd; ++i) {
    var idx = redIndex[i]
    var redOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = red[redOffset+istart]
    SWEEP_EVENTS[ptr++] = -(idx+1)
    SWEEP_EVENTS[ptr++] = red[redOffset+iend]
    SWEEP_EVENTS[ptr++] = idx
  }

  for(var i=blueStart; i<blueEnd; ++i) {
    var idx = blueIndex[i]+BLUE_FLAG
    var blueOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = blue[blueOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
    SWEEP_EVENTS[ptr++] = blue[blueOffset+iend]
    SWEEP_EVENTS[ptr++] = idx
  }

  //process events from left->right
  var n = ptr >>> 1
  isort(SWEEP_EVENTS, n)
  
  var redActive  = 0
  var blueActive = 0
  for(var i=0; i<n; ++i) {
    var e = SWEEP_EVENTS[2*i+1]|0
    if(e >= BLUE_FLAG) {
      //blue destroy event
      e = (e-BLUE_FLAG)|0
      sqPop(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive--, e)
    } else if(e >= 0) {
      //red destroy event
      sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, e)
    } else if(e <= -BLUE_FLAG) {
      //blue create event
      e = (-e-BLUE_FLAG)|0
      for(var j=0; j<redActive; ++j) {
        var retval = visit(RED_SWEEP_QUEUE[j], e)
        if(retval !== void 0) {
          return retval
        }
      }
      sqPush(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive++, e)
    } else {
      //red create event
      e = (-e-1)|0
      for(var j=0; j<blueActive; ++j) {
        var retval = visit(e, BLUE_SWEEP_QUEUE[j])
        if(retval !== void 0) {
          return retval
        }
      }
      sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, e)
    }
  }
}

//Complete sweep
function sweepComplete(d, visit, 
  redStart, redEnd, red, redIndex,
  blueStart, blueEnd, blue, blueIndex) {

  var ptr      = 0
  var elemSize = 2*d
  var istart   = d-1
  var iend     = elemSize-1

  for(var i=redStart; i<redEnd; ++i) {
    var idx = (redIndex[i]+1)<<1
    var redOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = red[redOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
    SWEEP_EVENTS[ptr++] = red[redOffset+iend]
    SWEEP_EVENTS[ptr++] = idx
  }

  for(var i=blueStart; i<blueEnd; ++i) {
    var idx = (blueIndex[i]+1)<<1
    var blueOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = blue[blueOffset+istart]
    SWEEP_EVENTS[ptr++] = (-idx)|1
    SWEEP_EVENTS[ptr++] = blue[blueOffset+iend]
    SWEEP_EVENTS[ptr++] = idx|1
  }

  //process events from left->right
  var n = ptr >>> 1
  isort(SWEEP_EVENTS, n)
  
  var redActive    = 0
  var blueActive   = 0
  var commonActive = 0
  for(var i=0; i<n; ++i) {
    var e     = SWEEP_EVENTS[2*i+1]|0
    var color = e&1
    if(i < n-1 && (e>>1) === (SWEEP_EVENTS[2*i+3]>>1)) {
      color = 2
      i += 1
    }
    
    if(e < 0) {
      //Create event
      var id = -(e>>1) - 1

      //Intersect with common
      for(var j=0; j<commonActive; ++j) {
        var retval = visit(COMMON_SWEEP_QUEUE[j], id)
        if(retval !== void 0) {
          return retval
        }
      }

      if(color !== 0) {
        //Intersect with red
        for(var j=0; j<redActive; ++j) {
          var retval = visit(RED_SWEEP_QUEUE[j], id)
          if(retval !== void 0) {
            return retval
          }
        }
      }

      if(color !== 1) {
        //Intersect with blue
        for(var j=0; j<blueActive; ++j) {
          var retval = visit(BLUE_SWEEP_QUEUE[j], id)
          if(retval !== void 0) {
            return retval
          }
        }
      }

      if(color === 0) {
        //Red
        sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, id)
      } else if(color === 1) {
        //Blue
        sqPush(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive++, id)
      } else if(color === 2) {
        //Both
        sqPush(COMMON_SWEEP_QUEUE, COMMON_SWEEP_INDEX, commonActive++, id)
      }
    } else {
      //Destroy event
      var id = (e>>1) - 1
      if(color === 0) {
        //Red
        sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, id)
      } else if(color === 1) {
        //Blue
        sqPop(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive--, id)
      } else if(color === 2) {
        //Both
        sqPop(COMMON_SWEEP_QUEUE, COMMON_SWEEP_INDEX, commonActive--, id)
      }
    }
  }
}

//Sweep and prune/scanline algorithm:
//  Scan along axis, detect intersections
//  Brute force all boxes along axis
function scanBipartite(
  d, axis, visit, flip,
  redStart,  redEnd, red, redIndex,
  blueStart, blueEnd, blue, blueIndex) {
  
  var ptr      = 0
  var elemSize = 2*d
  var istart   = axis
  var iend     = axis+d

  var redShift  = 1
  var blueShift = 1
  if(flip) {
    blueShift = BLUE_FLAG
  } else {
    redShift  = BLUE_FLAG
  }

  for(var i=redStart; i<redEnd; ++i) {
    var idx = i + redShift
    var redOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = red[redOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
    SWEEP_EVENTS[ptr++] = red[redOffset+iend]
    SWEEP_EVENTS[ptr++] = idx
  }
  for(var i=blueStart; i<blueEnd; ++i) {
    var idx = i + blueShift
    var blueOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = blue[blueOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
  }

  //process events from left->right
  var n = ptr >>> 1
  isort(SWEEP_EVENTS, n)
  
  var redActive    = 0
  for(var i=0; i<n; ++i) {
    var e = SWEEP_EVENTS[2*i+1]|0
    if(e < 0) {
      var idx   = -e
      var isRed = false
      if(idx >= BLUE_FLAG) {
        isRed = !flip
        idx -= BLUE_FLAG 
      } else {
        isRed = !!flip
        idx -= 1
      }
      if(isRed) {
        sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, idx)
      } else {
        var blueId  = blueIndex[idx]
        var bluePtr = elemSize * idx
        
        var b0 = blue[bluePtr+axis+1]
        var b1 = blue[bluePtr+axis+1+d]

red_loop:
        for(var j=0; j<redActive; ++j) {
          var oidx   = RED_SWEEP_QUEUE[j]
          var redPtr = elemSize * oidx

          if(b1 < red[redPtr+axis+1] || 
             red[redPtr+axis+1+d] < b0) {
            continue
          }

          for(var k=axis+2; k<d; ++k) {
            if(blue[bluePtr + k + d] < red[redPtr + k] || 
               red[redPtr + k + d] < blue[bluePtr + k]) {
              continue red_loop
            }
          }

          var redId  = redIndex[oidx]
          var retval
          if(flip) {
            retval = visit(blueId, redId)
          } else {
            retval = visit(redId, blueId)
          }
          if(retval !== void 0) {
            return retval 
          }
        }
      }
    } else {
      sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, e - redShift)
    }
  }
}

function scanComplete(
  d, axis, visit,
  redStart,  redEnd, red, redIndex,
  blueStart, blueEnd, blue, blueIndex) {

  var ptr      = 0
  var elemSize = 2*d
  var istart   = axis
  var iend     = axis+d

  for(var i=redStart; i<redEnd; ++i) {
    var idx = i + BLUE_FLAG
    var redOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = red[redOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
    SWEEP_EVENTS[ptr++] = red[redOffset+iend]
    SWEEP_EVENTS[ptr++] = idx
  }
  for(var i=blueStart; i<blueEnd; ++i) {
    var idx = i + 1
    var blueOffset = elemSize*i
    SWEEP_EVENTS[ptr++] = blue[blueOffset+istart]
    SWEEP_EVENTS[ptr++] = -idx
  }

  //process events from left->right
  var n = ptr >>> 1
  isort(SWEEP_EVENTS, n)
  
  var redActive    = 0
  for(var i=0; i<n; ++i) {
    var e = SWEEP_EVENTS[2*i+1]|0
    if(e < 0) {
      var idx   = -e
      if(idx >= BLUE_FLAG) {
        RED_SWEEP_QUEUE[redActive++] = idx - BLUE_FLAG
      } else {
        idx -= 1
        var blueId  = blueIndex[idx]
        var bluePtr = elemSize * idx

        var b0 = blue[bluePtr+axis+1]
        var b1 = blue[bluePtr+axis+1+d]

red_loop:
        for(var j=0; j<redActive; ++j) {
          var oidx   = RED_SWEEP_QUEUE[j]
          var redId  = redIndex[oidx]

          if(redId === blueId) {
            break
          }

          var redPtr = elemSize * oidx
          if(b1 < red[redPtr+axis+1] || 
            red[redPtr+axis+1+d] < b0) {
            continue
          }
          for(var k=axis+2; k<d; ++k) {
            if(blue[bluePtr + k + d] < red[redPtr + k] || 
               red[redPtr + k + d]   < blue[bluePtr + k]) {
              continue red_loop
            }
          }

          var retval = visit(redId, blueId)
          if(retval !== void 0) {
            return retval 
          }
        }
      }
    } else {
      var idx = e - BLUE_FLAG
      for(var j=redActive-1; j>=0; --j) {
        if(RED_SWEEP_QUEUE[j] === idx) {
          for(var k=j+1; k<redActive; ++k) {
            RED_SWEEP_QUEUE[k-1] = RED_SWEEP_QUEUE[k]
          }
          break
        }
      }
      --redActive
    }
  }
}

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = genPartition

var code = 'for(var j=2*a,k=j*c,l=k,m=c,n=b,o=a+b,p=c;d>p;++p,k+=j){var _;if($)if(m===p)m+=1,l+=j;else{for(var s=0;j>s;++s){var t=e[k+s];e[k+s]=e[l],e[l++]=t}var u=f[p];f[p]=f[m],f[m++]=u}}return m'

function genPartition(predicate, args) {
  var fargs ='abcdef'.split('').concat(args)
  var reads = []
  if(predicate.indexOf('lo') >= 0) {
    reads.push('lo=e[k+n]')
  }
  if(predicate.indexOf('hi') >= 0) {
    reads.push('hi=e[k+o]')
  }
  fargs.push(
    code.replace('_', reads.join())
        .replace('$', predicate))
  return Function.apply(void 0, fargs)
}

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals BABYLON */



/** 
 * Testbed.
*/


var noaEngine = __webpack_require__(20)

var opts = {
	showFPS: true,
	inverseY: true,
	chunkSize: 32,
	chunkAddDistance: 2,
	chunkRemoveDistance: 3,
	blockTestDistance: 50,
	texturePath: 'textures/',
	playerStart: [0.5, 5, 0.5],
	playerHeight: 1.4,
	playerWidth: 0.6,
	playerAutoStep: true,
	useAO: true,
	AOmultipliers: [0.92, 0.8, 0.5],
	reverseAOmultiplier: 1.0,
}



// create engine
var noa = noaEngine(opts)



//		World generation


// block materials
var brownish = [0.45, 0.36, 0.22]
var greenish = [0.1, 0.8, 0.2]
noa.registry.registerMaterial('grass', greenish, null)
noa.registry.registerMaterial('dirt', brownish, null, false)
var strs = ['a', 'b', 'c', 'd', '1', '2']
for (var i = 0; i < 6; i++) {
	var s = strs[i]
	noa.registry.registerMaterial(s, null, s + '.png')
	noa.registry.registerMaterial('t' + s, null, 't' + s + '.png', true)
}
noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null)


// register a shinyDirt block with a custom render material
var shinyMat = noa.rendering.makeStandardMaterial('shinyDirtMat')
shinyMat.specularColor.copyFromFloats(1, 1, 1)
shinyMat.specularPower = 32
shinyMat.bumpTexture = new BABYLON.Texture('textures/stone.png', scene);
noa.registry.registerMaterial('shinyDirt', brownish, null, false, shinyMat)


// object block mesh
var mesh = BABYLON.Mesh.CreateBox('b', 1, noa.rendering.getScene())
var mat = BABYLON.Matrix.Scaling(0.2, 1, 0.2)
mat.setTranslation(new BABYLON.Vector3(0, 0.5, 0))
mesh.bakeTransformIntoVertices(mat)


// block types registration
var _id = 1
var dirtID = noa.registry.registerBlock(_id++, { material: 'dirt' })
var shinyDirtID = noa.registry.registerBlock(_id++, { material: 'shinyDirt' })
var grassID = noa.registry.registerBlock(_id++, { material: 'grass' })
var testID1 = noa.registry.registerBlock(_id++, { material: ['b', 'd', '1', '2', 'c', 'a',] })
var testID2 = noa.registry.registerBlock(_id++, {
	material: ['tb', 'td', 't1', 't2', 'tc', 'ta',],
	opaque: false,
})
var testID3 = noa.registry.registerBlock(_id++, { material: ['1', '2', 'a',] })
var waterID = noa.registry.registerBlock(_id++, {
	material: 'water',
	fluid: true
})
var customID = noa.registry.registerBlock(_id++, {
	blockMesh: mesh,
	opaque: false,
	onCustomMeshCreate: function (mesh, x, y, z) {
		mesh.rotation.y = ((x + 0.234) * 1.234 + (z + 0.567) * 6.78) % (2 * Math.PI)
	},
})





// add a listener for when the engine requests a new world chunk
// `data` is an ndarray - see https://github.com/scijs/ndarray
noa.world.on('worldDataNeeded', function (id, data, x, y, z) {
	// populate ndarray with world data (block IDs or 0 for air)
	for (var i = 0; i < data.shape[0]; ++i) {
		for (var k = 0; k < data.shape[2]; ++k) {
			var height = getHeightMap(x + i, z + k)
			for (var j = 0; j < data.shape[1]; ++j) {
				var b = decideBlock(x + i, y + j, z + k, height)
				if (b) data.set(i, j, k, b)
			}
		}
	}
	// pass the finished data back to the game engine
	noa.world.setChunkData(id, data)
})

// worldgen - return a heightmap for a given [x,z]
function getHeightMap(x, z) {
	var xs = 0.8 + 2 * Math.sin(x / 10)
	var zs = 0.4 + 2 * Math.sin(z / 15 + x / 30)
	return xs + zs
}

function decideBlock(x, y, z, height) {
	// flat area to NE
	if (x > 0 && z > 0) {
		var h = 1
		if (z == 63 || x == 63) h = 20
		return (y < h) ? grassID : 0
	}
	// general stuff
	if (y < height) {
		return (y < 0) ? dirtID : grassID
	} else {
		return (y < 1) ? waterID : 0
	}
}



setTimeout(function () {
	addWorldFeatures()
}, 1000)

function addWorldFeatures() {
	noa.setBlock(testID1, -6, 5, 6)
	noa.setBlock(testID2, -4, 5, 6)
	noa.setBlock(testID3, -2, 5, 6)

	var z = 5
	makeRows(10, 5, z, shinyDirtID)
	makeRows(10, 5, z + 2, dirtID)
	makeRows(10, 5, z + 5, dirtID)
	makeRows(10, 5, z + 9, dirtID)
	makeRows(10, 5, z + 14, dirtID)
	z += 18
	makeRows(10, 5, z, customID)
	makeRows(10, 5, z + 2, customID)
	makeRows(10, 5, z + 5, customID)
	makeRows(10, 5, z + 9, customID)
	makeRows(10, 5, z + 14, customID)
}

function makeRows(length, x, z, block) {
	for (var i = 0; i < length; i++) {
		noa.setBlock(block, x + i, 1, z + i)
		noa.setBlock(block, length * 2 + x - i, 1, z + i)
	}
}


// 		add a mesh to represent the player


// get the player entity's ID and other info (aabb, size)
var eid = noa.playerEntity
var dat = noa.entities.getPositionData(eid)
var w = dat.width
var h = dat.height

// make a Babylon.js mesh and scale it, etc.
var scene = noa.rendering.getScene()  // Babylon's "Scene" object
var mesh = BABYLON.Mesh.CreateBox('player', 1, scene)
mesh.scaling.x = mesh.scaling.z = w
mesh.scaling.y = h

// offset of mesh relative to the entity's "position" (center of its feet)
var offset = [0, h / 2, 0]

// a "mesh" component to the player entity
noa.entities.addComponent(eid, noa.entities.names.mesh, {
	mesh: mesh,
	offset: offset
})




// 		Interactivity:


// on left mouse, set targeted block to be air
noa.inputs.down.on('fire', function () {
	if (noa.targetedBlock) noa.setBlock(0, noa.targetedBlock.position)
})

// place block on alt-fire (RMB/E)
noa.inputs.down.on('alt-fire', function () {
	if (noa.targetedBlock) noa.addBlock(pickedID, noa.targetedBlock.adjacent)
})
var pickedID = grassID

// pick block on middle fire (MMB/Q)
noa.inputs.down.on('mid-fire', function () {
	if (noa.targetedBlock) pickedID = noa.targetedBlock.blockID
})


// each tick, consume any scroll events and use them to zoom camera
var zoom = 0
noa.on('tick', function (dt) {
	var scroll = noa.inputs.state.scrolly
	if (scroll === 0) return

	// handle zoom controls
	zoom += (scroll > 0) ? 1 : -1
	if (zoom < 0) zoom = 0
	if (zoom > 10) zoom = 10
	noa.rendering.zoomDistance = zoom
})



// pausing

noa.inputs.bind('pause', 'P')
noa.inputs.down.on('pause', function () {
	paused = !paused
	noa.setPaused(paused)
})
var paused = false



// world swapping test

function setWorld(switched) {
	dirtID = (switched) ? 2 : 1
	grassID = (switched) ? 1 : 2
}

noa.inputs.bind('swap-world', 'O')
noa.inputs.down.on('swap-world', function () {
	swapped = !swapped
	setWorld(swapped)
	noa.world.invalidateAllChunks()
})
var swapped = false







/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var aabb = __webpack_require__(3)
var vec3 = __webpack_require__(0)
var extend = __webpack_require__(1)
var ndarray = __webpack_require__(5)
var EventEmitter = __webpack_require__(4).EventEmitter
var createContainer = __webpack_require__(50)
var createRendering = __webpack_require__(63)
var createWorld = __webpack_require__(64)
var createInputs = __webpack_require__(69)
var createPhysics = __webpack_require__(73)
var createCamControls = __webpack_require__(76)
var createRegistry = __webpack_require__(77)
var createEntities = __webpack_require__(78)
var raycast = __webpack_require__(101)


module.exports = Engine



// profiling flag
var PROFILE = 0
var PROFILE_RENDER = 0




var defaults = {
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    tickRate: 30,
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    skipDefaultHighlighting: false,
}

/**
 * Main engine object.  
 * Emits: *tick, beforeRender, afterRender, targetBlockChanged*
 * 
 * ```js
 * var noaEngine = require('noa-engine')
 * var noa = noaEngine(opts)
 * ```
 * 
 * @class noa
*/

function Engine(opts) {
    if (!(this instanceof Engine)) return new Engine(opts)
    opts = extend(defaults, opts)
    this._tickRate = opts.tickRate
    this._paused = false
    this._dragOutsideLock = opts.dragCameraOutsidePointerLock
    var self = this

    // container (html/div) manager
    this.container = createContainer(this, opts)

    // inputs manager - abstracts key/mouse input
    this.inputs = createInputs(this, opts, this.container.element)

    // create block/item property registry
    this.registry = createRegistry(this, opts)

    // create world manager
    this.world = createWorld(this, opts)

    // rendering manager - abstracts all draws to 3D context
    this.rendering = createRendering(this, opts, this.container.canvas)

    // Entity manager / Entity Component System (ECS)
    this.entities = createEntities(this, opts)
    // convenience
    this.ents = this.entities

    // physics engine - solves collisions, properties, etc.
    this.physics = createPhysics(this, opts)

    // camera controller
    this.cameraControls = createCamControls(this, opts)


    var ents = this.ents

    /** Entity id for the player entity */
    this.playerEntity = ents.add(
        opts.playerStart,    // starting location- TODO: get from options
        opts.playerWidth, opts.playerHeight,
        null, null,          // no mesh for now, no meshOffset, 
        true, true
    )

    // make player entity it collide with terrain and other entities
    ents.addComponent(this.playerEntity, ents.names.collideTerrain)
    ents.addComponent(this.playerEntity, ents.names.collideEntities)

    // adjust default physics parameters
    var body = ents.getPhysicsBody(this.playerEntity)
    body.gravityMultiplier = 2 // less floaty
    body.autoStep = opts.playerAutoStep // auto step onto blocks

    /** reference to player entity's physics body */
    this.playerBody = body

    // input component - sets entity's movement state from key inputs
    ents.addComponent(this.playerEntity, ents.names.receivesInputs)

    // add a component to make player mesh fade out when zooming in
    ents.addComponent(this.playerEntity, ents.names.fadeOnZoom)

    // movement component - applies movement forces
    // todo: populate movement settings from options
    var moveOpts = {
        airJumps: 1
    }
    ents.addComponent(this.playerEntity, ents.names.movement, moveOpts)

    // how high above the player's position the eye is (for picking, camera tracking)  
    this.playerEyeOffset = 0.9 * opts.playerHeight




    // set up block targeting
    this.blockTestDistance = opts.blockTestDistance || 10

    /** function for which block IDs are targetable. 
     * Defaults to a solidity check, but can be overridden */
    this.blockTargetIdCheck = this.registry.getBlockSolidity

    /** Dynamically updated object describing the currently targeted block */
    this.targetedBlock = null

    // add a default block highlighting function
    if (!opts.skipDefaultHighlighting) {
        // the default listener, defined onto noa in case people want to remove it later
        this.defaultBlockHighlightFunction = function (tgt) {
            if (tgt) {
                self.rendering.highlightBlockFace(true, tgt.position, tgt.normal)
            } else {
                self.rendering.highlightBlockFace(false)
            }
        }
        this.on('targetBlockChanged', this.defaultBlockHighlightFunction)
    }

    // init rendering stuff that needed to wait for engine internals
    this.rendering.initScene()


    // temp hacks for development

    window.noa = this
    window.ndarray = ndarray
    window.vec3 = vec3
    var debug = false
    this.inputs.bind('debug', 'Z')
    this.inputs.down.on('debug', function onDebug() {
        debug = !debug
        if (debug) window.scene.debugLayer.show(); else window.scene.debugLayer.hide();
    })



}

Engine.prototype = Object.create(EventEmitter.prototype)


/*
 *   Core Engine API
*/




/*
 * Tick function, called by container module at a fixed timestep. Emits #tick(dt),
 * where dt is the tick rate in ms (default 16.6)
*/

Engine.prototype.tick = function () {
    if (this._paused) return
    profile_hook('start')
    var dt = this._tickRate       // fixed timesteps!
    this.world.tick(dt)           // chunk creation/removal
    profile_hook('world')
    if (!this.world.playerChunkLoaded) {
        // when waiting on worldgen, just tick the meshing queue and exit
        this.rendering.tick(dt)
        return
    }
    this.physics.tick(dt)         // iterates physics
    profile_hook('physics')
    this.rendering.tick(dt)       // zooms camera, does deferred chunk meshing
    profile_hook('rendering')
    updateBlockTargets(this)      // finds targeted blocks, and highlights one if needed
    profile_hook('targets')
    this.emit('tick', dt)
    profile_hook('tick event')
    profile_hook('end')
    this.inputs.tick()            // clears accumulated tick/mouseMove data
    // debugQueues(this)
}


var __qwasDone = true, __qstart
function debugQueues(self) {
    var a = self.world._chunkIDsToAdd.length
    var b = self.world._chunkIDsToCreate.length
    var c = self.rendering._chunksToMesh.length
    var d = self.rendering._numMeshedChunks
    if (a + b + c > 0) console.log([
        'Chunks:', 'unmade', a,
        'pending creation', b,
        'to mesh', c,
        'meshed', d,
    ].join('   \t'))
    if (__qwasDone && a + b + c > 0) {
        __qwasDone = false
        __qstart = performance.now()
    }
    if (!__qwasDone && a + b + c === 0) {
        __qwasDone = true
        console.log('Queue empty after ' + Math.round(performance.now() - __qstart) + 'ms')
    }
}






/*
 * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt) 
 * where dt is the time in ms *since the last tick*.
*/

Engine.prototype.render = function (framePart) {
    if (this._paused) return
    profile_hook_render('start')
    var dt = framePart * this._tickRate // ms since last tick
    // only move camera during pointerlock or mousedown, or if pointerlock is unsupported
    if (this.container.hasPointerLock ||
        !this.container.supportsPointerLock ||
        (this._dragOutsideLock && this.inputs.state.fire)) {
        this.cameraControls.updateForRender()
    }
    // clear cumulative mouse inputs
    this.inputs.state.dx = this.inputs.state.dy = 0
    // events and render
    this.emit('beforeRender', dt)
    profile_hook_render('before render')
    this.rendering.render(dt)
    profile_hook_render('render')
    this.emit('afterRender', dt)
    profile_hook_render('after render')
    profile_hook_render('end')
}



/*
 *   Utility APIs
*/

/** 
 * Pausing the engine will also stop render/tick events, etc.
 * @param paused
*/
Engine.prototype.setPaused = function (paused) {
    this._paused = !!paused
    // when unpausing, clear any built-up mouse inputs
    if (!paused) {
        this.inputs.state.dx = this.inputs.state.dy = 0
    }
}

/** @param x,y,z */
Engine.prototype.getBlock = function (x, y, z) {
    if (x.length) {
        return this.world.getBlockID(x[0], x[1], x[2])
    } else {
        return this.world.getBlockID(x, y, z)
    }
}

/** @param x,y,z */
Engine.prototype.setBlock = function (id, x, y, z) {
    // skips the entity collision check
    if (x.length) {
        return this.world.setBlockID(id, x[0], x[1], x[2])
    } else {
        return this.world.setBlockID(id, x, y, z)
    }
}

/**
 * Adds a block unless obstructed by entities 
 * @param id,x,y,z */
Engine.prototype.addBlock = function (id, x, y, z) {
    // add a new terrain block, if nothing blocks the terrain there
    if (x.length) {
        if (this.entities.isTerrainBlocked(x[0], x[1], x[2])) return
        this.world.setBlockID(id, x[0], x[1], x[2])
    } else {
        if (this.entities.isTerrainBlocked(x, y, z)) return
        this.world.setBlockID(id, x, y, z)
    }
}



/** */
Engine.prototype.getPlayerPosition = function () {
    return this.entities.getPosition(this.playerEntity)
}

/** */
Engine.prototype.getPlayerMesh = function () {
    return this.entities.getMeshData(this.playerEntity).mesh
}

/** */
Engine.prototype.setPlayerEyeOffset = function (y) {
    this.playerEyeOffset = y
    var state = this.ents.getState(this.rendering.cameraTarget, this.ents.names.followsEntity)
    state.offset[1] = y
}

/** */
Engine.prototype.getPlayerEyePosition = function () {
    var pos = this.entities.getPosition(this.playerEntity)
    vec3.copy(_eyeLoc, pos)
    _eyeLoc[1] += this.playerEyeOffset
    return _eyeLoc
}
var _eyeLoc = vec3.create()

/** */
Engine.prototype.getCameraVector = function () {
    // rendering works with babylon's xyz vectors
    var v = this.rendering.getCameraVector()
    vec3.set(_camVec, v.x, v.y, v.z)
    return _camVec
}
var _camVec = vec3.create()



/**
 * Raycast through the world, returning a result object for any non-air block
 * @param pos
 * @param vec
 * @param dist
 */
Engine.prototype.pick = function (pos, vec, dist, blockIdTestFunction) {
    if (dist === 0) return null
    // if no block ID function is specified default to solidity check
    var testFn = blockIdTestFunction || this.registry.getBlockSolidity
    var world = this.world
    var testVoxel = function (x, y, z) {
        var id = world.getBlockID(x, y, z)
        return testFn(id)
    }
    pos = pos || this.getPlayerEyePosition()
    vec = vec || this.getCameraVector()
    dist = dist || this.blockTestDistance
    var rpos = _hitResult.position
    var rnorm = _hitResult.normal
    var hit = raycast(testVoxel, pos, vec, dist, rpos, rnorm)
    if (!hit) return null
    // position is right on a voxel border - adjust it so flooring will work as expected
    for (var i = 0; i < 3; i++) rpos[i] -= 0.01 * rnorm[i]
    return _hitResult
}
var _hitResult = {
    position: vec3.create(),
    normal: vec3.create(),
}







// Each frame, by default pick along the player's view vector 
// and tell rendering to highlight the struck block face
function updateBlockTargets(noa) {
    var newhash = ''
    var blockIdFn = noa.blockTargetIdCheck || noa.registry.getBlockSolidity
    var result = noa.pick(null, null, null, blockIdFn)
    if (result) {
        var dat = _targetedBlockDat
        for (var i = 0; i < 3; i++) {
            // position values are right on a border, so adjust them before flooring!
            var n = result.normal[i] | 0
            var p = Math.floor(result.position[i])
            dat.position[i] = p
            dat.normal[i] = n
            dat.adjacent[i] = p + n
            newhash += '|' + p + '|' + n
        }
        dat.blockID = noa.world.getBlockID(dat.position[0], dat.position[1], dat.position[2])
        newhash += '|' + result.blockID
        noa.targetedBlock = dat
    } else {
        noa.targetedBlock = null
    }
    if (newhash != _prevTargetHash) {
        noa.emit('targetBlockChanged', noa.targetedBlock)
        _prevTargetHash = newhash
    }
}

var _targetedBlockDat = {
    blockID: 0,
    position: [],
    normal: [],
    adjacent: [],
}

var _prevTargetHash = ''










var profile_hook = function (s) { }
var profile_hook_render = function (s) { }
if (PROFILE) (function () {
    var timer = new (__webpack_require__(2).Timer)(200, 'tick   ')
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()
if (PROFILE_RENDER) (function () {
    var timer = new (__webpack_require__(2).Timer)(200, 'render ')
    profile_hook_render = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()






/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = clone;

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
    var out = new Float32Array(3)
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
}

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = angle

var fromValues = __webpack_require__(10)
var normalize = __webpack_require__(11)
var dot = __webpack_require__(12)

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
    var tempA = fromValues(a[0], a[1], a[2])
    var tempB = fromValues(b[0], b[1], b[2])
 
    normalize(tempA, tempA)
    normalize(tempB, tempB)
 
    var cosine = dot(tempA, tempB)

    if(cosine > 1.0){
        return 0
    } else {
        return Math.acos(cosine)
    }     
}


/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = copy;

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
}

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = set;

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}

/***/ }),
/* 25 */
/***/ (function(module, exports) {

module.exports = add;

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    out[2] = a[2] + b[2]
    return out
}

/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = subtract;

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    out[2] = a[2] - b[2]
    return out
}

/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = multiply;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    out[2] = a[2] * b[2]
    return out
}

/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = divide;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
    out[0] = a[0] / b[0]
    out[1] = a[1] / b[1]
    out[2] = a[2] / b[2]
    return out
}

/***/ }),
/* 29 */
/***/ (function(module, exports) {

module.exports = min;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
    out[0] = Math.min(a[0], b[0])
    out[1] = Math.min(a[1], b[1])
    out[2] = Math.min(a[2], b[2])
    return out
}

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = max;

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
    out[0] = Math.max(a[0], b[0])
    out[1] = Math.max(a[1], b[1])
    out[2] = Math.max(a[2], b[2])
    return out
}

/***/ }),
/* 31 */
/***/ (function(module, exports) {

module.exports = scale;

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
    out[0] = a[0] * b
    out[1] = a[1] * b
    out[2] = a[2] * b
    return out
}

/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = scaleAndAdd;

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale)
    out[1] = a[1] + (b[1] * scale)
    out[2] = a[2] + (b[2] * scale)
    return out
}

/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = distance;

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2]
    return Math.sqrt(x*x + y*y + z*z)
}

/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = squaredDistance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2]
    return x*x + y*y + z*z
}

/***/ }),
/* 35 */
/***/ (function(module, exports) {

module.exports = length;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return Math.sqrt(x*x + y*y + z*z)
}

/***/ }),
/* 36 */
/***/ (function(module, exports) {

module.exports = squaredLength;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return x*x + y*y + z*z
}

/***/ }),
/* 37 */
/***/ (function(module, exports) {

module.exports = negate;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
    out[0] = -a[0]
    out[1] = -a[1]
    out[2] = -a[2]
    return out
}

/***/ }),
/* 38 */
/***/ (function(module, exports) {

module.exports = inverse;

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0]
  out[1] = 1.0 / a[1]
  out[2] = 1.0 / a[2]
  return out
}

/***/ }),
/* 39 */
/***/ (function(module, exports) {

module.exports = cross;

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
}

/***/ }),
/* 40 */
/***/ (function(module, exports) {

module.exports = lerp;

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2]
    out[0] = ax + t * (b[0] - ax)
    out[1] = ay + t * (b[1] - ay)
    out[2] = az + t * (b[2] - az)
    return out
}

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = random;

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
    scale = scale || 1.0

    var r = Math.random() * 2.0 * Math.PI
    var z = (Math.random() * 2.0) - 1.0
    var zScale = Math.sqrt(1.0-z*z) * scale

    out[0] = Math.cos(r) * zScale
    out[1] = Math.sin(r) * zScale
    out[2] = z * scale
    return out
}

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = transformMat4;

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15]
    w = w || 1.0
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
    return out
}

/***/ }),
/* 43 */
/***/ (function(module, exports) {

module.exports = transformMat3;

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
    var x = a[0], y = a[1], z = a[2]
    out[0] = x * m[0] + y * m[3] + z * m[6]
    out[1] = x * m[1] + y * m[4] + z * m[7]
    out[2] = x * m[2] + y * m[5] + z * m[8]
    return out
}

/***/ }),
/* 44 */
/***/ (function(module, exports) {

module.exports = transformQuat;

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return out
}

/***/ }),
/* 45 */
/***/ (function(module, exports) {

module.exports = rotateX;

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateX(out, a, b, c){
    var p = [], r=[]
    //Translate point to the origin
    p[0] = a[0] - b[0]
    p[1] = a[1] - b[1]
    p[2] = a[2] - b[2]

    //perform rotation
    r[0] = p[0]
    r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c)
    r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c)

    //translate to correct position
    out[0] = r[0] + b[0]
    out[1] = r[1] + b[1]
    out[2] = r[2] + b[2]

    return out
}

/***/ }),
/* 46 */
/***/ (function(module, exports) {

module.exports = rotateY;

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateY(out, a, b, c){
    var p = [], r=[]
    //Translate point to the origin
    p[0] = a[0] - b[0]
    p[1] = a[1] - b[1]
    p[2] = a[2] - b[2]
  
    //perform rotation
    r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c)
    r[1] = p[1]
    r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c)
  
    //translate to correct position
    out[0] = r[0] + b[0]
    out[1] = r[1] + b[1]
    out[2] = r[2] + b[2]
  
    return out
}

/***/ }),
/* 47 */
/***/ (function(module, exports) {

module.exports = rotateZ;

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateZ(out, a, b, c){
    var p = [], r=[]
    //Translate point to the origin
    p[0] = a[0] - b[0]
    p[1] = a[1] - b[1]
    p[2] = a[2] - b[2]
  
    //perform rotation
    r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c)
    r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c)
    r[2] = p[2]
  
    //translate to correct position
    out[0] = r[0] + b[0]
    out[1] = r[1] + b[1]
    out[2] = r[2] + b[2]
  
    return out
}

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = forEach;

var vec = __webpack_require__(9)()

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
function forEach(a, stride, offset, count, fn, arg) {
        var i, l
        if(!stride) {
            stride = 3
        }

        if(!offset) {
            offset = 0
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length)
        } else {
            l = a.length
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i] 
            vec[1] = a[i+1] 
            vec[2] = a[i+2]
            fn(vec, vec, arg)
            a[i] = vec[0] 
            a[i+1] = vec[1] 
            a[i+2] = vec[2]
        }
        
        return a
}

/***/ }),
/* 49 */
/***/ (function(module, exports) {

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)
var createGameShell = __webpack_require__(51)
var EventEmitter = __webpack_require__(4).EventEmitter


module.exports = function (noa, opts) {
	return new Container(noa, opts)
}

/*
*  Container module
*    Wraps game-shell module and manages HTML container, canvas, etc.
*    Emits: DOMready
*/

function Container(noa, opts) {
	opts = opts || {}
	this._noa = noa
	this.element = opts.domElement || createContainerDiv()
	this.canvas = getOrCreateCanvas(this.element)
	this._shell = createShell(this.canvas, opts)

	// mouse state/feature detection
	this.hasPointerLock = false
	this.supportsPointerLock = false
	this.pointerInGame = false
	this.windowFocused = document.hasFocus()

	// basic listeners
	var self = this
	var lockChange = function (ev) { onLockChange(self, ev) }
	document.addEventListener("pointerlockchange", lockChange, false)
	document.addEventListener("mozpointerlockchange", lockChange, false)
	document.addEventListener("webkitpointerlockchange", lockChange, false)
	detectPointerLock(self)

	self.element.addEventListener('mouseenter', function () { self.pointerInGame = true })
	self.element.addEventListener('mouseleave', function () { self.pointerInGame = false })

	window.addEventListener('focus', function () { self.windowFocused = true })
	window.addEventListener('blur', function () { self.windowFocused = false })

	// get shell events after it's initialized
	this._shell.on('init', onShellInit.bind(null, this))
}

Container.prototype = Object.create(EventEmitter.prototype)



/*
*   SHELL EVENTS
*/

function onShellInit(self) {
	// create shell listeners that drive engine functions
	var noa = self._noa
	var shell = self._shell
	shell.on('tick', function onTick(n) { noa.tick(n) })
	shell.on('render', function onRender(n) { noa.render(n) })
	shell.on('resize', noa.rendering.resize.bind(noa.rendering))

	// let other components know DOM is ready
	self.emit('DOMready')
}



/*
*   PUBLIC API 
*/

Container.prototype.appendTo = function (htmlElement) {
	this.element.appendChild(htmlElement)
}



Container.prototype.setPointerLock = function (lock) {
	// not sure if this will work robustly
	this._shell.pointerLock = !!lock
}





/*
*   INTERNALS
*/



function createContainerDiv() {
	// based on github.com/mikolalysenko/game-shell - makeDefaultContainer()
	var container = document.createElement("div")
	container.tabindex = 1
	container.style.position = "absolute"
	container.style.left = "0px"
	container.style.right = "0px"
	container.style.top = "0px"
	container.style.bottom = "0px"
	container.style.height = "100%"
	container.style.overflow = "hidden"
	document.body.appendChild(container)
	document.body.style.overflow = "hidden" //Prevent bounce
	document.body.style.height = "100%"
	container.id = 'noa-container'
	return container
}


function createShell(canvas, _opts) {
	var shellDefaults = {
		pointerLock: true,
		preventDefaults: false
	}
	var opts = extend(shellDefaults, _opts)
	opts.element = canvas
	var shell = createGameShell(opts)
	shell.preventDefaults = opts.preventDefaults
	return shell
}

function getOrCreateCanvas(el) {
	// based on github.com/stackgl/gl-now - default canvas
	var canvas = el.querySelector('canvas')
	if (!canvas) {
		canvas = document.createElement('canvas')
		canvas.style.position = "absolute"
		canvas.style.left = "0px"
		canvas.style.top = "0px"
		canvas.style.height = "100%"
		canvas.style.width = "100%"
		canvas.id = 'noa-canvas'
		el.insertBefore(canvas, el.firstChild);
	}
	return canvas
}


// track changes in Pointer Lock state
function onLockChange(self, ev) {
	var el = document.pointerLockElement ||
		document.mozPointerLockElement ||
		document.webkitPointerLockElement
	if (el) {
		self.hasPointerLock = true
		self.emit('gainedPointerLock')
	} else {
		self.hasPointerLock = false
		self.emit('lostPointerLock')
	}
	// this works around a Firefox bug where no mouse-in event 
	// gets issued after starting pointerlock
	if (el) {
		// act as if pointer is in game window while pointerLock is true
		self.pointerInGame = true
	}
}


// set up stuff to detect pointer lock support.
// Needlessly complex because Chrome/Android claims to support but doesn't.
// For now, just feature detect, but assume no support if a touch event occurs
// TODO: see if this makes sense on hybrid touch/mouse devices
function detectPointerLock(self) {
	var lockElementExists =
		('pointerLockElement' in document) ||
		('mozPointerLockElement' in document) ||
		('webkitPointerLockElement' in document)
	if (lockElementExists) {
		self.supportsPointerLock = true
		var listener = function (e) {
			self.supportsPointerLock = false
			document.removeEventListener(e.type, listener)
		}
		document.addEventListener('touchmove', listener)
	}
}





/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var EventEmitter = __webpack_require__(4).EventEmitter
  , util         = __webpack_require__(14)
  , domready     = __webpack_require__(55)
  , vkey         = __webpack_require__(56)
  , invert       = __webpack_require__(57)
  , uniq         = __webpack_require__(58)
  , bsearch      = __webpack_require__(59)
  , iota         = __webpack_require__(13)
  , min          = Math.min

//Browser compatibility hacks
__webpack_require__(60)
var addMouseWheel = __webpack_require__(61)
var hrtime = __webpack_require__(62)

//Remove angle braces and other useless crap
var filtered_vkey = (function() {
  var result = new Array(256)
    , i, j, k
  for(i=0; i<256; ++i) {
    result[i] = "UNK"
  }
  for(i in vkey) {
    k = vkey[i]
    if(k.charAt(0) === '<' && k.charAt(k.length-1) === '>') {
      k = k.substring(1, k.length-1)
    }
    k = k.replace(/\s/g, "-")
    result[parseInt(i)] = k
  }
  return result
})()

//Compute minimal common set of keyboard functions
var keyNames = uniq(Object.keys(invert(filtered_vkey)))

//Translates a virtual keycode to a normalized keycode
function virtualKeyCode(key) {
  return bsearch.eq(keyNames, key)
}

//Maps a physical keycode to a normalized keycode
function physicalKeyCode(key) {
  return virtualKeyCode(filtered_vkey[key])
}

//Game shell
function GameShell() {
  EventEmitter.call(this)
  this._curKeyState  = new Array(keyNames.length)
  this._pressCount   = new Array(keyNames.length)
  this._releaseCount = new Array(keyNames.length)
  
  this._tickInterval = null
  this._rafHandle = null
  this._tickRate = 0
  this._lastTick = hrtime()
  this._frameTime = 0.0
  this._paused = true
  this._width = 0
  this._height = 0
  
  this._wantFullscreen = false
  this._wantPointerLock = false
  this._fullscreenActive = false
  this._pointerLockActive = false
  
  this._rafFunction = tickOrRender.bind(undefined, this, true)

  this.preventDefaults = true
  this.stopPropagation = false
  
  for(var i=0; i<keyNames.length; ++i) {
    this._curKeyState[i] = false
    this._pressCount[i] = this._releaseCount[i] = 0
  }
  
  //Public members
  this.element = null
  this.bindings = {}
  this.frameSkip = 100.0
  this.tickCount = 0
  this.frameCount = 0
  this.startTime = hrtime()
  this.tickTime = this._tickRate
  this.frameTime = 10.0
  this.stickyFullscreen = false
  this.stickyPointerLock = false
  
  //Scroll stuff
  this.scroll = [0,0,0]
    
  //Mouse state
  this.mouseX = 0
  this.mouseY = 0
  this.prevMouseX = 0
  this.prevMouseY = 0
}

util.inherits(GameShell, EventEmitter)

var proto = GameShell.prototype

//Bind keynames
proto.keyNames = keyNames

//Binds a virtual keyboard event to a physical key
proto.bind = function(virtual_key) {
  //Look up previous key bindings
  var arr
  if(virtual_key in this.bindings) {
    arr = this.bindings[virtual_key]
  } else {
    arr = []
  }
  //Add keys to list
  var physical_key
  for(var i=1, n=arguments.length; i<n; ++i) {
    physical_key = arguments[i]
    if(virtualKeyCode(physical_key) >= 0) {
      arr.push(physical_key)
    } else if(physical_key in this.bindings) {
      var keybinds = this.bindings[physical_key]
      for(var j=0; j<keybinds.length; ++j) {
        arr.push(keybinds[j])
      }
    }
  }
  //Remove any duplicate keys
  arr = uniq(arr)
  if(arr.length > 0) {
    this.bindings[virtual_key] = arr
  }
  this.emit('bind', virtual_key, arr)
}

//Unbinds a virtual keyboard event
proto.unbind = function(virtual_key) {
  if(virtual_key in this.bindings) {
    delete this.bindings[virtual_key]
  }
  this.emit('unbind', virtual_key)
}

//Checks if a key is set in a given state
function lookupKey(state, bindings, key) {
  if(key in bindings) {
    var arr = bindings[key]
    for(var i=0, n=arr.length; i<n; ++i) {
      if(state[virtualKeyCode(arr[i])]) {
        return true
      }
    }
    return false
  }
  var kc = virtualKeyCode(key)
  if(kc >= 0) {
    return state[kc]
  }
  return false
}

//Checks if a key is set in a given state
function lookupCount(state, bindings, key) {
  if(key in bindings) {
    var arr = bindings[key], r = 0
    for(var i=0, n=arr.length; i<n; ++i) {
      r += state[virtualKeyCode(arr[i])]
    }
    return r
  }
  var kc = virtualKeyCode(key)
  if(kc >= 0) {
    return state[kc]
  }
  return 0
}

//Checks if a key (either physical or virtual) is currently held down
proto.down = function(key) {
  return lookupKey(this._curKeyState, this.bindings, key)
}

//Checks if a key was ever down
proto.wasDown = function(key) {
  return this.down(key) || !!this.press(key)
}

//Opposite of down
proto.up = function(key) {
  return !this.down(key)
}

//Checks if a key was released during previous frame
proto.wasUp = function(key) {
  return this.up(key) || !!this.release(key)
}

//Returns the number of times a key was pressed since last tick
proto.press = function(key) {
  return lookupCount(this._pressCount, this.bindings, key)
}

//Returns the number of times a key was released since last tick
proto.release = function(key) {
  return lookupCount(this._releaseCount, this.bindings, key)
}

//Pause/unpause the game loop
Object.defineProperty(proto, "paused", {
  get: function() {
    return this._paused
  },
  set: function(state) {
    var ns = !!state
    if(ns !== this._paused) {
      if(!this._paused) {
        this._paused = true
        this._frameTime = min(1.0, (hrtime() - this._lastTick) / this._tickRate)
        clearInterval(this._tickInterval)
        //cancelAnimationFrame(this._rafHandle)
      } else {
        this._paused = false
        this._lastTick = hrtime() - Math.floor(this._frameTime * this._tickRate)
        this._tickInterval = setInterval(tickOrRender, this._tickRate, this, false)
        this._rafHandle = requestAnimationFrame(this._rafFunction)
      }
    }
  }
})

//Fullscreen state toggle

function tryFullscreen(shell) {
  //Request full screen
  var elem = shell.element
  
  if(shell._wantFullscreen && !shell._fullscreenActive) {
    var fs = elem.requestFullscreen ||
             elem.requestFullScreen ||
             elem.webkitRequestFullscreen ||
             elem.webkitRequestFullScreen ||
             elem.mozRequestFullscreen ||
             elem.mozRequestFullScreen ||
             function() {}
    fs.call(elem)
  }
  if(shell._wantPointerLock && !shell._pointerLockActive) {
    var pl =  elem.requestPointerLock ||
              elem.webkitRequestPointerLock ||
              elem.mozRequestPointerLock ||
              elem.msRequestPointerLock ||
              elem.oRequestPointerLock ||
              function() {}
    pl.call(elem)
  }
}

var cancelFullscreen = document.exitFullscreen ||
                       document.cancelFullscreen ||  //Why can no one agree on this?
                       document.cancelFullScreen ||
                       document.webkitCancelFullscreen ||
                       document.webkitCancelFullScreen ||
                       document.mozCancelFullscreen ||
                       document.mozCancelFullScreen ||
                       function(){}

Object.defineProperty(proto, "fullscreen", {
  get: function() {
    return this._fullscreenActive
  },
  set: function(state) {
    var ns = !!state
    if(!ns) {
      this._wantFullscreen = false
      cancelFullscreen.call(document)
    } else {
      this._wantFullscreen = true
      tryFullscreen(this)
    }
    return this._fullscreenActive
  }
})

function handleFullscreen(shell) {
  shell._fullscreenActive = document.fullscreen ||
                            document.mozFullScreen ||
                            document.webkitIsFullScreen ||
                            false
  if(!shell.stickyFullscreen && shell._fullscreenActive) {
    shell._wantFullscreen = false
  }
}

//Pointer lock state toggle
var exitPointerLock = document.exitPointerLock ||
                      document.webkitExitPointerLock ||
                      document.mozExitPointerLock ||
                      function() {}

Object.defineProperty(proto, "pointerLock", {
  get: function() {
    return this._pointerLockActive
  },
  set: function(state) {
    var ns = !!state
    if(!ns) {
      this._wantPointerLock = false
      exitPointerLock.call(document)
    } else {
      this._wantPointerLock = true
      tryFullscreen(this)
    }
    return this._pointerLockActive
  }
})

function handlePointerLockChange(shell, event) {
  shell._pointerLockActive = shell.element === (
      document.pointerLockElement ||
      document.mozPointerLockElement ||
      document.webkitPointerLockElement ||
      null)
  if(!shell.stickyPointerLock && shell._pointerLockActive) {
    shell._wantPointerLock = false
  }
}

//Width and height
Object.defineProperty(proto, "width", {
  get: function() {
    return this.element.clientWidth
  }
})
Object.defineProperty(proto, "height", {
  get: function() {
    return this.element.clientHeight
  }
})

//Set key state
function setKeyState(shell, key, state) {
  var ps = shell._curKeyState[key]
  if(ps !== state) {
    if(state) {
      shell._pressCount[key]++
    } else {
      shell._releaseCount[key]++
    }
    shell._curKeyState[key] = state
  }
}

function tickOrRender(shell, doRender) {
  tick(shell)
  if (doRender) {
    render(shell)
  }
}

//Ticks the game state one update
function tick(shell) {
  var skip = hrtime() + shell.frameSkip
    , pCount = shell._pressCount
    , rCount = shell._releaseCount
    , i, s, t
    , tr = shell._tickRate
    , n = keyNames.length
  while(!shell._paused &&
        hrtime() >= shell._lastTick + tr) {
    
    //Skip frames if we are over budget
    if(hrtime() > skip) {
      shell._lastTick = hrtime() + tr
      return
    }
    
    //Tick the game
    s = hrtime()
    shell.emit("tick")
    t = hrtime()
    shell.tickTime = t - s
    
    //Update counters and time
    ++shell.tickCount
    shell._lastTick += tr
    
    //Shift input state
    for(i=0; i<n; ++i) {
      pCount[i] = rCount[i] = 0
    }
    if(shell._pointerLockActive) {
      shell.prevMouseX = shell.mouseX = shell.width>>1
      shell.prevMouseY = shell.mouseY = shell.height>>1
    } else {
      shell.prevMouseX = shell.mouseX
      shell.prevMouseY = shell.mouseY
    }
    shell.scroll[0] = shell.scroll[1] = shell.scroll[2] = 0
  }
}

//Render stuff
function render(shell) {

  //Request next frame
  shell._rafHandle = requestAnimationFrame(shell._rafFunction)

  //Compute frame time
  var dt
  if(shell._paused) {
    dt = shell._frameTime
  } else {
    dt = min(1.0, (hrtime() - shell._lastTick) / shell._tickRate)
  }
  
  //Draw a frame
  ++shell.frameCount
  var s = hrtime()
  shell.emit("render", dt)
  var t = hrtime()
  shell.frameTime = t - s
  
}

function isFocused(shell) {
  return (document.activeElement === document.body) ||
         (document.activeElement === shell.element)
}

function handleEvent(shell, ev) {
  if(shell.preventDefaults) {
    ev.preventDefault()
  }
  if(shell.stopPropagation) {
    ev.stopPropagation()
  }
}

//Set key up
function handleKeyUp(shell, ev) {
  handleEvent(shell, ev)
  var kc = physicalKeyCode(ev.keyCode || ev.char || ev.which || ev.charCode)
  if(kc >= 0) {
    setKeyState(shell, kc, false)
  }
}

//Set key down
function handleKeyDown(shell, ev) {
  if(!isFocused(shell)) {
    return
  }
  handleEvent(shell, ev)
  if(ev.metaKey) {
    //Hack: Clear key state when meta gets pressed to prevent keys sticking
    handleBlur(shell, ev)
  } else {
    var kc = physicalKeyCode(ev.keyCode || ev.char || ev.which || ev.charCode)
    if(kc >= 0) {
      setKeyState(shell, kc, true)
    }
  }
}

//Mouse events are really annoying
var mouseCodes = iota(32).map(function(n) {
  return virtualKeyCode("mouse-" + (n+1))
})

function setMouseButtons(shell, buttons) {
  for(var i=0; i<32; ++i) {
    setKeyState(shell, mouseCodes[i], !!(buttons & (1<<i)))
  }
}

function handleMouseMove(shell, ev) {
  handleEvent(shell, ev)
  if(shell._pointerLockActive) {
    var movementX = ev.movementX       ||
                    ev.mozMovementX    ||
                    ev.webkitMovementX ||
                    0,
        movementY = ev.movementY       ||
                    ev.mozMovementY    ||
                    ev.webkitMovementY ||
                    0
    shell.mouseX += movementX
    shell.mouseY += movementY
  } else {
    shell.mouseX = ev.clientX - shell.element.offsetLeft
    shell.mouseY = ev.clientY - shell.element.offsetTop
  }
  return false
}

function handleMouseDown(shell, ev) {
  handleEvent(shell, ev)
  setKeyState(shell, mouseCodes[ev.button], true)
  return false
}

function handleMouseUp(shell, ev) {
  handleEvent(shell, ev)
  setKeyState(shell, mouseCodes[ev.button], false)
  return false
}

function handleMouseEnter(shell, ev) {
  handleEvent(shell, ev)
  if(shell._pointerLockActive) {
    shell.prevMouseX = shell.mouseX = shell.width>>1
    shell.prevMouseY = shell.mouseY = shell.height>>1
  } else {
    shell.prevMouseX = shell.mouseX = ev.clientX - shell.element.offsetLeft
    shell.prevMouseY = shell.mouseY = ev.clientY - shell.element.offsetTop
  }
  return false
}

function handleMouseLeave(shell, ev) {
  handleEvent(shell, ev)
  setMouseButtons(shell, 0)
  return false
}

//Handle mouse wheel events
function handleMouseWheel(shell, ev) {
  handleEvent(shell, ev)
  var scale = 1
  switch(ev.deltaMode) {
    case 0: //Pixel
      scale = 1
    break
    case 1: //Line
      scale = 12
    break
    case 2: //Page
       scale = shell.height
    break
  }
  //Add scroll
  shell.scroll[0] +=  ev.deltaX * scale
  shell.scroll[1] +=  ev.deltaY * scale
  shell.scroll[2] += (ev.deltaZ * scale)||0.0
  return false
}

function handleContexMenu(shell, ev) {
  handleEvent(shell, ev)
  return false
}

function handleBlur(shell, ev) {
  var n = keyNames.length
    , c = shell._curKeyState
    , r = shell._releaseCount
    , i
  for(i=0; i<n; ++i) {
    if(c[i]) {
      ++r[i]
    }
    c[i] = false
  }
  return false
}

function handleResizeElement(shell, ev) {
  var w = shell.element.clientWidth|0
  var h = shell.element.clientHeight|0
  if((w !== shell._width) || (h !== shell._height)) {
    shell._width = w
    shell._height = h
    shell.emit("resize", w, h)
  }
}

function makeDefaultContainer() {
  var container = document.createElement("div")
  container.tabindex = 1
  container.style.position = "absolute"
  container.style.left = "0px"
  container.style.right = "0px"
  container.style.top = "0px"
  container.style.bottom = "0px"
  container.style.height = "100%"
  container.style.overflow = "hidden"
  document.body.appendChild(container)
  document.body.style.overflow = "hidden" //Prevent bounce
  document.body.style.height = "100%"
  return container
}

function createShell(options) {
  options = options || {}
  
  //Check fullscreen and pointer lock flags
  var useFullscreen = !!options.fullscreen
  var usePointerLock = useFullscreen
  if(typeof options.pointerLock !== undefined) {
    usePointerLock = !!options.pointerLock
  }
  
  //Create initial shell
  var shell = new GameShell()
  shell._tickRate = options.tickRate || 30
  shell.frameSkip = options.frameSkip || (shell._tickRate+5) * 5
  shell.stickyFullscreen = !!options.stickyFullscreen || !!options.sticky
  shell.stickyPointerLock = !!options.stickyPointerLock || !!options.sticky
  
  //Set bindings
  if(options.bindings) {
    shell.bindings = options.bindings
  }
  
  //Wait for dom to intiailize
  setTimeout(function() { domready(function initGameShell() {
    
    //Retrieve element
    var element = options.element
    if(typeof element === "string") {
      var e = document.querySelector(element)
      if(!e) {
        e = document.getElementById(element)
      }
      if(!e) {
        e = document.getElementByClass(element)[0]
      }
      if(!e) {
        e = makeDefaultContainer()
      }
      shell.element = e
    } else if(typeof element === "object" && !!element) {
      shell.element = element
    } else if(typeof element === "function") {
      shell.element = element()
    } else {
      shell.element = makeDefaultContainer()
    }
    
    //Disable user-select
    if(shell.element.style) {
      shell.element.style["-webkit-touch-callout"] = "none"
      shell.element.style["-webkit-user-select"] = "none"
      shell.element.style["-khtml-user-select"] = "none"
      shell.element.style["-moz-user-select"] = "none"
      shell.element.style["-ms-user-select"] = "none"
      shell.element.style["user-select"] = "none"
    }
    
    //Hook resize handler
    shell._width = shell.element.clientWidth
    shell._height = shell.element.clientHeight
    var handleResize = handleResizeElement.bind(undefined, shell)
    if(typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(handleResize)
      observer.observe(shell.element, {
        attributes: true,
        subtree: true
      })
    } else {
      shell.element.addEventListener("DOMSubtreeModified", handleResize, false)
    }
    window.addEventListener("resize", handleResize, false)
    
    //Hook keyboard listener
    window.addEventListener("keydown", handleKeyDown.bind(undefined, shell), false)
    window.addEventListener("keyup", handleKeyUp.bind(undefined, shell), false)
    
    //Disable right click
    shell.element.oncontextmenu = handleContexMenu.bind(undefined, shell)
    
    //Hook mouse listeners
    shell.element.addEventListener("mousedown", handleMouseDown.bind(undefined, shell), false)
    shell.element.addEventListener("mouseup", handleMouseUp.bind(undefined, shell), false)
    shell.element.addEventListener("mousemove", handleMouseMove.bind(undefined, shell), false)
    shell.element.addEventListener("mouseenter", handleMouseEnter.bind(undefined, shell), false)
    
    //Mouse leave
    var leave = handleMouseLeave.bind(undefined, shell)
    shell.element.addEventListener("mouseleave", leave, false)
    shell.element.addEventListener("mouseout", leave, false)
    window.addEventListener("mouseleave", leave, false)
    window.addEventListener("mouseout", leave, false)
    
    //Blur event 
    var blur = handleBlur.bind(undefined, shell)
    shell.element.addEventListener("blur", blur, false)
    shell.element.addEventListener("focusout", blur, false)
    shell.element.addEventListener("focus", blur, false)
    window.addEventListener("blur", blur, false)
    window.addEventListener("focusout", blur, false)
    window.addEventListener("focus", blur, false)

    //Mouse wheel handler
    addMouseWheel(shell.element, handleMouseWheel.bind(undefined, shell), false)

    //Fullscreen handler
    var fullscreenChange = handleFullscreen.bind(undefined, shell)
    document.addEventListener("fullscreenchange", fullscreenChange, false)
    document.addEventListener("mozfullscreenchange", fullscreenChange, false)
    document.addEventListener("webkitfullscreenchange", fullscreenChange, false)

    //Stupid fullscreen hack
    shell.element.addEventListener("click", tryFullscreen.bind(undefined, shell), false)

    //Pointer lock change handler
    var pointerLockChange = handlePointerLockChange.bind(undefined, shell)
    document.addEventListener("pointerlockchange", pointerLockChange, false)
    document.addEventListener("mozpointerlockchange", pointerLockChange, false)
    document.addEventListener("webkitpointerlockchange", pointerLockChange, false)
    document.addEventListener("pointerlocklost", pointerLockChange, false)
    document.addEventListener("webkitpointerlocklost", pointerLockChange, false)
    document.addEventListener("mozpointerlocklost", pointerLockChange, false)
    
    //Update flags
    shell.fullscreen = useFullscreen
    shell.pointerLock = usePointerLock
  
    //Default mouse button aliases
    shell.bind("mouse-left",   "mouse-1")
    shell.bind("mouse-right",  "mouse-3")
    shell.bind("mouse-middle", "mouse-2")
    
    //Initialize tick counter
    shell._lastTick = hrtime()
    shell.startTime = hrtime()

    //Unpause shell
    shell.paused = false
    
    //Emit initialize event
    shell.emit("init")
  })}, 0)
  
  return shell
}

module.exports = createShell


/***/ }),
/* 52 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 53 */
/***/ (function(module, exports) {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),
/* 54 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (true) module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});


/***/ }),
/* 56 */
/***/ (function(module, exports) {

var ua = typeof window !== 'undefined' ? window.navigator.userAgent : ''
  , isOSX = /OS X/.test(ua)
  , isOpera = /Opera/.test(ua)
  , maybeFirefox = !/like Gecko/.test(ua) && !isOpera

var i, output = module.exports = {
  0:  isOSX ? '<menu>' : '<UNK>'
, 1:  '<mouse 1>'
, 2:  '<mouse 2>'
, 3:  '<break>'
, 4:  '<mouse 3>'
, 5:  '<mouse 4>'
, 6:  '<mouse 5>'
, 8:  '<backspace>'
, 9:  '<tab>'
, 12: '<clear>'
, 13: '<enter>'
, 16: '<shift>'
, 17: '<control>'
, 18: '<alt>'
, 19: '<pause>'
, 20: '<caps-lock>'
, 21: '<ime-hangul>'
, 23: '<ime-junja>'
, 24: '<ime-final>'
, 25: '<ime-kanji>'
, 27: '<escape>'
, 28: '<ime-convert>'
, 29: '<ime-nonconvert>'
, 30: '<ime-accept>'
, 31: '<ime-mode-change>'
, 27: '<escape>'
, 32: '<space>'
, 33: '<page-up>'
, 34: '<page-down>'
, 35: '<end>'
, 36: '<home>'
, 37: '<left>'
, 38: '<up>'
, 39: '<right>'
, 40: '<down>'
, 41: '<select>'
, 42: '<print>'
, 43: '<execute>'
, 44: '<snapshot>'
, 45: '<insert>'
, 46: '<delete>'
, 47: '<help>'
, 91: '<meta>'  // meta-left -- no one handles left and right properly, so we coerce into one.
, 92: '<meta>'  // meta-right
, 93: isOSX ? '<meta>' : '<menu>'      // chrome,opera,safari all report this for meta-right (osx mbp).
, 95: '<sleep>'
, 106: '<num-*>'
, 107: '<num-+>'
, 108: '<num-enter>'
, 109: '<num-->'
, 110: '<num-.>'
, 111: '<num-/>'
, 144: '<num-lock>'
, 145: '<scroll-lock>'
, 160: '<shift-left>'
, 161: '<shift-right>'
, 162: '<control-left>'
, 163: '<control-right>'
, 164: '<alt-left>'
, 165: '<alt-right>'
, 166: '<browser-back>'
, 167: '<browser-forward>'
, 168: '<browser-refresh>'
, 169: '<browser-stop>'
, 170: '<browser-search>'
, 171: '<browser-favorites>'
, 172: '<browser-home>'

  // ff/osx reports '<volume-mute>' for '-'
, 173: isOSX && maybeFirefox ? '-' : '<volume-mute>'
, 174: '<volume-down>'
, 175: '<volume-up>'
, 176: '<next-track>'
, 177: '<prev-track>'
, 178: '<stop>'
, 179: '<play-pause>'
, 180: '<launch-mail>'
, 181: '<launch-media-select>'
, 182: '<launch-app 1>'
, 183: '<launch-app 2>'
, 186: ';'
, 187: '='
, 188: ','
, 189: '-'
, 190: '.'
, 191: '/'
, 192: '`'
, 219: '['
, 220: '\\'
, 221: ']'
, 222: "'"
, 223: '<meta>'
, 224: '<meta>'       // firefox reports meta here.
, 226: '<alt-gr>'
, 229: '<ime-process>'
, 231: isOpera ? '`' : '<unicode>'
, 246: '<attention>'
, 247: '<crsel>'
, 248: '<exsel>'
, 249: '<erase-eof>'
, 250: '<play>'
, 251: '<zoom>'
, 252: '<no-name>'
, 253: '<pa-1>'
, 254: '<clear>'
}

for(i = 58; i < 65; ++i) {
  output[i] = String.fromCharCode(i)
}

// 0-9
for(i = 48; i < 58; ++i) {
  output[i] = (i - 48)+''
}

// A-Z
for(i = 65; i < 91; ++i) {
  output[i] = String.fromCharCode(i)
}

// num0-9
for(i = 96; i < 106; ++i) {
  output[i] = '<num-'+(i - 96)+'>'
}

// F1-F24
for(i = 112; i < 136; ++i) {
  output[i] = 'F'+(i-111)
}


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function invert(hash) {
  var result = {}
  for(var i in hash) {
    if(hash.hasOwnProperty(i)) {
      result[hash[i]] = i
    }
  }
  return result
}

module.exports = invert

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i]
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare)
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort()
  }
  return unique_eq(list)
}

module.exports = unique


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function compileSearch(funcName, predicate, reversed, extraArgs, useNdarray, earlyOut) {
  var code = [
    "function ", funcName, "(a,l,h,", extraArgs.join(","),  "){",
earlyOut ? "" : "var i=", (reversed ? "l-1" : "h+1"),
";while(l<=h){\
var m=(l+h)>>>1,x=a", useNdarray ? ".get(m)" : "[m]"]
  if(earlyOut) {
    if(predicate.indexOf("c") < 0) {
      code.push(";if(x===y){return m}else if(x<=y){")
    } else {
      code.push(";var p=c(x,y);if(p===0){return m}else if(p<=0){")
    }
  } else {
    code.push(";if(", predicate, "){i=m;")
  }
  if(reversed) {
    code.push("l=m+1}else{h=m-1}")
  } else {
    code.push("h=m-1}else{l=m+1}")
  }
  code.push("}")
  if(earlyOut) {
    code.push("return -1};")
  } else {
    code.push("return i};")
  }
  return code.join("")
}

function compileBoundsSearch(predicate, reversed, suffix, earlyOut) {
  var result = new Function([
  compileSearch("A", "x" + predicate + "y", reversed, ["y"], false, earlyOut),
  compileSearch("B", "x" + predicate + "y", reversed, ["y"], true, earlyOut),
  compileSearch("P", "c(x,y)" + predicate + "0", reversed, ["y", "c"], false, earlyOut),
  compileSearch("Q", "c(x,y)" + predicate + "0", reversed, ["y", "c"], true, earlyOut),
"function dispatchBsearch", suffix, "(a,y,c,l,h){\
if(a.shape){\
if(typeof(c)==='function'){\
return Q(a,(l===undefined)?0:l|0,(h===undefined)?a.shape[0]-1:h|0,y,c)\
}else{\
return B(a,(c===undefined)?0:c|0,(l===undefined)?a.shape[0]-1:l|0,y)\
}}else{\
if(typeof(c)==='function'){\
return P(a,(l===undefined)?0:l|0,(h===undefined)?a.length-1:h|0,y,c)\
}else{\
return A(a,(c===undefined)?0:c|0,(l===undefined)?a.length-1:l|0,y)\
}}}\
return dispatchBsearch", suffix].join(""))
  return result()
}

module.exports = {
  ge: compileBoundsSearch(">=", false, "GE"),
  gt: compileBoundsSearch(">", false, "GT"),
  lt: compileBoundsSearch("<", true, "LT"),
  le: compileBoundsSearch("<=", true, "LE"),
  eq: compileBoundsSearch("-", true, "EQ", true)
}


/***/ }),
/* 60 */
/***/ (function(module, exports) {

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 
// MIT license
var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];
for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                               || window[vendors[x]+'CancelRequestAnimationFrame'];
}

if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };


/***/ }),
/* 61 */
/***/ (function(module, exports) {

//Adapted from here: https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel?redirectlocale=en-US&redirectslug=DOM%2FMozilla_event_reference%2Fwheel

var prefix = "", _addEventListener, onwheel, support;

// detect event model
if ( window.addEventListener ) {
  _addEventListener = "addEventListener";
} else {
  _addEventListener = "attachEvent";
  prefix = "on";
}

// detect available wheel event
support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
          document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
          "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

function _addWheelListener( elem, eventName, callback, useCapture ) {
  elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
    !originalEvent && ( originalEvent = window.event );

    // create a normalized event object
    var event = {
      // keep a ref to the original event object
      originalEvent: originalEvent,
      target: originalEvent.target || originalEvent.srcElement,
      type: "wheel",
      deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
      deltaX: 0,
      delatZ: 0,
      preventDefault: function() {
        originalEvent.preventDefault ?
          originalEvent.preventDefault() :
          originalEvent.returnValue = false;
      }
    };
    
    // calculate deltaY (and deltaX) according to the event
    if ( support == "mousewheel" ) {
      event.deltaY = - 1/40 * originalEvent.wheelDelta;
      // Webkit also support wheelDeltaX
      originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
    } else {
      event.deltaY = originalEvent.detail;
    }

    // it's time to fire the callback
    return callback( event );
  }, useCapture || false );
}

module.exports = function( elem, callback, useCapture ) {
  _addWheelListener( elem, support, callback, useCapture );

  // handle MozMousePixelScroll in older Firefox
  if( support == "DOMMouseScroll" ) {
    _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
  }
};

/***/ }),
/* 62 */
/***/ (function(module, exports) {

if(typeof window.performance === "object") {
  if(window.performance.now) {
    module.exports = function() { return window.performance.now() }
  } else if(window.performance.webkitNow) {
    module.exports = function() { return window.performance.webkitNow() }
  }
} else if(Date.now) {
  module.exports = Date.now
} else {
  module.exports = function() { return (new Date()).getTime() }
}


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



var extend = __webpack_require__(1)
var glvec3 = __webpack_require__(0)
var aabb = __webpack_require__(3)
var sweep = __webpack_require__(15)
var removeUnorderedListItem = __webpack_require__(2).removeUnorderedListItem


// For now, assume Babylon.js has been imported into the global space already
if (!BABYLON) {
    throw new Error('Babylon.js reference not found! Abort! Abort!')
}

module.exports = function (noa, opts, canvas) {
    return new Rendering(noa, opts, canvas)
}

var vec3 = BABYLON.Vector3 // not a gl-vec3, in this module only!!
var col3 = BABYLON.Color3
window.BABYLON = BABYLON


// profiling flags
var PROFILE = 0



var defaults = {
    showFPS: false,
    antiAlias: true,
    clearColor: [0.8, 0.9, 1],
    ambientColor: [1, 1, 1],
    lightDiffuse: [1, 1, 1],
    lightSpecular: [1, 1, 1],
    groundLightColor: [0.5, 0.5, 0.5],
    initialCameraZoom: 0,
    cameraZoomSpeed: .2,
    cameraMaxAngle: (Math.PI / 2) - 0.01,
    useAO: true,
    AOmultipliers: [0.93, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
    useOctreesForDynamicMeshes: true,
}





function Rendering(noa, _opts, canvas) {
    this.noa = noa
    var opts = extend({}, defaults, _opts)
    this.zoomDistance = opts.initialCameraZoom      // zoom setting
    this._currentZoom = this.zoomDistance       // current actual zoom level
    this._cameraZoomSpeed = opts.cameraZoomSpeed
    this._maxCamAngle = opts.cameraMaxAngle

    // internals
    this._dynamicMeshes = []
    this.useAO = !!opts.useAO
    this.aoVals = opts.AOmultipliers
    this.revAoVal = opts.reverseAOmultiplier
    this.meshingCutoffTime = 6 // ms
    this._dynamicMeshOctrees = opts.useOctreesForDynamicMeshes

    // set up babylon scene
    initScene(this, canvas, opts)

    // for debugging
    window.scene = this._scene
    if (opts.showFPS) setUpFPS()
}


// Constructor helper - set up the Babylon.js scene and basic components
function initScene(self, canvas, opts) {
    if (!BABYLON) throw new Error('BABYLON.js engine not found!')

    // init internal properties
    self._engine = new BABYLON.Engine(canvas, opts.antiAlias)
    self._scene = new BABYLON.Scene(self._engine)
    var scene = self._scene
    // remove built-in listeners
    scene.detachControl()

    // octree setup
    self._octree = new BABYLON.Octree()
    self._octree.blocks = []
    scene._selectionOctree = self._octree

    // camera, and empty mesh to hold it, and one to accumulate rotations
    self._rotationHolder = new BABYLON.Mesh('rotHolder', scene)
    self._cameraHolder = new BABYLON.Mesh('camHolder', scene)
    self._camera = new BABYLON.FreeCamera('camera', new vec3(0, 0, 0), scene)
    self._camera.parent = self._cameraHolder
    self._camera.minZ = .01
    self._cameraHolder.visibility = false
    self._rotationHolder.visibility = false

    // plane obscuring the camera - for overlaying an effect on the whole view
    self._camScreen = BABYLON.Mesh.CreatePlane('camScreen', 10, scene)
    self.addMeshToScene(self._camScreen)
    self._camScreen.position.z = .1
    self._camScreen.parent = self._camera
    self._camScreenMat = self.makeStandardMaterial('camscreenmat')
    self._camScreen.material = self._camScreenMat
    self._camScreen.setEnabled(false)
    self._camLocBlock = 0

    // apply some defaults
    self._light = new BABYLON.HemisphericLight('light', new vec3(0.1, 1, 0.3), scene)
    function arrToColor(a) { return new col3(a[0], a[1], a[2]) }
    scene.clearColor = arrToColor(opts.clearColor)
    scene.ambientColor = arrToColor(opts.ambientColor)
    self._light.diffuse = arrToColor(opts.lightDiffuse)
    self._light.specular = arrToColor(opts.lightSpecular)
    self._light.groundColor = arrToColor(opts.groundLightColor)

    // make a default flat material (used or clone by terrain, etc)
    self.flatMaterial = self.makeStandardMaterial('flatmat')

}



/*
 *   PUBLIC API 
*/

// Init anything about scene that needs to wait for engine internals
Rendering.prototype.initScene = function () {
    // engine entity to follow the player and act as camera target
    this.cameraTarget = this.noa.ents.createEntity(['position'])
    this.noa.ents.addComponent(this.cameraTarget, 'followsEntity', {
        entity: this.noa.playerEntity,
        offset: [0, this.noa.playerEyeOffset, 0],
    })
}

// accessor for client app to build meshes and register materials
Rendering.prototype.getScene = function () {
    return this._scene
}

// per-tick listener for rendering-related stuff
Rendering.prototype.tick = function (dt) {
    if (this._dynamicMeshOctrees) updateDynamicMeshOctrees(this)
}





Rendering.prototype.render = function (dt) {
    profile_hook('start')
    updateCamera(this)
    profile_hook('updateCamera')
    this._engine.beginFrame()
    profile_hook('beginFrame')
    this._scene.render()
    profile_hook('render')
    fps_hook()
    this._engine.endFrame()
    profile_hook('endFrame')
    profile_hook('end')
}

Rendering.prototype.resize = function (e) {
    this._engine.resize()
}

Rendering.prototype.highlightBlockFace = function (show, posArr, normArr) {
    var m = getHighlightMesh(this)
    if (show) {
        // bigger slop when zoomed out
        var dist = this._currentZoom + glvec3.distance(this.noa.getPlayerEyePosition(), posArr)
        var slop = 0.001 + 0.001 * dist
        var pos = _highlightPos
        for (var i = 0; i < 3; ++i) {
            pos[i] = Math.floor(posArr[i]) + .5 + ((0.5 + slop) * normArr[i])
        }
        m.position.copyFromFloats(pos[0], pos[1], pos[2])
        m.rotation.x = (normArr[1]) ? Math.PI / 2 : 0
        m.rotation.y = (normArr[0]) ? Math.PI / 2 : 0
    }
    m.setEnabled(show)
}
var _highlightPos = glvec3.create()


Rendering.prototype.getCameraVector = function () {
    return vec3.TransformCoordinates(BABYLON.Axis.Z, this._rotationHolder.getWorldMatrix())
}
var zero = vec3.Zero()
Rendering.prototype.getCameraPosition = function () {
    return vec3.TransformCoordinates(zero, this._camera.getWorldMatrix())
}
Rendering.prototype.getCameraRotation = function () {
    var rot = this._rotationHolder.rotation
    return [rot.x, rot.y]
}
Rendering.prototype.setCameraRotation = function (x, y) {
    var rot = this._rotationHolder.rotation
    rot.x = Math.max(-this._maxCamAngle, Math.min(this._maxCamAngle, x))
    rot.y = y
}




// add a mesh to the scene's octree setup so that it renders
// pass in isStatic=true if the mesh won't move (i.e. change octree blocks)
Rendering.prototype.addMeshToScene = function (mesh, isStatic) {
    // exit silently if mesh has already been added and not removed
    if (mesh._currentNoaChunk || this._octree.dynamicContent.includes(mesh)) {
        return
    }
    var pos = mesh.position
    var chunk = this.noa.world._getChunkByCoords(pos.x, pos.y, pos.z)
    if (this._dynamicMeshOctrees && chunk && chunk.octreeBlock) {
        // add to an octree
        chunk.octreeBlock.entries.push(mesh)
        mesh._currentNoaChunk = chunk
    } else {
        // mesh added outside an active chunk - so treat as scene-dynamic
        this._octree.dynamicContent.push(mesh)
    }
    // remember for updates if it's not static
    if (!isStatic) this._dynamicMeshes.push(mesh)
    // handle remover when mesh gets disposed
    var remover = this.removeMeshFromScene.bind(this, mesh)
    mesh.onDisposeObservable.add(remover)
}

// undo the above
Rendering.prototype.removeMeshFromScene = function (mesh) {
    if (mesh._currentNoaChunk && mesh._currentNoaChunk.octreeBlock) {
        removeUnorderedListItem(mesh._currentNoaChunk.octreeBlock.entries, mesh)
    }
    mesh._currentNoaChunk = null
    removeUnorderedListItem(this._octree.dynamicContent, mesh)
    removeUnorderedListItem(this._dynamicMeshes, mesh)
}




// runs once per tick - move any dynamic meshes to correct chunk octree
function updateDynamicMeshOctrees(self) {
    for (var i = 0; i < self._dynamicMeshes.length; i++) {
        var mesh = self._dynamicMeshes[i]
        if (mesh._isDisposed) continue // shouldn't be possible
        var pos = mesh.position
        var prev = mesh._currentNoaChunk || null
        var next = self.noa.world._getChunkByCoords(pos.x, pos.y, pos.z) || null
        if (prev === next) continue
        // mesh has moved chunks since last update
        // remove from previous location...
        if (prev && prev.octreeBlock) {
            removeUnorderedListItem(prev.octreeBlock.entries, mesh)
        } else {
            removeUnorderedListItem(self._octree.dynamicContent, mesh)
        }
        // ... and add to new location
        if (next && next.octreeBlock) {
            next.octreeBlock.entries.push(mesh)
        } else {
            self._octree.dynamicContent.push(mesh)
        }
        mesh._currentNoaChunk = next
    }
}



Rendering.prototype.makeMeshInstance = function (mesh, isStatic) {
    var m = mesh.createInstance(mesh.name + ' instance' || 'instance')
    if (mesh.billboardMode) m.billboardMode = mesh.billboardMode
    // add to scene so as to render
    this.addMeshToScene(m, isStatic)

    // testing performance tweaks

    // make instance meshes skip over getLOD checks, since there may be lots of them
    // mesh.getLOD = m.getLOD = function () { return mesh }
    m._currentLOD = mesh

    // make terrain instance meshes skip frustum checks 
    // (they'll still get culled by octree checks)
    // if (isStatic) m.isInFrustum = function () { return true }

    return m
}



// Create a default standardMaterial:
//      flat, nonspecular, fully reflects diffuse and ambient light
Rendering.prototype.makeStandardMaterial = function (name) {
    var mat = new BABYLON.StandardMaterial(name, this._scene)
    mat.specularColor.copyFromFloats(0, 0, 0)
    mat.ambientColor.copyFromFloats(1, 1, 1)
    mat.diffuseColor.copyFromFloats(1, 1, 1)
    // not 100% sure this helps but it should..
    setTimeout(function () { mat.freeze() }, 10)
    return mat
}







/*
 *
 * 
 *   ACCESSORS FOR CHUNK ADD/REMOVAL/MESHING
 *
 * 
*/

Rendering.prototype.prepareChunkForRendering = function (chunk) {
    var cs = chunk.size
    var min = new vec3(chunk.x, chunk.y, chunk.z)
    var max = new vec3(chunk.x + cs, chunk.y + cs, chunk.z + cs)
    chunk.octreeBlock = new BABYLON.OctreeBlock(min, max)
    this._octree.blocks.push(chunk.octreeBlock)
}

Rendering.prototype.disposeChunkForRendering = function (chunk) {
    this.removeTerrainMesh(chunk)
    removeUnorderedListItem(this._octree.blocks, chunk.octreeBlock)
    chunk.octreeBlock.entries.length = 0
    chunk.octreeBlock = null
}

Rendering.prototype.addTerrainMesh = function (chunk, mesh) {
    this.removeTerrainMesh(chunk)
    if (mesh.getIndices().length) this.addMeshToScene(mesh, true)
    chunk._terrainMesh = mesh
}

Rendering.prototype.removeTerrainMesh = function (chunk) {
    if (!chunk._terrainMesh) return
    chunk._terrainMesh.dispose()
    chunk._terrainMesh = null
}










/*
 *
 *   INTERNALS
 *
*/




/*
 *
 *  zoom/camera related internals
 *
*/


// check if obstructions are behind camera by sweeping back an AABB
// along the negative camera vector

function cameraObstructionDistance(self) {
    var size = 0.2
    if (!_camBox) {
        _camBox = new aabb([0, 0, 0], [size * 2, size * 2, size * 2])
        _getVoxel = function (x, y, z) {
            return self.noa.world.getBlockSolidity(x, y, z)
        }
    }

    var pos = self._cameraHolder.position
    glvec3.set(_posVec, pos.x - size, pos.y - size, pos.z - size)
    _camBox.setPosition(_posVec)

    var dist = -self.zoomDistance
    var cam = self.getCameraVector()
    glvec3.set(_camVec, dist * cam.x, dist * cam.y, dist * cam.z)

    return sweep(_getVoxel, _camBox, _camVec, function (dist, axis, dir, vec) {
        return true
    }, true)
}

var _posVec = glvec3.create()
var _camVec = glvec3.create()
var _camBox
var _getVoxel




// Various updates to camera position/zoom, called every render

function updateCamera(self) {
    // update cameraHolder pos/rot from rotation holder and target entity
    self._cameraHolder.rotation.copyFrom(self._rotationHolder.rotation)
    var cpos = self.noa.ents.getPositionData(self.cameraTarget).renderPosition
    self._cameraHolder.position.copyFromFloats(cpos[0], cpos[1], cpos[2])

    // check obstructions and tween camera towards clipped position
    var dist = self.zoomDistance
    var speed = self._cameraZoomSpeed
    if (dist > 0) {
        dist = cameraObstructionDistance(self)
        if (dist < self._currentZoom) self._currentZoom = dist
    }
    self._currentZoom += speed * (dist - self._currentZoom)
    self._camera.position.z = -self._currentZoom

    // check id of block camera is in for overlay effects (e.g. being in water) 
    var cam = self.getCameraPosition()
    var id = self.noa.world.getBlockID(Math.floor(cam.x), Math.floor(cam.y), Math.floor(cam.z))
    checkCameraEffect(self, id)
}



//  If camera's current location block id has alpha color (e.g. water), apply/remove an effect

function checkCameraEffect(self, id) {
    if (id === self._camLocBlock) return
    if (id === 0) {
        self._camScreen.setEnabled(false)
    } else {
        var matId = self.noa.registry.getBlockFaceMaterial(id, 0)
        if (matId) {
            var matData = self.noa.registry.getMaterialData(matId)
            var col = matData.color
            var alpha = matData.alpha
            if (col && alpha && alpha < 1) {
                self._camScreenMat.diffuseColor = new col3(col[0], col[1], col[2])
                self._camScreenMat.alpha = alpha
                self._camScreen.setEnabled(true)
            }
        }
    }
    self._camLocBlock = id
}






// make or get a mesh for highlighting active voxel
function getHighlightMesh(rendering) {
    var m = rendering._highlightMesh
    if (!m) {
        var mesh = BABYLON.Mesh.CreatePlane("highlight", 1.0, rendering._scene)
        var hlm = rendering.makeStandardMaterial('highlightMat')
        hlm.backFaceCulling = false
        hlm.emissiveColor = new col3(1, 1, 1)
        hlm.alpha = 0.2
        mesh.material = hlm
        m = rendering._highlightMesh = mesh
        // outline
        var s = 0.5
        var lines = BABYLON.Mesh.CreateLines("hightlightLines", [
            new vec3(s, s, 0),
            new vec3(s, -s, 0),
            new vec3(-s, -s, 0),
            new vec3(-s, s, 0),
            new vec3(s, s, 0)
        ], rendering._scene)
        lines.color = new col3(1, 1, 1)
        lines.parent = mesh

        rendering.addMeshToScene(m)
        rendering.addMeshToScene(lines)
    }
    return m
}




















/*
 * 
 *      sanity checks:
 * 
*/

Rendering.prototype.debug_SceneCheck = function () {
    var meshes = this._scene.meshes
    var dyns = this._octree.dynamicContent
    var octs = []
    var numOcts = 0
    var mats = this._scene.materials
    var allmats = []
    mats.forEach(mat => {
        if (mat.subMaterials) mat.subMaterials.forEach(mat => allmats.push(mat))
        else allmats.push(mat)
    })
    this._octree.blocks.forEach(function (block) {
        numOcts++
        block.entries.forEach(m => octs.push(m))
    })
    meshes.forEach(function (m) {
        if (m._isDisposed) warn(m, 'disposed mesh in scene')
        if (empty(m)) return
        if (missing(m, dyns, octs)) warn(m, 'non-empty mesh missing from octree')
        if (!m.material) { warn(m, 'non-empty scene mesh with no material'); return }
        (m.material.subMaterials || [m.material]).forEach(function (mat) {
            if (missing(mat, mats)) warn(mat, 'mesh material not in scene')
        })
    })
    var unusedMats = []
    allmats.forEach(mat => {
        var used = false
        meshes.forEach(mesh => {
            if (mesh.material === mat) used = true
            if (!mesh.material || !mesh.material.subMaterials) return
            if (mesh.material.subMaterials.includes(mat)) used = true
        })
        if (!used) unusedMats.push(mat.name)
    })
    if (unusedMats.length) {
        console.warn('Materials unused by any mesh: ', unusedMats.join(', '))
    }
    dyns.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree/dynamic mesh not in scene')
    })
    octs.forEach(function (m) {
        if (missing(m, meshes)) warn(m, 'octree block mesh not in scene')
    })
    var avgPerOct = Math.round(10 * octs.length / numOcts) / 10
    console.log('meshes - octree:', octs.length, '  dynamic:', dyns.length,
        '   avg meshes/octreeBlock:', avgPerOct)
    function warn(obj, msg) { console.warn(obj.name + ' --- ' + msg) }
    function empty(mesh) { return (mesh.getIndices().length === 0) }
    function missing(obj, list1, list2) {
        if (!obj) return false
        if (list1.includes(obj)) return false
        if (list2 && list2.includes(obj)) return false
        return true
    }
    return 'done.'
}

Rendering.prototype.debug_MeshCount = function () {
    var ct = {}
    this._scene.meshes.forEach(m => {
        var n = m.name || ''
        n = n.replace(/-\d+.*/, '#')
        n = n.replace(/\d+.*/, '#')
        n = n.replace(/(rotHolder|camHolder|camScreen)/, 'rendering use')
        n = n.replace(/atlas sprite .*/, 'atlas sprites')
        ct[n] = ct[n] || 0
        ct[n]++
    })
    for (var s in ct) console.log('   ' + (ct[s] + '       ').substr(0, 7) + s)
}







var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 200
    var timer = new (__webpack_require__(2).Timer)(every, 'render internals')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



var fps_hook = function () { }
function setUpFPS() {
    var div = document.createElement('div')
    div.id = 'noa_fps'
    var style = 'position:absolute; top:0; right:0; z-index:0;'
    style += 'color:white; background-color:rgba(0,0,0,0.5);'
    style += 'font:14px monospace; text-align:center;'
    style += 'min-width:2em; margin:4px;'
    div.style = style
    document.body.appendChild(div)
    var every = 1000
    var ct = 0
    var longest = 0
    var start = performance.now()
    var last = start
    fps_hook = function () {
        ct++
        var nt = performance.now()
        if (nt - last > longest) longest = nt - last
        last = nt
        if (nt - start < every) return
        var fps = Math.round(ct / (nt - start) * 1000)
        var min = Math.round(1 / longest * 1000)
        div.innerHTML = fps + '<br>' + min
        ct = 0
        longest = 0
        start = nt
    }
}




/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)
var ndarray = __webpack_require__(5)
var ndHash = __webpack_require__(65)
var EventEmitter = __webpack_require__(4).EventEmitter
var Chunk = __webpack_require__(66)


module.exports = function (noa, opts) {
    return new World(noa, opts)
}


var PROFILE = 0
var PROFILE_QUEUES = 0


var defaultOptions = {
    chunkSize: 24,
    chunkAddDistance: 3,
    chunkRemoveDistance: 4
}

/**
 * Module for managing the world, and its chunks
 * @class noa.world
 * 
 * Emits:
 *  * worldDataNeeded  (id, ndarray, x, y, z)
 *  * chunkAdded (chunk)
 *  * chunkChanged (chunk)
 *  * chunkBeingRemoved (id, ndarray, userData)
 */

function World(noa, _opts) {
    this.noa = noa
    var opts = extend(defaultOptions, _opts)

    this.userData = null
    this.playerChunkLoaded = false
    this.Chunk = Chunk

    this.chunkSize = opts.chunkSize
    this.chunkAddDistance = opts.chunkAddDistance
    this.chunkRemoveDistance = opts.chunkRemoveDistance
    if (this.chunkRemoveDistance < this.chunkAddDistance) {
        this.chunkRemoveDistance = this.chunkAddDistance
    }

    // internals
    this._chunkIDsToAdd = []
    this._chunkIDsToRemove = []
    this._chunkIDsInMemory = []
    this._chunkIDsToCreate = []
    this._chunkIDsToMesh = []
    this._chunkIDsToMeshFirst = []
    this._maxChunksPendingCreation = 20
    this._maxChunksPendingMeshing = 20
    this._maxProcessingPerTick = 9 // ms
    this._maxProcessingPerRender = 5 // ms

    // triggers a short visit to the meshing queue before renders
    var self = this
    noa.on('beforeRender', function () { beforeRender(self) })

    // actual chunk storage - hash size hard coded for now
    this._chunkHash = ndHash([1024, 1024, 1024])

    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    var cs = this.chunkSize
    if (cs & cs - 1 === 0) {
        var shift = Math.log2(cs) | 0
        var mask = (cs - 1) | 0
        worldCoordToChunkCoord = coord => (coord >> shift) | 0
        worldCoordToChunkIndex = coord => (coord & mask) | 0
    } else {
        worldCoordToChunkCoord = coord => Math.floor(coord / cs) | 0
        worldCoordToChunkIndex = coord => (((coord % cs) + cs) % cs) | 0
    }

}
World.prototype = Object.create(EventEmitter.prototype)

var worldCoordToChunkCoord
var worldCoordToChunkIndex




/*
 *   PUBLIC API 
*/



/** @param x,y,z */
World.prototype.getBlockID = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return chunk.get(ix, iy, iz)
}

/** @param x,y,z */
World.prototype.getBlockSolidity = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return !!chunk.getSolidityAt(ix, iy, iz)
}

/** @param x,y,z */
World.prototype.getBlockOpacity = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockOpacity(id)
}

/** @param x,y,z */
World.prototype.getBlockFluidity = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockFluidity(id)
}

/** @param x,y,z */
World.prototype.getBlockProperties = function (x, y, z) {
    var id = this.getBlockID(x, y, z)
    return this.noa.registry.getBlockProps(id)
}

/** @param x,y,z */
World.prototype.getBlockObjectMesh = function (x, y, z) {
    var chunk = this._getChunkByCoords(x, y, z)
    if (!chunk) return 0

    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)
    return chunk.getObjectMeshAt(ix, iy, iz)
}


/** @param x,y,z */
World.prototype.setBlockID = function (val, x, y, z) {
    var i = worldCoordToChunkCoord(x)
    var j = worldCoordToChunkCoord(y)
    var k = worldCoordToChunkCoord(z)
    var ix = worldCoordToChunkIndex(x)
    var iy = worldCoordToChunkIndex(y)
    var iz = worldCoordToChunkIndex(z)

    // if update is on chunk border, update neighbor's padding data too
    _updateChunkAndBorders(this, i, j, k, this.chunkSize, ix, iy, iz, val)
}


/** @param x,y,z */
World.prototype.isBoxUnobstructed = function (box) {
    var base = box.base
    var max = box.max
    for (var i = Math.floor(base[0]); i < max[0] + 1; i++) {
        for (var j = Math.floor(base[1]); j < max[1] + 1; j++) {
            for (var k = Math.floor(base[2]); k < max[2] + 1; k++) {
                if (this.getBlockSolidity(i, j, k)) return false
            }
        }
    }
    return true
}





World.prototype.tick = function () {
    profile_hook('start')

    // check player position and needed/unneeded chunks
    var pos = getPlayerChunkCoords(this)
    var chunkID = getChunkID(pos[0], pos[1], pos[2])
    if (chunkID != this._lastPlayerChunkID) {
        this.emit('playerEnteredChunk', pos[0], pos[1], pos[2])
        buildChunkAddQueue(this, pos[0], pos[1], pos[2])
        buildChunkRemoveQueue(this, pos[0], pos[1], pos[2])
    }
    this._lastPlayerChunkID = chunkID
    profile_hook('build queues')

    // process (create or mesh) some chunks. If fast enough, do several
    profile_queues(this, 'start')
    var cutoff = performance.now() + this._maxProcessingPerTick
    var done = false
    while (!done && (performance.now() < cutoff)) {
        done = processMeshingQueues(this, false)
        done &= processChunkQueues(this)
    }
    profile_queues(this, 'end')


    // track whether the player's local chunk is loaded and ready or not
    var pChunk = getChunk(this, pos[0], pos[1], pos[2])
    var okay = !!(pChunk && pChunk.isGenerated && !pChunk.isInvalid)
    this.playerChunkLoaded = okay

    profile_hook('end')
}



function beforeRender(self) {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    var cutoff = performance.now() + self._maxProcessingPerRender
    var done = false
    var ct = 0
    while (!done && (performance.now() < cutoff)) {
        done = processMeshingQueues(self, true)
        if (!done) ct++
    }
}




/** client should call this after creating a chunk's worth of data (as an ndarray)  
 * If userData is passed in it will be attached to the chunk
 * @param id
 * @param array
 * @param userData
 */
World.prototype.setChunkData = function (id, array, userData) {
    profile_queues(this, 'received')
    var arr = parseChunkID(id)
    var chunk = getChunk(this, arr[0], arr[1], arr[2])
    // ignore if chunk was invalidated while being prepared
    if (!chunk || chunk.isInvalid) return
    chunk.array = array
    if (userData) chunk.userData = userData
    chunk.initData()
    enqueueID(id, this._chunkIDsInMemory)
    unenqueueID(id, this._chunkIDsToCreate)

    // chunk can now be meshed...
    this.noa.rendering.prepareChunkForRendering(chunk)
    enqueueID(id, this._chunkIDsToMesh)
    this.emit('chunkAdded', chunk)
}




/*
 * Calling this causes all world chunks to get unloaded and recreated 
 * (after receiving new world data from the client). This is useful when
 * you're teleporting the player to a new world, e.g.
*/
World.prototype.invalidateAllChunks = function () {
    var toInval = this._chunkIDsInMemory.concat(this._chunkIDsToCreate)
    for (var id of toInval) {
        var loc = parseChunkID(id)
        var chunk = getChunk(this, loc[0], loc[1], loc[2])
        chunk.isInvalid = true
    }
    // this causes chunk queues to get rebuilt next tick
    this._lastPlayerChunkID = ''
}



// debugging
World.prototype.report = function () {
    console.log('World report - playerChunkLoaded: ', this.playerChunkLoaded)
    _report(this, '  to add     ', this._chunkIDsToAdd)
    _report(this, '  to remove: ', this._chunkIDsToRemove)
    _report(this, '  in memory: ', this._chunkIDsInMemory, true)
    _report(this, '  creating:  ', this._chunkIDsToCreate)
    _report(this, '  meshing:   ', this._chunkIDsToMesh)
}
function _report(world, name, arr, ext) {
    var ct = 0, full = 0, empty = 0
    for (var id of arr) {
        if (id.size) {
            if (id.isInvalid) ct++
            continue
        }
        var loc = parseChunkID(id)
        var chunk = getChunk(world, loc[0], loc[1], loc[2])
        if (chunk.isInvalid) ct++
        if (chunk.isFull) full++
        if (chunk.isEmpty) empty++
    }
    var len = (arr.length + '        ').substr(0, 6)
    var es = (ext) ? [', ', full, ' full, ', empty, ' empty'].join('') : ''
    console.log(name, len, ct, 'invalid' + es)
}




/*
 *    INTERNALS
*/


// canonical string ID handling for the i,j,k-th chunk
function getChunkID(i, j, k) {
    return i + '|' + j + '|' + k
}
function parseChunkID(id) {
    var arr = id.split('|')
    return [parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2])]
}

// canonical functions to store/retrieve a chunk held in memory
function getChunk(world, i, j, k) {
    var mi = (i | 0) & 1023
    var mj = (j | 0) & 1023
    var mk = (k | 0) & 1023
    return world._chunkHash.get(mi, mj, mk)
}

function setChunk(world, i, j, k, value) {
    var mi = (i | 0) & 1023
    var mj = (j | 0) & 1023
    var mk = (k | 0) & 1023
    world._chunkHash.set(mi, mj, mk, value)
}



function getPlayerChunkCoords(world) {
    var pos = world.noa.getPlayerPosition()
    var i = worldCoordToChunkCoord(pos[0])
    var j = worldCoordToChunkCoord(pos[1])
    var k = worldCoordToChunkCoord(pos[2])
    return [i, j, k]
}


// for internal use
World.prototype._getChunkByCoords = function (x, y, z) {
    var i = worldCoordToChunkCoord(x)
    var j = worldCoordToChunkCoord(y)
    var k = worldCoordToChunkCoord(z)
    return getChunk(this, i, j, k)
}




// run through chunk tracking queues looking for work to do next
function processChunkQueues(self) {
    var done = true
    // both queues are sorted by ascending distance
    if (self._chunkIDsToRemove.length) {
        var remove = parseChunkID(self._chunkIDsToRemove.pop())
        removeChunk(self, remove[0], remove[1], remove[2])
        profile_queues(self, 'removed')
        profile_hook('removed')
        done = false
    }
    if (self._chunkIDsToCreate.length >= self._maxChunksPendingCreation) return done
    if (self._chunkIDsToMesh.length >= self._maxChunksPendingMeshing) return done
    if (self._chunkIDsToAdd.length) {
        var id = self._chunkIDsToAdd.shift()
        requestNewChunk(self, id)
        profile_hook('requested')
        profile_queues(self, 'requested')
        done = false
    }
    return done
}


// similar to above but for chunks waiting to be meshed
function processMeshingQueues(self, firstOnly) {
    var id
    if (self._chunkIDsToMeshFirst.length) {
        id = self._chunkIDsToMeshFirst.pop()
    } else if (!firstOnly && self._chunkIDsToMesh.length) {
        id = self._chunkIDsToMesh.pop()
    } else return true

    var arr = parseChunkID(id)
    var chunk = getChunk(self, arr[0], arr[1], arr[2])
    if (chunk.isInvalid) return
    chunk.updateMeshes()

    profile_queues(self, 'meshed')
    profile_hook('meshed')
    return false
}










// make a new chunk and emit an event for it to be populated with world data
function requestNewChunk(world, id) {
    var pos = parseChunkID(id)
    var i = pos[0]
    var j = pos[1]
    var k = pos[2]
    var size = world.chunkSize
    var chunk = new Chunk(world.noa, id, i, j, k, size)
    setChunk(world, i, j, k, chunk)
    var x = i * size - 1
    var y = j * size - 1
    var z = k * size - 1
    enqueueID(id, world._chunkIDsToCreate)
    world.emit('worldDataNeeded', id, chunk.array, x, y, z)
}




// remove a chunk that wound up in the remove queue
function removeChunk(world, i, j, k) {
    var chunk = getChunk(world, i, j, k)
    world.emit('chunkBeingRemoved', chunk.id, chunk.array, chunk.userData)
    world.noa.rendering.disposeChunkForRendering(chunk)
    chunk.dispose()
    setChunk(world, i, j, k, 0)
    unenqueueID(chunk.id, world._chunkIDsInMemory)
    unenqueueID(chunk.id, world._chunkIDsToMesh)
    unenqueueID(chunk.id, world._chunkIDsToMeshFirst)
    // when removing a chunk because it was invalid, arrange for chunk queues to get rebuilt
    if (chunk.isInvalid) world._lastPlayerChunkID = ''
}





// for a given chunk (i/j/k) and local location (x/y/z), 
// update all chunks that need it (including border chunks with the 
// changed block in their 1-block padding)

function _updateChunkAndBorders(world, i, j, k, size, x, y, z, val) {
    var ilocs = [0]
    var jlocs = [0]
    var klocs = [0]
    if (x === 0) { ilocs.push(-1) } else if (x === size - 1) { ilocs.push(1) }
    if (y === 0) { jlocs.push(-1) } else if (y === size - 1) { jlocs.push(1) }
    if (z === 0) { klocs.push(-1) } else if (z === size - 1) { klocs.push(1) }

    for (var di of ilocs) {
        var lx = [size, x, -1][di + 1]
        for (var dj of jlocs) {
            var ly = [size, y, -1][dj + 1]
            for (var dk of klocs) {
                var lz = [size, z, -1][dk + 1]
                _modifyBlockData(world,
                    i + di, j + dj, k + dk,
                    lx, ly, lz, val)
            }
        }
    }
}



// internal function to modify a chunk's block

function _modifyBlockData(world, i, j, k, x, y, z, val) {
    var chunk = getChunk(world, i, j, k)
    if (!chunk) return
    chunk.set(x, y, z, val)
    enqueueID(chunk.id, world._chunkIDsToMeshFirst)
    world.emit('chunkChanged', chunk)
}




// rebuild queue of chunks to be added around (ci,cj,ck)
function buildChunkAddQueue(world, ci, cj, ck) {
    var add = Math.ceil(world.chunkAddDistance)
    var pending = world._chunkIDsToCreate
    var queue = []
    var distArr = []

    var addDistSq = world.chunkAddDistance * world.chunkAddDistance
    for (var i = ci - add; i <= ci + add; ++i) {
        for (var j = cj - add; j <= cj + add; ++j) {
            for (var k = ck - add; k <= ck + add; ++k) {
                var di = i - ci
                var dj = j - cj
                var dk = k - ck
                var distSq = di * di + dj * dj + dk * dk
                if (distSq > addDistSq) continue

                if (getChunk(world, i, j, k)) continue
                var id = getChunkID(i, j, k)
                if (pending.indexOf(id) > -1) continue
                queue.push(id)
                distArr.push(distSq)
            }
        }
    }
    world._chunkIDsToAdd = sortByReferenceArray(queue, distArr)
}


// rebuild queue of chunks to be removed from around (ci,cj,ck)
function buildChunkRemoveQueue(world, ci, cj, ck) {
    var remDistSq = world.chunkRemoveDistance * world.chunkRemoveDistance
    var list = world._chunkIDsInMemory
    var queue = []
    var distArr = []

    for (var i = 0; i < list.length; i++) {
        var id = list[i]
        var loc = parseChunkID(id)
        var di = loc[0] - ci
        var dj = loc[1] - cj
        var dk = loc[2] - ck
        var distSq = di * di + dj * dj + dk * dk
        if (distSq < remDistSq) {
            var chunk = getChunk(world, loc[0], loc[1], loc[2])
            if (!chunk.isInvalid) continue
            distSq *= -1 // rig sort so that invalidated chunks get removed first
        }
        queue.push(id)
        distArr.push(distSq)
    }
    world._chunkIDsToRemove = sortByReferenceArray(queue, distArr)
}



// sorts [A, B, C] and [3, 1, 2] into [B, C, A]
function sortByReferenceArray(data, ref) {
    var ind = Object.keys(ref)
    ind.sort((i, j) => ref[i] - ref[j])
    return ind.map(i => data[i])
}





// uniquely enqueue a string id into an array of them
function enqueueID(id, queue) {
    var i = queue.indexOf(id)
    if (i >= 0) return
    queue.push(id)
}

// remove string id from queue if it exists
function unenqueueID(id, queue) {
    var i = queue.indexOf(id)
    if (i >= 0) queue.splice(i, 1)
}





var profile_queues = function (w, s) { }
if (PROFILE_QUEUES) (function () {
    var every = 100
    var iter = 0
    var t, nrem, nreq, totalrec, nmesh
    var temprem, tempreq
    var reqcts, remcts, meshcts
    var qadd, qrem, qmem, qpend, qmesh
    profile_queues = function (world, state) {
        if (state === 'start') {
            if (iter === 0) {
                t = performance.now()
                qadd = qrem = qmem = qpend = qmesh = 0
                totalrec = 0
                remcts = []
                reqcts = []
                meshcts = []
            }
            iter++
            nrem = nreq = nmesh = 0
        } else if (state === 'removed') {
            nrem++
        } else if (state === 'received') {
            totalrec++
        } else if (state === 'requested') {
            nreq++
        } else if (state === 'meshed') {
            nmesh++
        } else if (state === 'end') {
            // counts for frames that were fully worked
            if (world._chunkIDsToAdd.length) reqcts.push(nreq)
            if (world._chunkIDsToRemove.length) remcts.push(nrem)
            if (world._chunkIDsToMesh.length + world._chunkIDsToMeshFirst.length) meshcts.push(nmesh)
            // avg queue sizes
            qadd += world._chunkIDsToAdd.length
            qrem += world._chunkIDsToRemove.length
            qmem += world._chunkIDsInMemory.length
            qpend += world._chunkIDsToCreate.length
            qmesh += world._chunkIDsToMesh.length
            // on end
            if (iter === every) {
                var dt = (performance.now() - t) / 1000
                console.log('world chunk queues:',
                    'made', Math.round(totalrec / dt), 'cps',
                    '- avg queuelen: ',
                    'add', qadd / every,
                    'rem', qrem / every,
                    'mem', qmem / every,
                    'pend', qpend / every,
                    'mesh', qmesh / every,
                    '- work/frame: ',
                    'req', Math.round(reqcts.reduce(sum, 0) / reqcts.length * 10) / 10,
                    'rem', Math.round(remcts.reduce(sum, 0) / remcts.length * 10) / 10,
                    'mesh', Math.round(meshcts.reduce(sum, 0) / meshcts.length * 10) / 10
                )
                iter = 0
            }
        }
    }
    var sum = function (num, prev) { return num + prev }
})()


var profile_hook = function (s) { }
if (PROFILE) (function () {
    var every = 200
    var timer = new (__webpack_require__(2).Timer)(every, 'world ticks')
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()




/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ndarray = __webpack_require__(5)
var useMaps = !(typeof Map === "undefined")

function HashMap(n) {
  this.length = n
  this.store = useMaps ? new Map() : {}
}

if (useMaps) {
  HashMap.prototype.get = function(i) {
    return this.store.get(i) || 0
  }
  HashMap.prototype.set = function(i,v) {
    if (v===0) {
      this.store.delete(i)
    } else {
      this.store.set(i, v)
    }
    return v
  }
} else { // Using a polyfill would be neater, but this works as well 
  HashMap.prototype.get = function(i) {
    return this.store[i] || 0
  }
  HashMap.prototype.set = function(i,v) {
    if (v===0) {
      delete this.store[i]
    } else {
      this.store[i] = v
    }
    return v
  }
}

function createNDHash(shape) {
  var sz = 1
  for(var i=0; i<shape.length; ++i) {
    sz *= shape[i]
  }
  return ndarray(new HashMap(sz), shape)
}

module.exports = createNDHash

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(16)
var ndarray = __webpack_require__(5)
window.ndarray = ndarray


module.exports = Chunk


// shared references to terrain/object meshers
var terrainMesher = __webpack_require__(67)
var objectMesher = __webpack_require__(68)




/* 
 * 
 *   Chunk
 * 
 *  Stores and manages voxel ids and flags for each voxel within chunk
 *  See constants.js for internal data representation
 * 
*/



// data representation
var ID_MASK = constants.ID_MASK
var VAR_MASK = constants.VAR_MASK
var SOLID_BIT = constants.SOLID_BIT
var OPAQUE_BIT = constants.OPAQUE_BIT
var OBJECT_BIT = constants.OBJECT_BIT




/*
 *
 *    Chunk constructor
 *
*/

function Chunk(noa, id, i, j, k, size) {
    this.id = id

    this.noa = noa
    this.isDisposed = false
    this.isGenerated = false
    this.inInvalid = false
    this.octreeBlock = null
    this._terrainMesh = null

    this.isEmpty = false
    this.isFull = false

    // packed data storage
    var s = size + 2 // 1 block of padding on each side
    var arr = new Uint16Array(s * s * s)
    this.array = new ndarray(arr, [s, s, s])
    this.i = i
    this.j = j
    this.k = k
    this.size = size
    this.x = i * size
    this.y = j * size
    this.z = k * size

    // flags to track if things need re-meshing
    this._terrainDirty = false
    this._objectsDirty = false

    // init references shared among all chunks
    setBlockLookups(noa)

    // build unpadded and transposed array views for internal use
    rebuildArrayViews(this)

    // adds some properties to the chunk for handling object meshes
    objectMesher.initChunk(this)

}



// Registry lookup references shared by all chunks
var solidLookup
var opaqueLookup
var objectMeshLookup
var blockHandlerLookup

function setBlockLookups(noa) {
    solidLookup = noa.registry._solidityLookup
    opaqueLookup = noa.registry._opacityLookup
    objectMeshLookup = noa.registry._blockMeshLookup
    blockHandlerLookup = noa.registry._blockHandlerLookup
}




/*
 *
 *    Chunk API
 *
*/

// get/set deal with block IDs, so that this class acts like an ndarray

Chunk.prototype.get = function (x, y, z) {
    return ID_MASK & this._unpaddedView.get(x, y, z)
}

Chunk.prototype.getSolidityAt = function (x, y, z) {
    return (SOLID_BIT & this._unpaddedView.get(x, y, z)) ? true : false
}

Chunk.prototype.set = function (x, y, z, id) {
    var oldID = this._unpaddedView.get(x, y, z)
    var oldIDnum = oldID & ID_MASK
    if (id === oldIDnum) return

    // manage data
    var newID = packID(id)
    this._unpaddedView.set(x, y, z, newID)

    // handle object meshes
    if (oldID & OBJECT_BIT) removeObjectBlock(this, x, y, z)
    if (newID & OBJECT_BIT) addObjectBlock(this, id, x, y, z)

    // track full/emptyness
    if (newID !== 0) this.isEmpty = false
    if (!(newID & OPAQUE_BIT)) this.isFull = false

    // call block handlers
    callBlockHandler(this, oldIDnum, 'onUnset', x, y, z)
    callBlockHandler(this, id, 'onSet', x, y, z)

    // mark terrain dirty unless neither block was terrain
    if (isTerrain(oldID) || isTerrain(newID)) this._terrainDirty = true
}






// helper to call handler of a given type at a particular xyz

function callBlockHandler(chunk, blockID, type, x, y, z) {
    var hobj = blockHandlerLookup[blockID]
    if (!hobj) return
    var handler = hobj[type]
    if (!handler) return
    // ignore all handlers if block is in chunk's edge padding blocks
    var s = chunk.size
    if (x < 0 || y < 0 || z < 0 || x >= s || y >= s || z >= s) return
    handler(chunk.x + x, chunk.y + y, chunk.z + z)
}



// Convert chunk's voxel terrain into a babylon.js mesh
// Used internally, but needs to be public so mesh-building hacks can call it
Chunk.prototype.mesh = function (matGetter, colGetter, useAO, aoVals, revAoVal) {
    return terrainMesher.meshChunk(this, matGetter, colGetter, useAO, aoVals, revAoVal)
}





// gets called by World when this chunk has been queued for remeshing
Chunk.prototype.updateMeshes = function () {
    if (this._terrainDirty) {
        this.noa.rendering.removeTerrainMesh(this)
        var mesh = this.mesh()
        if (mesh) this.noa.rendering.addTerrainMesh(this, mesh)
        this._terrainDirty = false
    }
    if (this._objectsDirty) {
        objectMesher.buildObjectMesh(this)
        this._objectsDirty = false
    }
}







// helper to determine if a block counts as "terrain" (non-air, non-object)
function isTerrain(id) {
    if (id === 0) return false
    // treat object blocks as terrain if solid (they affect AO)
    if (id & OBJECT_BIT) return !!(id & SOLID_BIT)
    return true
}

// helper to pack a block ID into the internally stored form, given lookup tables
function packID(id) {
    var newID = id
    if (solidLookup[id]) newID |= SOLID_BIT
    if (opaqueLookup[id]) newID |= OPAQUE_BIT
    if (objectMeshLookup[id]) newID |= OBJECT_BIT
    return newID
}








/*
 * 
 *      Init
 * 
 *  Gets called right after client filled the voxel ID data array
*/



Chunk.prototype.initData = function () {
    // remake other views, assuming that data has changed
    rebuildArrayViews(this)
    // flags for tracking if chunk is entirely opaque or transparent
    var fullyOpaque = OPAQUE_BIT
    var fullyAir = true

    // init everything in one big scan
    var arr = this.array
    var data = arr.data
    var len = arr.shape[0]
    var kstride = arr.stride[2]
    var objHash = this._objectMeshes
    for (var i = 0; i < len; ++i) {
        var edge1 = (i === 0 || i === len - 1)
        for (var j = 0; j < len; ++j) {
            var d0 = arr.index(i, j, 0)
            var edge2 = edge1 || (j === 0 || j === len - 1)
            for (var k = 0; k < len; ++k, d0 += kstride) {
                // pull raw ID - could in principle be packed, so mask it
                var id = data[d0] & ID_MASK
                // skip air blocks
                if (id === 0) {
                    fullyOpaque = 0
                    continue
                }
                // store ID as packed internal representation
                var packed = packID(id) | 0
                data[d0] = packed
                // track whether chunk is entirely full or empty
                fullyOpaque &= packed
                fullyAir = false
                // within unpadded view, handle object blocks and handlers
                var atEdge = edge2 || (k === 0 || k === len - 1)
                if (!atEdge) {
                    if (OBJECT_BIT & packed) {
                        addObjectBlock(this, id, i - 1, j - 1, k - 1)
                    }
                    callBlockHandler(this, id, 'onLoad', i - 1, j - 1, k - 1)
                }
            }
        }
    }

    this.isFull = !!(fullyOpaque & OPAQUE_BIT)
    this.isEmpty = !!(fullyAir)
    this._terrainDirty = !(this.isFull || this.isEmpty)

    this.isGenerated = true
}


// helper to rebuild several transformed views on the data array

function rebuildArrayViews(chunk) {
    var arr = chunk.array
    var size = chunk.size
    chunk._unpaddedView = arr.lo(1, 1, 1).hi(size, size, size)
}



// accessors related to meshing

function addObjectBlock(chunk, id, x, y, z) {
    objectMesher.addObjectBlock(chunk, id, x, y, z)
    chunk._objectsDirty = true
}

function removeObjectBlock(chunk, x, y, z) {
    objectMesher.removeObjectBlock(chunk, x, y, z)
    chunk._objectsDirty = true
}





// dispose function - just clears properties and references

Chunk.prototype.dispose = function () {
    // look through the data for onUnload handlers
    callAllBlockHandlers(this, 'onUnload')

    // let meshers dispose their stuff
    objectMesher.disposeChunk(this)

    // apparently there's no way to dispose typed arrays, so just null everything
    this.array.data = null
    this.array = null
    this._unpaddedView = null

    this.isGenerated = false
    this.isDisposed = true
}


// helper to call a given handler for all blocks in the chunk

function callAllBlockHandlers(chunk, type) {
    var view = chunk._unpaddedView
    var data = view.data
    var si = view.stride[0]
    var sj = view.stride[1]
    var sk = view.stride[2]
    var size = view.shape[0]
    var d0 = view.offset
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            for (var k = 0; k < size; ++k) {
                var id = ID_MASK & data[d0]
                callBlockHandler(chunk, id, type, i, j, k)
                d0 += sk
            }
            d0 -= sk * size
            d0 += sj
        }
        d0 -= sj * size
        d0 += si
    }
}






/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";





var mesher
module.exports = new TerrainMesher()




// enable for profiling..
var PROFILE = 0




/*
 * 
 *          TERRAIN MESHER!!
 * 
*/


function TerrainMesher() {

    var greedyMesher = new GreedyMesher()
    var meshBuilder = new MeshBuilder()


    /*
     * 
     * Entry point and high-level flow
     * 
    */

    this.meshChunk = function (chunk, matGetter, colGetter, ignoreMaterials, useAO, aoVals, revAoVal) {
        profile_hook('start')
        var noa = chunk.noa

        // args
        var array = chunk.array
        var mats = matGetter || noa.registry.getBlockFaceMaterial
        var cols = colGetter || noa.registry._getMaterialVertexColor
        var ao = (useAO === undefined) ? noa.rendering.useAO : useAO
        var vals = aoVals || noa.rendering.aoVals
        var rev = isNaN(revAoVal) ? noa.rendering.revAoVal : revAoVal

        // greedy mesher creates an array of Submesh structs
        var subMeshes = greedyMesher.mesh(array, mats, cols, ao, vals, rev)

        // builds the babylon mesh that will be added to the scene
        var mesh
        if (subMeshes.length) {
            mesh = meshBuilder.build(chunk, subMeshes, ignoreMaterials)
            profile_hook('built terrain')
        }

        profile_hook('end')
        return mesh || null
    }

}




/*
 * 
 *  Submesh - holds one submesh worth of greedy-meshed data
 * 
 *  Basically, the greedy mesher builds these and the mesh builder consumes them
 * 
*/

function Submesh(id) {
    this.id = id | 0
    this.positions = []
    this.indices = []
    this.normals = []
    this.colors = []
    this.uvs = []
}

Submesh.prototype.dispose = function () {
    this.positions = null
    this.indices = null
    this.normals = null
    this.colors = null
    this.uvs = null
}








/*
 * 
 *  Mesh Builder - turns an array of Submesh data into a 
 *  Babylon.js mesh/submeshes, ready to be added to the scene
 * 
*/

function MeshBuilder() {

    var noa


    // core
    this.build = function (chunk, meshdata, ignoreMaterials) {
        noa = chunk.noa

        // preprocess meshdata entries to merge those that will use default terrain material
        var mergeCriteria = function (mdat) {
            if (ignoreMaterials) return true
            if (mdat.renderMat) return false
            var url = noa.registry.getMaterialTexture(mdat.id)
            var alpha = noa.registry.getMaterialData(mdat.id).alpha
            if (url || alpha < 1) return false
        }
        mergeSubmeshes(meshdata, mergeCriteria)

        // now merge everything, keeping track of vertices/indices/materials
        var results = mergeSubmeshes(meshdata, () => true)

        // merge sole remaining submesh instance into a babylon mesh
        var mdat = meshdata[results.mergedID]
        var name = 'chunk_' + chunk.id
        var mats = results.matIDs.map(id => getTerrainMaterial(id, ignoreMaterials))
        var mesh = buildMeshFromSubmesh(mdat, name, mats, results.vertices, results.indices)

        // position, freeze and exit
        var x = chunk.i * chunk.size
        var y = chunk.j * chunk.size
        var z = chunk.k * chunk.size
        mesh.position.x = x
        mesh.position.y = y
        mesh.position.z = z

        mesh.freezeWorldMatrix()
        mesh.freezeNormals()
        return mesh
    }



    // this version builds a parent mesh + child meshes, rather than
    // one big mesh with submeshes and a multimaterial.
    // This should be obsolete, unless the first one has problems..
    this.buildWithoutMultimats = function (chunk, meshdata, ignoreMaterials) {
        noa = chunk.noa

        // preprocess meshdata entries to merge those that use default terrain material
        var mergeCriteria = function (mdat) {
            if (ignoreMaterials) return true
            if (mdat.renderMat) return false
            var url = noa.registry.getMaterialTexture(mdat.id)
            var alpha = noa.registry.getMaterialData(mdat.id).alpha
            if (url || alpha < 1) return false
        }
        mergeSubmeshes(meshdata, mergeCriteria)

        // go through (remaining) meshdata entries and create a mesh for each
        // call the first one the parent, and attach others to it
        var parent = null
        var keylist = Object.keys(meshdata)
        for (var i = 0; i < keylist.length; ++i) {
            var mdat = meshdata[keylist[i]]
            var matID = mdat.id
            var mat = getTerrainMaterial(matID, ignoreMaterials)
            var name = 'chunk_inner_' + chunk.id + ' ' + matID
            var mesh = buildMeshFromSubmesh(mdat, name, [mat])

            if (!parent) {
                parent = mesh
                // position the parent globally
                var x = chunk.i * chunk.size
                var y = chunk.j * chunk.size
                var z = chunk.k * chunk.size
                parent.position.x = x
                parent.position.y = y
                parent.position.z = z
            } else {
                mesh.parent = parent
            }

            mesh.freezeWorldMatrix()
            mesh.freezeNormals()
        }

        return parent
    }



    // given a set of submesh objects, merge all those that 
    // meet some criteria into the first such submesh
    //      modifies meshDataList in place!
    function mergeSubmeshes(meshDataList, criteria) {
        var vertices = []
        var indices = []
        var matIDs = []

        var keylist = Object.keys(meshDataList)
        var target = null
        var targetID
        for (var i = 0; i < keylist.length; ++i) {
            var mdat = meshDataList[keylist[i]]
            if (!criteria(mdat)) continue

            vertices.push(mdat.positions.length)
            indices.push(mdat.indices.length)
            matIDs.push(mdat.id)

            if (!target) {
                target = mdat
                targetID = keylist[i]

            } else {
                var indexOffset = target.positions.length / 3
                // merge data in "mdat" onto "target"
                target.positions = target.positions.concat(mdat.positions)
                target.normals = target.normals.concat(mdat.normals)
                target.colors = target.colors.concat(mdat.colors)
                target.uvs = target.uvs.concat(mdat.uvs)
                // indices must be offset relative to data being merged onto
                for (var j = 0, len = mdat.indices.length; j < len; ++j) {
                    target.indices.push(mdat.indices[j] + indexOffset)
                }
                // get rid of entry that's been merged
                mdat.dispose()
                delete meshDataList[keylist[i]]
            }
        }

        return {
            mergedID: targetID,
            vertices: vertices,
            indices: indices,
            matIDs: matIDs,
        }
    }



    function buildMeshFromSubmesh(submesh, name, mats, verts, inds) {

        // base mesh and vertexData object
        var scene = noa.rendering.getScene()
        var mesh = new BABYLON.Mesh(name, scene)
        var vdat = new BABYLON.VertexData()
        vdat.positions = submesh.positions
        vdat.indices = submesh.indices
        vdat.normals = submesh.normals
        vdat.colors = submesh.colors
        vdat.uvs = submesh.uvs
        vdat.applyToMesh(mesh)
        submesh.dispose()

        if (mats.length === 1) {
            // if only one material ID, assign as a regular mesh and return
            mesh.material = mats[0]

        } else {
            // else we need to make a multimaterial and define (babylon) submeshes
            var multiMat = new BABYLON.MultiMaterial('multimat ' + name, scene)
            mesh.subMeshes = []
            var totalVerts = vdat.positions.length
            var totalInds = vdat.indices.length
            var vertStart = 0
            var indStart = 0
            for (var i = 0; i < mats.length; i++) {
                multiMat.subMaterials[i] = mats[i]
                var sub = new BABYLON.SubMesh(i, vertStart, verts[i], indStart, inds[i], mesh)
                mesh.subMeshes[i] = sub
                vertStart += verts[i]
                indStart += inds[i]
            }
            mesh.material = multiMat
        }

        return mesh
    }




    //                         Material wrangling


    var materialCache = {}

    // manage materials/textures to avoid duplicating them
    function getTerrainMaterial(matID, ignore) {
        if (ignore) return noa.rendering.flatMaterial
        var name = 'terrain mat ' + matID
        if (!materialCache[name]) materialCache[name] = makeTerrainMaterial(matID)
        return materialCache[name]
    }


    // canonical function to make a terrain material
    function makeTerrainMaterial(id) {
        // if user-specified render material is defined, use it
        var matData = noa.registry.getMaterialData(id)
        if (matData.renderMat) return matData.renderMat
        // otherwise determine which built-in material to use
        var url = noa.registry.getMaterialTexture(id)
        var alpha = matData.alpha
        if (!url && alpha == 1) {
            // base material is fine for non-textured case, if no alpha
            return noa.rendering.flatMaterial
        }
        var mat = noa.rendering.flatMaterial.clone('terrain' + id)
        if (url) {
            var scene = noa.rendering.getScene()
            var tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.NEAREST_SAMPLINGMODE)
            if (matData.textureAlpha) tex.hasAlpha = true
            mat.diffuseTexture = tex
        }
        if (matData.alpha < 1) {
            mat.alpha = matData.alpha
        }
        return mat
    }
}








/*
 *    Greedy voxel meshing algorithm
 *        based initially on algo by Mikola Lysenko:
 *          http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *          but evolved quite a bit since then
 *        AO handling by me, stitched together out of cobwebs and dreams
 *    
 *    Arguments:
 *        arr: 3D ndarray of dimensions X,Y,Z
 *             packed with solidity/opacity booleans in higher bits
 *        getMaterial: function( blockID, dir )
 *             returns a material ID based on block id and which cube face it is
 *             (assume for now that each mat ID should get its own mesh)
 *        getColor: function( materialID )
 *             looks up a color (3-array) by material ID
 *             TODO: replace this with a lookup array?
 *        doAO: whether or not to bake ambient occlusion into vertex colors
 *        aoValues: array[3] of color multipliers for AO (least to most occluded)
 *        revAoVal: "reverse ao" - color multiplier for unoccluded exposed edges
 *
 *    Return object: array of mesh objects keyed by material ID
 *        arr[id] = {
 *          id:       material id for mesh
 *          vertices: ints, range 0 .. X/Y/Z
 *          indices:  ints
 *          normals:  ints,   -1 .. 1
 *          colors:   floats,  0 .. 1
 *          uvs:      floats,  0 .. X/Y/Z
 *        }
*/

function GreedyMesher() {

    // data representation constants
    var constants = __webpack_require__(16)

    var ID_MASK = constants.ID_MASK
    var VAR_MASK = constants.VAR_MASK
    var SOLID_BIT = constants.SOLID_BIT
    var OPAQUE_BIT = constants.OPAQUE_BIT
    var OBJECT_BIT = constants.OBJECT_BIT


    var maskCache = new Int16Array(16)
    var aomaskCache = new Uint16Array(16)




    this.mesh = function (arr, getMaterial, getColor, doAO, aoValues, revAoVal) {

        // return object, holder for Submeshes
        var subMeshes = []

        // precalc how to apply AO packing in first masking function
        var skipReverseAO = (doAO && (revAoVal === aoValues[0]))
        var aoPackFcn
        if (doAO) aoPackFcn = (skipReverseAO) ? packAOMaskNoReverse : packAOMask


        //Sweep over each axis, mapping axes to [d,u,v]
        for (var d = 0; d < 3; ++d) {
            var u = (d + 1) % 3
            var v = (d + 2) % 3

            // make transposed ndarray so index i is the axis we're sweeping
            var arrT = arr.transpose(d, u, v).lo(1, 1, 1).hi(arr.shape[d] - 2, arr.shape[u] - 2, arr.shape[v] - 2)

            // shorten len0 by 1 so faces at edges don't get drawn in both chunks
            var len0 = arrT.shape[0] - 1
            var len1 = arrT.shape[1]
            var len2 = arrT.shape[2]

            // create bigger mask arrays as needed
            if (maskCache.length < len1 * len2) {
                maskCache = new Int16Array(len1 * len2)
                aomaskCache = new Uint16Array(len1 * len2)
            }

            // iterate along current major axis..
            for (var i = 0; i <= len0; ++i) {

                // fills mask and aomask arrays with values
                constructMeshMasks(i, d, arrT, getMaterial, aoPackFcn)
                profile_hook('built masks')

                // parses the masks to do greedy meshing
                constructMeshDataFromMasks(i, d, u, v, len1, len2,
                    doAO, subMeshes, getColor, aoValues, revAoVal)

                profile_hook('build submeshes')
            }
        }

        // done, return array of submeshes
        return subMeshes
    }







    //      Greedy meshing inner loop one
    //
    // iterating across ith 2d plane, with n being index into masks

    function constructMeshMasks(i, d, arrT, getMaterial, aoPackFcn) {
        var len = arrT.shape[1]
        var mask = maskCache
        var aomask = aomaskCache
        // set up for quick array traversals
        var n = 0
        var data = arrT.data
        var dbase = arrT.index(i - 1, 0, 0)
        var istride = arrT.stride[0]
        var jstride = arrT.stride[1]
        var kstride = arrT.stride[2]

        for (var k = 0; k < len; ++k) {
            var d0 = dbase
            dbase += kstride
            for (var j = 0; j < len; j++ , n++ , d0 += jstride) {

                // mask[n] will represent the face needed between i-1,j,k and i,j,k
                // for now, assume we never have two faces in both directions

                // IDs at i-1,j,k  and  i,j,k
                var id0 = data[d0]
                var id1 = data[d0 + istride]

                var faceDir = getFaceDir(id0, id1)
                if (faceDir) {
                    // set regular mask value to material ID, sign indicating direction
                    mask[n] = (faceDir > 0) ?
                        getMaterial(id0 & ID_MASK, d * 2) :
                        -getMaterial(id1 & ID_MASK, d * 2 + 1)

                    // if doing AO, precalculate AO level for each face into second mask
                    if (aoPackFcn) {
                        // i values in direction face is/isn't pointing
                        var ipos = (faceDir > 0) ? i : i - 1
                        var ineg = (faceDir > 0) ? i - 1 : i

                        // this got so big I rolled it into a function
                        aomask[n] = aoPackFcn(arrT, ipos, ineg, j, k)
                    }
                }

            }
        }
    }

    function constructMeshMasksB(i, d, arrT, getMaterial, aoPackFcn) {
        var len = arrT.shape[1]
        var mask = maskCache
        var aomask = aomaskCache

        // traversal
        var n = 0
        var data = arrT.data
        var dbase = arrT.index(i - 1, 0, 0)
        var istride = arrT.stride[0]
        var jstride = arrT.stride[1]
        var kstride = arrT.stride[2]

        for (var k = 0; k < len; ++k) {
            var d0 = dbase
            dbase += kstride
            for (var j = 0; j < len; ++j) {

                // mask[n] will represent the face needed between i-1,j,k and i,j,k
                // for now, assume we never have two faces in both directions
                // So mask value is face material id, sign is direction

                // IDs at i-1,j,k  and  i,j,k
                var id0 = data[d0]
                var id1 = data[d0 + istride]

                var faceDir = getFaceDir(id0, id1)
                if (faceDir) {
                    // set regular mask value to material ID, sign indicating direction
                    mask[n] = (faceDir > 0) ?
                        getMaterial(id0 & ID_MASK, d * 2) :
                        -getMaterial(id1 & ID_MASK, d * 2 + 1)

                    // if doing AO, precalculate AO level for each face into second mask
                    if (aoPackFcn) {
                        // i values in direction face is/isn't pointing
                        var ipos = (faceDir > 0) ? i : i - 1
                        var ineg = (faceDir > 0) ? i - 1 : i

                        // this got so big I rolled it into a function
                        aomask[n] = aoPackFcn(arrT, ipos, ineg, j, k)
                    }
                }

                // done, move to next mask index
                d0 += jstride
                n++
            }
        }
    }


    function getFaceDir(id0, id1) {
        // no face if both blocks are opaque, or if ids match
        if (id0 === id1) return 0
        var op0 = id0 & OPAQUE_BIT
        var op1 = id1 & OPAQUE_BIT
        if (op0 && op1) return 0
        // if either block is opaque draw a face for it
        if (op0) return 1
        if (op1) return -1
        // if one block is air or an object block draw face for the other
        if (id1 === 0 || (id1 & OBJECT_BIT)) return 1
        if (id0 === 0 || (id0 & OBJECT_BIT)) return -1
        // only remaining case is two different non-opaque non-air blocks that are adjacent
        // really we should draw both faces here; draw neither for now
        return 0
    }







    //      Greedy meshing inner loop two
    //
    // construct data for mesh using the masks

    function constructMeshDataFromMasks(i, d, u, v, len1, len2,
        doAO, submeshes, getColor, aoValues, revAoVal) {
        var n = 0
        var mask = maskCache
        var aomask = aomaskCache

        // some logic is broken into helper functions for AO and non-AO
        // this fixes deopts in Chrome (for reasons unknown)
        var maskCompareFcn = (doAO) ? maskCompare : maskCompare_noAO
        var meshColorFcn = (doAO) ? pushMeshColors : pushMeshColors_noAO

        for (var k = 0; k < len2; ++k) {
            var w = 1
            var h = 1
            for (var j = 0; j < len1; j += w, n += w) {

                var maskVal = mask[n] | 0
                if (!maskVal) {
                    w = 1
                    continue
                }
                var ao = aomask[n] | 0

                // Compute width and height of area with same mask/aomask values
                for (w = 1; w < len1 - j; ++w) {
                    if (!maskCompareFcn(n + w, mask, maskVal, aomask, ao)) break
                }

                OUTER:
                for (h = 1; h < len2 - k; ++h) {
                    for (var m = 0; m < w; ++m) {
                        var ix = n + m + h * len1
                        if (!maskCompareFcn(ix, mask, maskVal, aomask, ao)) break OUTER
                    }
                }

                // for testing: doing the following will disable greediness
                //w=h=1

                // material and mesh for this face
                var matID = Math.abs(maskVal)
                if (!submeshes[matID]) submeshes[matID] = new Submesh(matID)
                var mesh = submeshes[matID]
                var colors = mesh.colors
                var c = getColor(matID)

                // colors are pushed in helper function - avoids deopts
                // tridir is boolean for which way to split the quad into triangles

                var triDir = meshColorFcn(colors, c, ao, aoValues, revAoVal)


                //Add quad, vertices = x -> x+du -> x+du+dv -> x+dv
                var x = [0, 0, 0]
                x[d] = i
                x[u] = j
                x[v] = k
                var du = [0, 0, 0]; du[u] = w;
                var dv = [0, 0, 0]; dv[v] = h;

                var pos = mesh.positions
                pos.push(
                    x[0], x[1], x[2],
                    x[0] + du[0], x[1] + du[1], x[2] + du[2],
                    x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2],
                    x[0] + dv[0], x[1] + dv[1], x[2] + dv[2])


                // add uv values, with the order and sign depending on 
                // axis and direction so as to avoid mirror-image textures
                var dir = (maskVal > 0) ? 1 : -1

                if (d === 2) {
                    mesh.uvs.push(
                        0, h,
                        -dir * w, h,
                        -dir * w, 0,
                        0, 0)
                } else {
                    mesh.uvs.push(
                        0, w,
                        0, 0,
                        dir * h, 0,
                        dir * h, w)
                }


                // Add indexes, ordered clockwise for the facing direction;

                var vs = pos.length / 3 - 4

                if (maskVal < 0) {
                    if (triDir) {
                        mesh.indices.push(vs, vs + 1, vs + 2, vs, vs + 2, vs + 3)
                    } else {
                        mesh.indices.push(vs + 1, vs + 2, vs + 3, vs, vs + 1, vs + 3)
                    }
                } else {
                    if (triDir) {
                        mesh.indices.push(vs, vs + 2, vs + 1, vs, vs + 3, vs + 2)
                    } else {
                        mesh.indices.push(vs + 3, vs + 1, vs, vs + 3, vs + 2, vs + 1)
                    }
                }


                // norms depend on which direction the mask was solid in..
                var norm0 = d === 0 ? dir : 0
                var norm1 = d === 1 ? dir : 0
                var norm2 = d === 2 ? dir : 0

                // same norm for all vertices
                mesh.normals.push(
                    norm0, norm1, norm2,
                    norm0, norm1, norm2,
                    norm0, norm1, norm2,
                    norm0, norm1, norm2)


                //Zero-out mask
                for (var hx = 0; hx < h; ++hx) {
                    for (var wx = 0; wx < w; ++wx) {
                        mask[n + wx + hx * len1] = 0
                    }
                }

            }
        }
    }



    // Two helper functions with AO and non-AO implementations:

    function maskCompare(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        if (aoVal !== aomask[index]) return false
        return true
    }

    function maskCompare_noAO(index, mask, maskVal, aomask, aoVal) {
        if (maskVal !== mask[index]) return false
        return true
    }

    function pushMeshColors_noAO(colors, c, ao, aoValues, revAoVal) {
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)
        colors.push(c[0], c[1], c[2], 1)
        return true // triangle direction doesn't matter for non-AO
    }

    function pushMeshColors(colors, c, ao, aoValues, revAoVal) {
        var ao00 = unpackAOMask(ao, 0, 0)
        var ao10 = unpackAOMask(ao, 1, 0)
        var ao11 = unpackAOMask(ao, 1, 1)
        var ao01 = unpackAOMask(ao, 0, 1)
        pushAOColor(colors, c, ao00, aoValues, revAoVal)
        pushAOColor(colors, c, ao10, aoValues, revAoVal)
        pushAOColor(colors, c, ao11, aoValues, revAoVal)
        pushAOColor(colors, c, ao01, aoValues, revAoVal)

        // this bit is pretty magical..
        var triDir = true
        if (ao00 === ao11) {
            triDir = (ao01 === ao10) ? (ao01 == 2) : true
        } else {
            triDir = (ao01 === ao10) ? false : (ao00 + ao11 > ao01 + ao10)
        }
        return triDir
    }





    /* 
     *  packAOMask:
     *
     *    For a given face, find occlusion levels for each vertex, then
     *    pack 4 such (2-bit) values into one Uint8 value
     * 
     *  Occlusion levels:
     *    1 is flat ground, 2 is partial occlusion, 3 is max (corners)
     *    0 is "reverse occlusion" - an unoccluded exposed edge 
     *  Packing order var(bit offset):
     *      a01(2)  -   a11(6)   ^  K
     *        -     -            +> J
     *      a00(0)  -   a10(4)
    */

    // when skipping reverse AO, uses this simpler version of the function:

    function packAOMaskNoReverse(data, ipos, ineg, j, k) {
        var a00 = 1
        var a01 = 1
        var a10 = 1
        var a11 = 1
        var solidBit = SOLID_BIT

        // facing into a solid (non-opaque) block?
        var facingSolid = (solidBit & data.get(ipos, j, k))

        // inc occlusion of vertex next to obstructed side
        if (data.get(ipos, j + 1, k) & solidBit) { ++a10; ++a11 }
        if (data.get(ipos, j - 1, k) & solidBit) { ++a00; ++a01 }
        if (data.get(ipos, j, k + 1) & solidBit) { ++a01; ++a11 }
        if (data.get(ipos, j, k - 1) & solidBit) { ++a00; ++a10 }

        // treat corners differently based when facing a solid block
        if (facingSolid) {
            // always 2, or 3 in corners
            a11 = (a11 == 3 || data.get(ipos, j + 1, k + 1) & solidBit) ? 3 : 2
            a01 = (a01 == 3 || data.get(ipos, j - 1, k + 1) & solidBit) ? 3 : 2
            a10 = (a10 == 3 || data.get(ipos, j + 1, k - 1) & solidBit) ? 3 : 2
            a00 = (a00 == 3 || data.get(ipos, j - 1, k - 1) & solidBit) ? 3 : 2
        } else {
            // treat corner as occlusion 3 only if not occluded already
            if (a11 === 1 && (data.get(ipos, j + 1, k + 1) & solidBit)) { a11 = 2 }
            if (a01 === 1 && (data.get(ipos, j - 1, k + 1) & solidBit)) { a01 = 2 }
            if (a10 === 1 && (data.get(ipos, j + 1, k - 1) & solidBit)) { a10 = 2 }
            if (a00 === 1 && (data.get(ipos, j - 1, k - 1) & solidBit)) { a00 = 2 }
        }

        return a11 << 6 | a10 << 4 | a01 << 2 | a00
    }

    // more complicated AO packing when doing reverse AO on corners

    function packAOMask(data, ipos, ineg, j, k) {
        var a00 = 1
        var a01 = 1
        var a10 = 1
        var a11 = 1
        var solidBit = SOLID_BIT

        // facing into a solid (non-opaque) block?
        var facingSolid = (solidBit & data.get(ipos, j, k))

        // inc occlusion of vertex next to obstructed side
        if (data.get(ipos, j + 1, k) & solidBit) { ++a10; ++a11 }
        if (data.get(ipos, j - 1, k) & solidBit) { ++a00; ++a01 }
        if (data.get(ipos, j, k + 1) & solidBit) { ++a01; ++a11 }
        if (data.get(ipos, j, k - 1) & solidBit) { ++a00; ++a10 }

        if (facingSolid) {
            // always 2, or 3 in corners
            a11 = (a11 == 3 || data.get(ipos, j + 1, k + 1) & solidBit) ? 3 : 2
            a01 = (a01 == 3 || data.get(ipos, j - 1, k + 1) & solidBit) ? 3 : 2
            a10 = (a10 == 3 || data.get(ipos, j + 1, k - 1) & solidBit) ? 3 : 2
            a00 = (a00 == 3 || data.get(ipos, j - 1, k - 1) & solidBit) ? 3 : 2
        } else {

            // check each corner, and if not present do reverse AO
            if (a11 === 1) {
                if (data.get(ipos, j + 1, k + 1) & solidBit) { a11 = 2 }
                else if (!(data.get(ineg, j, k + 1) & solidBit) ||
                    !(data.get(ineg, j + 1, k) & solidBit) ||
                    !(data.get(ineg, j + 1, k + 1) & solidBit)) {
                    a11 = 0
                }
            }

            if (a10 === 1) {
                if (data.get(ipos, j + 1, k - 1) & solidBit) { a10 = 2 }
                else if (!(data.get(ineg, j, k - 1) & solidBit) ||
                    !(data.get(ineg, j + 1, k) & solidBit) ||
                    !(data.get(ineg, j + 1, k - 1) & solidBit)) {
                    a10 = 0
                }
            }

            if (a01 === 1) {
                if (data.get(ipos, j - 1, k + 1) & solidBit) { a01 = 2 }
                else if (!(data.get(ineg, j, k + 1) & solidBit) ||
                    !(data.get(ineg, j - 1, k) & solidBit) ||
                    !(data.get(ineg, j - 1, k + 1) & solidBit)) {
                    a01 = 0
                }
            }

            if (a00 === 1) {
                if (data.get(ipos, j - 1, k - 1) & solidBit) { a00 = 2 }
                else if (!(data.get(ineg, j, k - 1) & solidBit) ||
                    !(data.get(ineg, j - 1, k) & solidBit) ||
                    !(data.get(ineg, j - 1, k - 1) & solidBit)) {
                    a00 = 0
                }
            }
        }

        return a11 << 6 | a10 << 4 | a01 << 2 | a00
    }



    // unpack (2 bit) ao value from ao mask
    // see above for details
    function unpackAOMask(aomask, jpos, kpos) {
        var offset = jpos ? (kpos ? 6 : 4) : (kpos ? 2 : 0)
        return aomask >> offset & 3
    }


    // premultiply vertex colors by value depending on AO level
    // then push them into color array
    function pushAOColor(colors, baseCol, ao, aoVals, revAoVal) {
        var mult = (ao === 0) ? revAoVal : aoVals[ao - 1]
        colors.push(baseCol[0] * mult, baseCol[1] * mult, baseCol[2] * mult, 1)
    }

}















var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 50
    var timer = new (__webpack_require__(2).Timer)(every, 'Terrain meshing')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



var removeUnorderedListItem = __webpack_require__(2).removeUnorderedListItem


module.exports = new ObjectMesher()


// enable for profiling..
var PROFILE = 0




// helper class to hold data about a single object mesh
function ObjMeshDat(id, x, y, z) {
    this.id = id | 0
    this.x = x | 0
    this.y = y | 0
    this.z = z | 0
}







/*
 * 
 * 
 *          Object meshing
 *  Per-chunk handling of the creation/disposal of voxels with static meshes
 * 
 * 
*/


function ObjectMesher() {


    // adds properties to the new chunk that will be used when processing
    this.initChunk = function (chunk) {
        chunk._objectBlocks = {}
        chunk._mergedObjectSystems = []
    }

    this.disposeChunk = function (chunk) {
        removeCurrentSystems(chunk)
        chunk._objectBlocks = null
    }

    function removeCurrentSystems(chunk) {
        var systems = chunk._mergedObjectSystems
        while (systems.length) {
            var sps = systems.pop()
            if (sps.mesh && chunk.octreeBlock && chunk.octreeBlock.entries) {
                removeUnorderedListItem(chunk.octreeBlock.entries, sps.mesh)
            }
            if (sps.mesh) sps.mesh.dispose()
            sps.dispose()
        }
    }



    // accessors for the chunk to regester as object voxels are set/unset
    this.addObjectBlock = function (chunk, id, x, y, z) {
        var key = x + '|' + y + '|' + z
        chunk._objectBlocks[key] = new ObjMeshDat(id, x, y, z, null)
    }

    this.removeObjectBlock = function (chunk, x, y, z) {
        var key = x + '|' + y + '|' + z
        if (chunk._objectBlocks[key]) delete chunk._objectBlocks[key]
    }




    /*
     * 
     *    main implementation - re-creates all needed object mesh instances
     * 
    */

    this.buildObjectMesh = function (chunk) {
        profile_hook('start')
        // remove the current (if any) sps/mesh
        removeCurrentSystems(chunk)

        var scene = chunk.noa.rendering.getScene()
        var objectMeshLookup = chunk.noa.registry._blockMeshLookup

        // preprocess everything to build lists of object block keys
        // hashed by material ID and then by block ID
        var matIndexes = {}
        for (var key in chunk._objectBlocks) {
            var blockDat = chunk._objectBlocks[key]
            var blockID = blockDat.id
            var mat = objectMeshLookup[blockID].material
            var matIndex = (mat) ? scene.materials.indexOf(mat) : -1
            if (!matIndexes[matIndex]) matIndexes[matIndex] = {}
            if (!matIndexes[matIndex][blockID]) matIndexes[matIndex][blockID] = []
            matIndexes[matIndex][blockID].push(key)
        }
        profile_hook('preprocess')

        // data structure now looks like:
        // matIndexes = {
        //      2: {                    // i.e. 2nd material in scene
        //          14: {               // i.e. voxel ID 14 from registry
        //              [ '2|3|4' ]     // key of block's local coords
        //          }
        //      }
        // }

        var x0 = chunk.i * chunk.size
        var y0 = chunk.j * chunk.size
        var z0 = chunk.k * chunk.size

        // build one SPS for each material
        for (var ix in matIndexes) {

            var meshHash = matIndexes[ix]
            var sps = buildSPSforMaterialIndex(chunk, scene, meshHash, x0, y0, z0)
            profile_hook('made SPS')

            // build SPS into the scene
            var merged = sps.buildMesh()
            profile_hook('built mesh')

            // finish up
            merged.material = (ix > -1) ? scene.materials[ix] : null
            merged.position.x = x0
            merged.position.y = y0
            merged.position.z = z0
            merged.freezeWorldMatrix()
            merged.freezeNormals()

            chunk.octreeBlock.entries.push(merged)
            chunk._mergedObjectSystems.push(sps)
        }

        profile_hook('end')
    }




    function buildSPSforMaterialIndex(chunk, scene, meshHash, x0, y0, z0) {
        var blockHash = chunk._objectBlocks
        // base sps
        var sps = new BABYLON.SolidParticleSystem('object_sps_' + chunk.id, scene, {
            updatable: false,
        })

        var blockHandlerLookup = chunk.noa.registry._blockHandlerLookup
        var objectMeshLookup = chunk.noa.registry._blockMeshLookup

        // run through mesh hash adding shapes and position functions
        for (var blockID in meshHash) {
            var mesh = objectMeshLookup[blockID]
            var blockArr = meshHash[blockID]
            var count = blockArr.length

            var handlerFn
            var handlers = blockHandlerLookup[blockID]
            if (handlers) handlerFn = handlers.onCustomMeshCreate
            // jshint -W083
            var setShape = function (particle, partIndex, shapeIndex) {
                var key = blockArr[shapeIndex]
                var dat = blockHash[key]
                // set global positions for the custom handler, if any
                particle.position.set(x0 + dat.x + 0.5, y0 + dat.y, z0 + dat.z + 0.5)
                if (handlerFn) handlerFn(particle, x0 + dat.x, y0 + dat.y, z0 + dat.z)
                // revert to local positions
                particle.position.x -= x0
                particle.position.y -= y0
                particle.position.z -= z0
            }
            sps.addShape(mesh, count, { positionFunction: setShape })
            blockArr.length = 0
        }

        return sps
    }




}









var profile_hook = (function () {
    if (!PROFILE) return function () { }
    var every = 50
    var timer = new (__webpack_require__(2).Timer)(every, 'Object meshing')
    return function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()



/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var createInputs = __webpack_require__(70)
var extend = __webpack_require__(1)


module.exports = function (noa, opts, element) {
    return makeInputs(noa, opts, element)
}


var defaultBindings = {
    bindings: {
        "forward": ["W", "<up>"],
        "left": ["A", "<left>"],
        "backward": ["S", "<down>"],
        "right": ["D", "<right>"],
        "fire": "<mouse 1>",
        "mid-fire": ["<mouse 2>", "Q"],
        "alt-fire": ["<mouse 3>", "E"],
        "jump": "<space>",
        "sprint": "<shift>",
        "crouch": "<control>"
    }
}


function makeInputs(noa, opts, element) {
    opts = extend({}, defaultBindings, opts)
    var inputs = createInputs(element, opts)
    var b = opts.bindings
    for (var name in b) {
        var arr = (Array.isArray(b[name])) ? b[name] : [b[name]]
        arr.unshift(name)
        inputs.bind.apply(inputs, arr)
    }
    return inputs
}







/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vkey = __webpack_require__(71)
var EventEmitter = __webpack_require__(4).EventEmitter;
// mousewheel polyfill borrowed directly from game-shell
var addMouseWheel = __webpack_require__(72)

module.exports = function(domElement, options) {
  return new Inputs(domElement, options)
}


/*
 *   Simple inputs manager to abstract key/mouse inputs.
 *        Inspired by (and where applicable stealing code from) 
 *        game-shell: https://github.com/mikolalysenko/game-shell
 *  
 *  inputs.bind( 'move-right', 'D', '<right>' )
 *  inputs.bind( 'move-left',  'A' )
 *  inputs.unbind( 'move-left' )
 *  
 *  inputs.down.on( 'move-right',  function( binding, event ) {})
 *  inputs.up.on(   'move-right',  function( binding, event ) {})
 *
 *  inputs.state['move-right']  // true when corresponding keys are down
 *  inputs.state.dx             // mouse x movement since tick() was last called
 *  inputs.getBindings()        // [ 'move-right', 'move-left', ... ]
*/


function Inputs(element, opts) {

  // settings
  this.element = element || document
  opts = opts || {}
  this.preventDefaults = !!opts.preventDefaults
  this.stopPropagation = !!opts.stopPropagation

  // emitters
  this.down = new EventEmitter()
  this.up = new EventEmitter()

  // state object to be queried
  this.state = {
    dx: 0, dy: 0, 
    scrollx: 0, scrolly: 0, scrollz: 0
  }

  // internal state
  this._keybindmap = {}       // { 'vkeycode' : [ 'binding', 'binding2' ] }
  this._keyStates = {}        // { 'vkeycode' : boolean }
  this._bindPressCounts = {}  // { 'binding' : int }

  // register for dom events
  this.initEvents()
}


/*
 *
 *   PUBLIC API 
 *
*/ 

Inputs.prototype.initEvents = function() {
  // keys
  window.addEventListener( 'keydown', onKeyEvent.bind(undefined,this,true), false )
  window.addEventListener( 'keyup', onKeyEvent.bind(undefined,this,false), false )
  // mouse buttons
  this.element.addEventListener("mousedown", onMouseEvent.bind(undefined,this,true), false)
  this.element.addEventListener("mouseup", onMouseEvent.bind(undefined,this,false), false)
  this.element.oncontextmenu = onContextMenu.bind(undefined,this)
  // treat dragstart like mouseup - idiotically, mouseup doesn't fire after a drag starts (!)
  this.element.addEventListener("dragstart", onMouseEvent.bind(undefined,this,false), false)
  // touch/mouse movement
  this.element.addEventListener("mousemove", onMouseMove.bind(undefined,this), false)
  this.element.addEventListener("touchmove", onMouseMove.bind(undefined,this), false)
  this.element.addEventListener("touchstart", onTouchStart.bind(undefined,this), false)
  // scroll/mousewheel
  addMouseWheel(this.element, onMouseWheel.bind(undefined,this), false)
}


// Usage:  bind( bindingName, vkeyCode, vkeyCode.. )
//    Note that inputs._keybindmap maps vkey codes to binding names
//    e.g. this._keybindmap['a'] = 'move-left'
Inputs.prototype.bind = function(binding) {
  for (var i=1; i<arguments.length; ++i) {
    var vkeyCode = arguments[i]
    var arr = this._keybindmap[vkeyCode] || []
    if (arr.indexOf(binding) == -1) {
      arr.push(binding)
    }
    this._keybindmap[vkeyCode] = arr
  }
  this.state[binding] = !!this.state[binding]
}

// search out and remove all keycodes bound to a given binding
Inputs.prototype.unbind = function(binding) {
  for (var b in this._keybindmap) {
    var arr = this._keybindmap[b]
    var i = arr.indexOf(binding)
    if (i>-1) { arr.splice(i,1) }
  }
}

// tick function - clears out cumulative mouse movement state variables
Inputs.prototype.tick = function() {
  this.state.dx = this.state.dy = 0
  this.state.scrollx = this.state.scrolly = this.state.scrollz = 0
}



Inputs.prototype.getBoundKeys = function() {
  var arr = []
  for (var b in this._keybindmap) { arr.push(b) }
  return arr
}



/*
 *   INTERNALS - DOM EVENT HANDLERS
*/ 


function onKeyEvent(inputs, wasDown, ev) {
  handleKeyEvent( ev.keyCode, vkey[ev.keyCode], wasDown, inputs, ev )
}

function onMouseEvent(inputs, wasDown, ev) {
  // simulate a code out of range of vkey
  var keycode = -1 - ev.button
  var vkeycode = '<mouse '+ (ev.button+1) +'>' 
  handleKeyEvent( keycode, vkeycode, wasDown, inputs, ev )
  return false
}

function onContextMenu(inputs) {
  // cancel context menu if there's a binding for right mousebutton
  var arr = inputs._keybindmap['<mouse 3>']
  if (arr) { return false }
}

function onMouseMove(inputs, ev) {
  // for now, just populate the state object with mouse movement
  var dx = ev.movementX || ev.mozMovementX || 0,
      dy = ev.movementY || ev.mozMovementY || 0
  // ad-hoc experimental touch support
  if (ev.touches && (dx|dy)===0) {
    var xy = getTouchMovement(ev)
    dx = xy[0]
    dy = xy[1]
  }
  inputs.state.dx += dx
  inputs.state.dy += dy
}

// experimental - for touch events, extract useful dx/dy
var lastTouchX = 0
var lastTouchY = 0
var lastTouchID = null

function onTouchStart(inputs, ev) {
  var touch = ev.changedTouches[0]
  lastTouchX = touch.clientX
  lastTouchY = touch.clientY
  lastTouchID = touch.identifier
}

function getTouchMovement(ev) {
  var touch
  var touches = ev.changedTouches
  for (var i=0; i<touches.length; ++i) {
    if (touches[i].identifier == lastTouchID) touch = touches[i]
  }
  if (!touch) return [0,0]
  var res = [ touch.clientX-lastTouchX, touch.clientY-lastTouchY ]
  lastTouchX = touch.clientX
  lastTouchY = touch.clientY
  return res
}

function onMouseWheel(inputs, ev) {
  // basically borrowed from game-shell
  var scale = 1
  switch(ev.deltaMode) {
    case 0: scale=1;   break;  // Pixel
    case 1: scale=12;  break;  // Line
    case 2:  // page
      // TODO: investigagte when this happens, what correct handling is
      scale = inputs.element.clientHeight || window.innerHeight
      break;
  }
  // accumulate state
  inputs.state.scrollx += ev.deltaX * scale
  inputs.state.scrolly += ev.deltaY * scale
  inputs.state.scrollz +=(ev.deltaZ * scale) || 0
  return false
}


/*
 *   KEY BIND HANDLING
*/ 


function handleKeyEvent(keycode, vcode, wasDown, inputs, ev) {
  var arr = inputs._keybindmap[vcode]
  // don't prevent defaults if there's no binding
  if (!arr) { return }
  if (inputs.preventDefaults) ev.preventDefault()
  if (inputs.stopPropagation) ev.stopPropagation()

  // if the key's state has changed, handle an event for all bindings
  var currstate = inputs._keyStates[keycode]
  if ( XOR(currstate, wasDown) ) {
    // for each binding: emit an event, and update cached state information
    for (var i=0; i<arr.length; ++i) {
      handleBindingEvent( arr[i], wasDown, inputs, ev )
    }
  }
  inputs._keyStates[keycode] = wasDown
}


function handleBindingEvent(binding, wasDown, inputs, ev) {
  // keep count of presses mapped by binding
  // (to handle two keys with the same binding pressed at once)
  var ct = inputs._bindPressCounts[binding] || 0
  ct += wasDown ? 1 : -1
  if (ct<0) { ct = 0 } // shouldn't happen
  inputs._bindPressCounts[binding] = ct

  // emit event if binding's state has changed
  var currstate = inputs.state[binding]
  if ( XOR(currstate, ct) ) {
    var emitter = wasDown ? inputs.down : inputs.up
    emitter.emit( binding, ev )
  }
  inputs.state[binding] = !!ct
}


/*
 *    HELPERS
 *
*/


// how is this not part of Javascript?
function XOR(a,b) {
  return a ? !b : b
}






/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ua = typeof window !== 'undefined' ? window.navigator.userAgent : ''
  , isOSX = /OS X/.test(ua)
  , isOpera = /Opera/.test(ua)
  , maybeFirefox = !/like Gecko/.test(ua) && !isOpera

var i, output = module.exports = {
  0:  isOSX ? '<menu>' : '<UNK>'
, 1:  '<mouse 1>'
, 2:  '<mouse 2>'
, 3:  '<break>'
, 4:  '<mouse 3>'
, 5:  '<mouse 4>'
, 6:  '<mouse 5>'
, 8:  '<backspace>'
, 9:  '<tab>'
, 12: '<clear>'
, 13: '<enter>'
, 16: '<shift>'
, 17: '<control>'
, 18: '<alt>'
, 19: '<pause>'
, 20: '<caps-lock>'
, 21: '<ime-hangul>'
, 23: '<ime-junja>'
, 24: '<ime-final>'
, 25: '<ime-kanji>'
, 27: '<escape>'
, 28: '<ime-convert>'
, 29: '<ime-nonconvert>'
, 30: '<ime-accept>'
, 31: '<ime-mode-change>'
, 32: '<space>'
, 33: '<page-up>'
, 34: '<page-down>'
, 35: '<end>'
, 36: '<home>'
, 37: '<left>'
, 38: '<up>'
, 39: '<right>'
, 40: '<down>'
, 41: '<select>'
, 42: '<print>'
, 43: '<execute>'
, 44: '<snapshot>'
, 45: '<insert>'
, 46: '<delete>'
, 47: '<help>'
, 91: '<meta>'  // meta-left -- no one handles left and right properly, so we coerce into one.
, 92: '<meta>'  // meta-right
, 93: isOSX ? '<meta>' : '<menu>'      // chrome,opera,safari all report this for meta-right (osx mbp).
, 95: '<sleep>'
, 106: '<num-*>'
, 107: '<num-+>'
, 108: '<num-enter>'
, 109: '<num-->'
, 110: '<num-.>'
, 111: '<num-/>'
, 144: '<num-lock>'
, 145: '<scroll-lock>'
, 160: '<shift-left>'
, 161: '<shift-right>'
, 162: '<control-left>'
, 163: '<control-right>'
, 164: '<alt-left>'
, 165: '<alt-right>'
, 166: '<browser-back>'
, 167: '<browser-forward>'
, 168: '<browser-refresh>'
, 169: '<browser-stop>'
, 170: '<browser-search>'
, 171: '<browser-favorites>'
, 172: '<browser-home>'

  // ff/osx reports '<volume-mute>' for '-'
, 173: isOSX && maybeFirefox ? '-' : '<volume-mute>'
, 174: '<volume-down>'
, 175: '<volume-up>'
, 176: '<next-track>'
, 177: '<prev-track>'
, 178: '<stop>'
, 179: '<play-pause>'
, 180: '<launch-mail>'
, 181: '<launch-media-select>'
, 182: '<launch-app 1>'
, 183: '<launch-app 2>'
, 186: ';'
, 187: '='
, 188: ','
, 189: '-'
, 190: '.'
, 191: '/'
, 192: '`'
, 219: '['
, 220: '\\'
, 221: ']'
, 222: "'"
, 223: '<meta>'
, 224: '<meta>'       // firefox reports meta here.
, 226: '<alt-gr>'
, 229: '<ime-process>'
, 231: isOpera ? '`' : '<unicode>'
, 246: '<attention>'
, 247: '<crsel>'
, 248: '<exsel>'
, 249: '<erase-eof>'
, 250: '<play>'
, 251: '<zoom>'
, 252: '<no-name>'
, 253: '<pa-1>'
, 254: '<clear>'
}

for(i = 58; i < 65; ++i) {
  output[i] = String.fromCharCode(i)
}

// 0-9
for(i = 48; i < 58; ++i) {
  output[i] = (i - 48)+''
}

// A-Z
for(i = 65; i < 91; ++i) {
  output[i] = String.fromCharCode(i)
}

// num0-9
for(i = 96; i < 106; ++i) {
  output[i] = '<num-'+(i - 96)+'>'
}

// F1-F24
for(i = 112; i < 136; ++i) {
  output[i] = 'F'+(i-111)
}


/***/ }),
/* 72 */
/***/ (function(module, exports) {

//Adapted from here: https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel?redirectlocale=en-US&redirectslug=DOM%2FMozilla_event_reference%2Fwheel

var prefix = "", _addEventListener, onwheel, support;

// detect event model
if ( window.addEventListener ) {
  _addEventListener = "addEventListener";
} else {
  _addEventListener = "attachEvent";
  prefix = "on";
}

// detect available wheel event
support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
          document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
          "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

function _addWheelListener( elem, eventName, callback, useCapture ) {
  elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
    !originalEvent && ( originalEvent = window.event );

    // create a normalized event object
    var event = {
      // keep a ref to the original event object
      originalEvent: originalEvent,
      target: originalEvent.target || originalEvent.srcElement,
      type: "wheel",
      deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
      deltaX: 0,
      delatZ: 0,
      preventDefault: function() {
        originalEvent.preventDefault ?
          originalEvent.preventDefault() :
          originalEvent.returnValue = false;
      }
    };
    
    // calculate deltaY (and deltaX) according to the event
    if ( support == "mousewheel" ) {
      event.deltaY = - 1/40 * originalEvent.wheelDelta;
      // Webkit also support wheelDeltaX
      originalEvent.wheelDeltaX && ( event.deltaX = - 1/40 * originalEvent.wheelDeltaX );
    } else {
      event.deltaY = originalEvent.detail;
    }

    // it's time to fire the callback
    return callback( event );
  }, useCapture || false );
}

module.exports = function( elem, callback, useCapture ) {
  _addWheelListener( elem, support, callback, useCapture );

  // handle MozMousePixelScroll in older Firefox
  if( support == "DOMMouseScroll" ) {
    _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
  }
};

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var createPhysics = __webpack_require__(74)
var vec3 = __webpack_require__(0)
var extend = __webpack_require__(1)

module.exports = function (noa, opts) {
	return makePhysics(noa, opts)
}

/*
*
*    Simple wrapper module for the physics library
*
*/


var defaults = {
	gravity: [0, -10, 0],
	airFriction: 0.999
}


function makePhysics(noa, opts) {
	opts = extend({}, defaults, opts)
	var world = noa.world
	var blockGetter = function (x, y, z) { return world.getBlockSolidity(x, y, z) }
	var isFluidGetter = function (x, y, z) { return world.getBlockFluidity(x, y, z) }
	var physics = createPhysics(opts, blockGetter, isFluidGetter)

	// Wrap `tick` function with one that steps the engine, 
	// then updates all `position` components
	physics._originalTick = physics.tick
	physics.tick = function (dt) {
		this._originalTick(dt)
		updatePositionsFromAABBs(noa)
	}

	return physics
}



function updatePositionsFromAABBs(noa) {
	var ents = noa.ents
	var states = ents.getStatesList(ents.names.physics)
	var vec = _tempvec
	for (var i = 0; i < states.length; ++i) {
		var phys = states[i]
		var pdat = ents.getPositionData(phys.__id)
		vec[0] = pdat.width / 2
		vec[1] = 0
		vec[2] = vec[0]
		var pos = pdat.position
		var base = phys.body.aabb.base
		var max = phys.body.aabb.max
		var ext = pdat._extents
		for (var j = 0; j < 3; j++) {
			pos[j] = base[j] + vec[j]
			ext[j] = base[j]
			ext[j + 3] = max[j]
		}
	}
}

var _tempvec = vec3.create()




/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)
var aabb = __webpack_require__(3)
var vec3 = __webpack_require__(0)
var sweep = __webpack_require__(15)
var RigidBody = __webpack_require__(75)


module.exports = function (opts, testSolid, testFluid) {
  return new Physics(opts, testSolid, testFluid)
}

var defaults = {
  gravity: [0, -10, 0],
  airFriction: 0.995,
  minBounceImpulse: .5, // lowest collision impulse that bounces
  fluidDensity: 1.2,
  fluidDrag: 4.0,
}


/* 
 *    CONSTRUCTOR - represents a world of rigid bodies.
 * 
 *  Takes testSolid(x,y,z) function to query block solidity
 *  Takes testFluid(x,y,z) function to query if a block is a fluid
*/
function Physics(opts, testSolid, testFluid) {
  opts = extend({}, defaults, opts)

  this.gravity = opts.gravity
  this.airFriction = opts.airFriction
  this.fluidDensity = opts.fluidDensity
  this.fluidDrag = opts.fluidDrag
  this.minBounceImpulse = opts.minBounceImpulse
  this.bodies = []

  // collision function - TODO: abstract this into a setter?
  this.testSolid = testSolid
  this.testFluid = testFluid
}


/*
 *    ADDING AND REMOVING RIGID BODIES
*/

Physics.prototype.addBody = function (_aabb, mass,
  friction, restitution, gravMult,
  onCollide) {
  _aabb = _aabb || new aabb([0, 0, 0], [1, 1, 1])
  if (typeof mass == 'undefined') mass = 1
  if (typeof friction == 'undefined') friction = 1
  if (typeof restitution == 'undefined') restitution = 0
  if (typeof gravMult == 'undefined') gravMult = 1
  var b = new RigidBody(_aabb, mass, friction, restitution, gravMult, onCollide)
  this.bodies.push(b)
  return b
}

Physics.prototype.removeBody = function (b) {
  var i = this.bodies.indexOf(b)
  if (i < 0) return undefined
  this.bodies.splice(i, 1)
  b.aabb = b.onCollide = null // in case it helps the GC
}




/*
 *    PHYSICS AND COLLISIONS
*/

var friction = vec3.create()
var a = vec3.create()
var g = vec3.create()
var dv = vec3.create()
var dx = vec3.create()
var impacts = vec3.create()
var oldResting = vec3.create()


Physics.prototype.tick = function (dt) {
  var noGravity = equals(0, vec3.squaredLength(this.gravity))

  var b, i, j, len
  // convert dt to seconds
  dt = dt / 1000
  for (i = 0, len = this.bodies.length; i < len; ++i) {
    b = this.bodies[i]
    vec3.copy(oldResting, b.resting)

    // skip bodies with no velocity/forces/impulses
    var localNoGrav = noGravity || (b.gravityMultiplier === 0)
    if (bodyAsleep(this, b, dt, localNoGrav)) continue
    b._sleepFrameCount--

    // semi-implicit Euler integration

    // a = f/m + gravity*gravityMultiplier
    vec3.scale(a, b._forces, 1 / b.mass)
    vec3.scaleAndAdd(a, a, this.gravity, b.gravityMultiplier)

    // v1 = v0 + i/m + a*dt
    vec3.scale(dv, b._impulses, 1 / b.mass)
    vec3.add(b.velocity, b.velocity, dv)
    vec3.scale(dv, a, dt)
    vec3.add(b.velocity, b.velocity, dv)

    // apply friction if body was on ground last frame
    if (oldResting[1] < 0) {
      // friction force <= - u |vel|
      // max friction impulse = (F/m)*dt = (mg)/m*dt = u*g*dt = dt*b.friction
      var fMax = dt * b.friction
      // friction direction - inversed horizontal velocity
      vec3.scale(friction, b.velocity, -1)
      friction[1] = 0
      var vAmt = vec3.length(friction)
      if (vAmt > fMax) { // slow down
        vec3.scale(friction, friction, fMax / vAmt)
        vec3.add(b.velocity, b.velocity, friction)
      } else { // stop
        b.velocity[0] = b.velocity[2] = 0
      }
    } else {
      // not on ground, apply air resistance
      vec3.scale(b.velocity, b.velocity, this.airFriction)
    }

    // x1-x0 = v1*dt
    vec3.scale(dx, b.velocity, dt)

    // clear forces and impulses for next timestep
    vec3.set(b._forces, 0, 0, 0)
    vec3.set(b._impulses, 0, 0, 0)

    // cache old position for use in autostepping
    if (b.autoStep) {
      cloneAABB(tmpBox, b.aabb)
    }

    // sweeps aabb along dx and accounts for collisions
    processCollisions(this, b.aabb, dx, b.resting)

    // if autostep, and on ground, run collisions again with stepped up aabb
    if (b.autoStep) {
      tryAutoStepping(this, b, tmpBox, dx)
    }

    // Collision impacts. b.resting shows which axes had collisions:
    for (j = 0; j < 3; ++j) {
      impacts[j] = 0
      if (b.resting[j]) {
        // count impact only if wasn't collided last frame
        if (!oldResting[j]) impacts[j] = -b.velocity[j]
        b.velocity[j] = 0
      }
    }
    var mag = vec3.length(impacts)
    if (mag > .001) { // epsilon
      // bounce if over minBounceImpulse
      if (mag > this.minBounceImpulse && b.restitution) {
        vec3.scale(impacts, impacts, b.restitution * b.mass)
        b.applyImpulse(impacts)
      }
      // send collision event regardless
      if (b.onCollide) b.onCollide(impacts)
    }

    // First pass at handling fluids. Assumes fluids are settled
    //   thus, only check at center of body, and only from bottom up
    var box = b.aabb
    var cx = Math.floor((box.base[0] + box.max[0]) / 2)
    var cz = Math.floor((box.base[2] + box.max[2]) / 2)
    var y0 = Math.floor(box.base[1])
    var y1 = Math.floor(box.max[1])
    var submerged = 0
    for (var cy = y0; cy <= y1; ++cy) {
      if (this.testFluid(cx, cy, cz)) {
        ++submerged
      } else {
        break
      }
    }

    if (submerged > 0) {
      // find how much of body is submerged
      var fluidLevel = y0 + submerged
      var heightInFluid = fluidLevel - box.base[1]
      var ratioInFluid = heightInFluid / box.vec[1]
      if (ratioInFluid > 1) ratioInFluid = 1
      var vol = box.vec[0] * box.vec[1] * box.vec[2]
      var displaced = vol * ratioInFluid
      // bouyant force = -gravity * fluidDensity * volumeDisplaced
      vec3.scale(g, this.gravity, -b.gravityMultiplier * this.fluidDensity * displaced)
      // drag force = -dv for some constant d. Here scale it down by ratioInFluid
      vec3.scale(friction, b.velocity, -this.fluidDrag * ratioInFluid)
      vec3.add(g, g, friction)
      b.applyForce(g)
      b.inFluid = true
    } else {
      b.inFluid = false
    }

    // sleep check
    var vsq = vec3.squaredLength(b.velocity)
    if (vsq > 1e-5) b._markActive()
  }
}


// main collision processor - sweep aabb along velocity vector and set resting vector
function processCollisions(self, box, velocity, resting) {
  vec3.set(resting, 0, 0, 0)
  return sweep(self.testSolid, box, velocity, function (dist, axis, dir, vec) {
    resting[axis] = dir
    vec[axis] = 0
  })
}


var tmpBox = new aabb([], [])
var tmpResting = vec3.create()
var targetPos = vec3.create()
var upvec = vec3.create()
var leftover = vec3.create()

function tryAutoStepping(self, b, oldBox, dx) {
  if (b.resting[1] >= 0 && !b.inFluid) return

  // // direction movement was blocked before trying a step
  var xBlocked = (b.resting[0] !== 0)
  var zBlocked = (b.resting[2] !== 0)
  if (!(xBlocked || zBlocked)) return

  // continue autostepping only if headed sufficiently into obstruction
  var ratio = Math.abs(dx[0] / dx[2])
  var cutoff = 4
  if (!xBlocked && ratio > cutoff) return
  if (!zBlocked && ratio < 1 / cutoff) return

  // original target position before being obstructed
  vec3.add(targetPos, oldBox.base, dx)

  // move towards the target until the first X/Z collision
  var getVoxels = self.testSolid
  var d1 = sweep(getVoxels, oldBox, dx, function (dist, axis, dir, vec) {
    if (axis === 1) vec[axis] = 0
    else return true
  })

  var y = b.aabb.base[1]
  var ydist = Math.floor(y + 1.001) - y
  vec3.set(upvec, 0, ydist, 0)
  var collided = false
  // sweep up, bailing on any obstruction
  var d2 = sweep(getVoxels, oldBox, upvec, function (dist, axis, dir, vec) {
    collided = true
    return true
  })
  if (collided) return // could't move upwards

  // now move in X/Z however far was left over before hitting the obstruction
  vec3.subtract(leftover, targetPos, oldBox.base)
  leftover[1] = 0
  var d3 = processCollisions(self, oldBox, leftover, tmpResting)

  // bail if no movement happened in the originally blocked direction
  if (xBlocked && !equals(oldBox.base[0], targetPos[0])) return
  if (zBlocked && !equals(oldBox.base[2], targetPos[2])) return

  // done - oldBox is now at the target autostepped position
  cloneAABB(b.aabb, oldBox)
  b.resting[0] = tmpResting[0]
  b.resting[2] = tmpResting[2]
  if (b.onStep) b.onStep()
}


// check if body is, and can stay, asleep
function bodyAsleep(self, body, dt, noGravity) {
  if (body._sleepFrameCount > 0) return false
  // without gravity bodies stay asleep until a force/impulse wakes them up
  if (noGravity) return true
  // otherwise check body is resting against something
  // i.e. sweep along by dv=g*dt and check there's still a collision
  var isResting = false
  vec3.scale(dv, self.gravity, dt)
  sweep(self.testSolid, body.aabb, dv, function () {
    isResting = true
    return true
  }, true)
  return isResting
}




function equals(a, b) { return Math.abs(a - b) < 1e-5 }

function cloneAABB(tgt, src) {
  for (var i = 0; i < 3; i++) {
    tgt.base[i] = src.base[i]
    tgt.max[i] = src.max[i]
    tgt.vec[i] = src.vec[i]
  }
}


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {


var aabb = __webpack_require__(3)
var vec3 = __webpack_require__(0)


module.exports = RigidBody


/*
 *    RIGID BODY - internal data structure
 *  Only AABB bodies right now. Someday will likely need spheres?
*/

function RigidBody(_aabb, mass, friction, restitution, gravMult, onCollide, autoStep) {
  this.aabb = new aabb(_aabb.base, _aabb.vec) // clone
  this.mass = mass
  // max friction force - i.e. friction coefficient times gravity
  this.friction = friction
  this.restitution = restitution
  this.gravityMultiplier = gravMult
  this.onCollide = onCollide
  this.autoStep = !!autoStep
  this.onStep = null
  // internals
  this.velocity = vec3.create()
  this.resting = [false, false, false]
  this.inFluid = false
  this._forces = vec3.create()
  this._impulses = vec3.create()
  this._sleepFrameCount = 10 | 0
}

RigidBody.prototype.setPosition = function (p) {
  vec3.subtract(p, p, this.aabb.base)
  this.aabb.translate(p)
  this._markActive()
}
RigidBody.prototype.getPosition = function () {
  return vec3.clone(this.aabb.base)
}
RigidBody.prototype.applyForce = function (f) {
  vec3.add(this._forces, this._forces, f)
  this._markActive()
}
RigidBody.prototype.applyImpulse = function (i) {
  vec3.add(this._impulses, this._impulses, i)
  this._markActive()
}
RigidBody.prototype._markActive = function () {
  this._sleepFrameCount = 10 | 0
}



// temp
RigidBody.prototype.atRestX = function () { return this.resting[0] }
RigidBody.prototype.atRestY = function () { return this.resting[1] }
RigidBody.prototype.atRestZ = function () { return this.resting[2] }



/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)

module.exports = function (noa, opts) {
	return new CameraController(noa, opts)
}



/*
*    Controller for the camera
*
*/


var defaults = {
	rotationScale: 0.0025,
	inverseY: false,
}


function CameraController(noa, opts) {
	this.noa = noa

	// options
	opts = extend({}, defaults, opts)
	this.rotationScale = opts.rotationScale
	this.inverseY = opts.inverseY
}





/**
 * On render, move/rotate the camera based on target and mouse inputs
 */

CameraController.prototype.updateForRender = function () {
	// input state
	var state = this.noa.inputs.state

	// TODO: REMOVE EVENTUALLY
	bugFix(state)

	// Rotation: translate dx/dy inputs into y/x axis camera angle changes
	var dx = this.rotationScale * state.dy * ((this.inverseY) ? -1 : 1)
	var dy = this.rotationScale * state.dx

	// normalize/clamp/update
	var camrot = this.noa.rendering.getCameraRotation() // [x,y]
	var rotX = clamp(camrot[0] + dx, rotXcutoff)
	var rotY = (camrot[1] + dy) % (Math.PI * 2)
	this.noa.rendering.setCameraRotation(rotX, rotY)

}

var rotXcutoff = (Math.PI / 2) - .0001 // engines can be weird when xRot == pi/2

function clamp(value, to) {
	return isFinite(to) ? Math.max(Math.min(value, to), -to) : value
}



// workaround for this Chrome 63 + Win10 bug
// https://bugs.chromium.org/p/chromium/issues/detail?id=781182
function bugFix(state) {
	var dx = state.dx
	var dy = state.dy
	var wval = window.innerWidth / 6
	var hval = window.innerHeight / 6
	var badx = (Math.abs(dx) > wval && (dx / lastx) < -1)
	var bady = (Math.abs(dy) > hval && (dy / lasty) < -1)
	if (badx || bady) {
		state.dx = lastx
		state.dy = lasty
		lastx = (dx > 0) ? 1 : -1
		lasty = (dy > 0) ? 1 : -1
	} else {
		if (dx) lastx = dx
		if (dy) lasty = dy
	}
}

var lastx = 0
var lasty = 0




/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)

module.exports = function (noa, opts) {
    return new Registry(noa, opts)
}


/**
 * This is where clients register block types and their materials & properties.
 * @class noa.registry
 */


/*
 *  data structs in the registry:
 *  registry 
 *      blockSolidity:     id -> boolean
 *      blockOpacity:      id -> boolean
 *      blockIsFluid:      id -> boolean
 *      blockMats:         id -> 6x matID  [-x, +x, -y, +y, -z, +z]
 *      blockProps         id -> obj of less-often accessed properties
 *      blockMeshes:       id -> obj/null (custom mesh to instantiate)
 *      blockHandlers      id -> instance of `BlockCallbackHolder` or null 
 *      matIDs             matName -> matID
 *      matData            matID -> { color, alpha, texture, textureAlpha }
*/


var defaults = {
    texturePath: ''
}

var blockDefaults = {
    solid: true,
    opaque: true,
    fluidDensity: 1.0,
    viscosity: 0.5,
}

var MAX_BLOCK_IDS = 255 // currently stored in chunks as int8


function Registry(noa, _options) {
    this.noa = noa
    var opts = extend({}, defaults, _options)


    /* 
     * 
     *      data structures
     * 
    */

    // lookup arrays for block props and flags - all keyed by blockID
    // fill in first value for id=0, empty space
    var blockSolidity = [false]
    var blockOpacity = [false]
    var blockIsFluid = [false]
    var blockMats = [null, null, null, null, null, null]
    var blockProps = [null]
    var blockMeshes = [null]
    var blockHandlers = [null]

    // material data structs
    var matIDs = {}             // mat name -> id
    var matData = [null]        // mat id -> { color, alpha, texture, textureAlpha }

    // option data to save
    var texturePath = opts.texturePath



    /* 
     * 
     *      Block registration methods
     * 
    */



    /**
     * Register (by integer ID) a block type and its parameters.
     * 
     *  @param id: integer, currently 1..255. This needs to be passed in by the 
     *    client because it goes into the chunk data, which someday will get serialized.
     * 
     *  @param options: Recognized fields for the options object:
     * 
     *  * material: can be:
     *      * one (String) material name
     *      * array of 2 names: [top/bottom, sides]
     *      * array of 3 names: [top, bottom, sides]
     *      * array of 6 names: [-x, +x, -y, +y, -z, +z]
     *    If not specified, terrain won't be meshed for the block type
     *  * solid: (true) solidity for physics purposes
     *  * opaque: (true) fully obscures neighboring blocks
     *  * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
     *  * blockMeshes: (null) if specified, noa will create an instance of the mesh instead of rendering voxel terrain
     *  * fluidDensity: (1.0) for fluid blocks
     *  * viscosity: (0.5) for fluid blocks
     *  * onLoad(): block event handler
     *  * onUnload(): block event handler
     *  * onSet(): block event handler
     *  * onUnset(): block event handler
     *  * onCustomMeshCreate(): block event handler
    */


    this.registerBlock = function (id, _options) {
        _options = _options || {}
        blockDefaults.solid = !_options.fluid
        blockDefaults.opaque = !_options.fluid
        var opts = extend({}, blockDefaults, _options)

        // console.log('register block: ', id, opts)
        if (id < 1 || id > MAX_BLOCK_IDS) throw 'Block id exceeds max: ' + id

        // if block ID is greater than current highest ID, 
        // register fake blocks to avoid holes in lookup arrays
        while (id > blockSolidity.length) {
            this.registerBlock(blockSolidity.length, {})
        }

        // flags default to solid, opaque, nonfluid
        blockSolidity[id] = !!opts.solid
        blockOpacity[id] = !!opts.opaque
        blockIsFluid[id] = !!opts.fluid

        // store any custom mesh, and if one is present assume no material
        blockMeshes[id] = opts.blockMesh || null
        if (blockMeshes[id]) opts.material = null

        // parse out material parameter
        // always store 6 material IDs per blockID, so material lookup is monomorphic
        var mat = opts.material || null
        var mats
        if (!mat) {
            mats = [null, null, null, null, null, null]
        } else if (typeof mat == 'string') {
            mats = [mat, mat, mat, mat, mat, mat]
        } else if (mat.length && mat.length == 2) {
            // interpret as [top/bottom, sides]
            mats = [mat[1], mat[1], mat[0], mat[0], mat[1], mat[1]]
        } else if (mat.length && mat.length == 3) {
            // interpret as [top, bottom, sides]
            mats = [mat[2], mat[2], mat[0], mat[1], mat[2], mat[2]]
        } else if (mat.length && mat.length == 6) {
            // interpret as [-x, +x, -y, +y, -z, +z]
            mats = mat
        } else throw 'Invalid material parameter: ' + mat

        // argument is material name, but store as material id, allocating one if needed
        for (var i = 0; i < 6; ++i) {
            blockMats[id * 6 + i] = getMaterialId(this, matIDs, mats[i], true)
        }

        // props data object - currently only used for fluid properties
        blockProps[id] = {}

        // if block is fluid, initialize properties if needed
        if (blockIsFluid[id]) {
            blockProps[id].fluidDensity = opts.fluidDensity
            blockProps[id].viscosity = opts.viscosity
        }

        // event callbacks
        var hasHandler = opts.onLoad || opts.onUnload || opts.onSet || opts.onUnset || opts.onCustomMeshCreate
        blockHandlers[id] = (hasHandler) ? new BlockCallbackHolder(opts) : null

        return id
    }




    /*
     * Register (by name) a material and its parameters.
     * 
     * @param name,color,textureURL,texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
    */

    this.registerMaterial = function (name, color, textureURL, texHasAlpha, renderMaterial) {
        // console.log('register mat: ', name, color, textureURL)
        var id = matIDs[name] || matData.length
        matIDs[name] = id
        var alpha = 1
        if (color && color.length == 4) {
            alpha = color.pop()
        }
        matData[id] = {
            color: color || [1, 1, 1],
            alpha: alpha,
            texture: textureURL ? texturePath + textureURL : '',
            textureAlpha: !!texHasAlpha,
            renderMat: renderMaterial || null,
        }
        return id
    }



    /*
     *      quick accessors for querying block ID stuff
    */

    // block solidity (as in physics)
    this.getBlockSolidity = function (id) {
        return blockSolidity[id]
    }

    // block opacity - whether it obscures the whole voxel (dirt) or 
    // can be partially seen through (like a fencepost, etc)
    this.getBlockOpacity = function (id) {
        return blockOpacity[id]
    }

    // block is fluid or not
    this.getBlockFluidity = function (id) {
        return blockIsFluid[id]
    }

    // Get block property object passed in at registration
    this.getBlockProps = function (id) {
        return blockProps[id]
    }

    // look up a block ID's face material
    // dir is a value 0..5: [ +x, -x, +y, -y, +z, -z ]
    this.getBlockFaceMaterial = function (blockId, dir) {
        return blockMats[blockId * 6 + dir]
    }





    // look up material color given ID
    this.getMaterialColor = function (matID) {
        return matData[matID].color
    }

    // look up material texture given ID
    this.getMaterialTexture = function (matID) {
        return matData[matID].texture
    }

    // look up material's properties: color, alpha, texture, textureAlpha
    this.getMaterialData = function (matID) {
        return matData[matID]
    }





    /*
     * 
     *   Meant for internal use within the engine
     * 
    */


    // internal access to lookup arrays
    this._solidityLookup = blockSolidity
    this._opacityLookup = blockOpacity
    this._blockMeshLookup = blockMeshes
    this._blockHandlerLookup = blockHandlers






    // look up color used for vertices of blocks of given material
    // - i.e. white if it has a texture, color otherwise
    this._getMaterialVertexColor = function (matID) {
        if (matData[matID].texture) return white
        return matData[matID].color
    }
    var white = [1, 1, 1]





    /*
     * 
     *      default initialization
     * 
    */

    // add a default material and set ID=1 to it
    // note that registering new block data overwrites the old
    this.registerMaterial('dirt', [0.4, 0.3, 0], null)
    this.registerBlock(1, { material: 'dirt' })



}



/*
 * 
 *          helpers
 * 
*/



// look up material ID given its name
// if lazy is set, pre-register the name and return an ID
function getMaterialId(reg, matIDs, name, lazyInit) {
    if (!name) return null
    var id = matIDs[name]
    if (id === undefined && lazyInit) id = reg.registerMaterial(name)
    return id
}



// data class for holding block callback references
function BlockCallbackHolder(opts) {
    this.onLoad = opts.onLoad || null
    this.onUnload = opts.onUnload || null
    this.onSet = opts.onSet || null
    this.onUnset = opts.onUnset || null
    this.onCustomMeshCreate = opts.onCustomMeshCreate || null
}










/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(1)
var aabb = __webpack_require__(3)
var vec3 = __webpack_require__(0)
var EntComp = __webpack_require__(79)
// var EntComp = require('../../../../npm-modules/ent-comp')

module.exports = function (noa, opts) {
	return new Entities(noa, opts)
}

var defaults = {
	shadowDistance: 10,
}



/**
 * Wrangles entities. 
 * This class is an instance of [ECS](https://github.com/andyhall/ent-comp), 
 * and as such implements the usual ECS methods.
 * It's also decorated with helpers and accessor functions for getting component existence/state.
 * 
 * Expects entity definitions in a specific format - see source `components` folder for examples.
 * 
 * @class noa.entities
*/

function Entities(noa, opts) {
	// inherit from the ECS library
	EntComp.call(this)

	this.noa = noa
	opts = extend(defaults, opts)

	// properties
	/**
	 * Hash containing the component names of built-in components.
	 * @name names
	 */
	this.names = {}

	// options
	var shadowDist = opts.shadowDistance

	// register components with the ECS
	this.names.position = this.createComponent(__webpack_require__(80)(noa))
	this.names.physics = this.createComponent(__webpack_require__(81)(noa))
	this.names.followsEntity = this.createComponent(__webpack_require__(82)(noa))
	this.names.mesh = this.createComponent(__webpack_require__(83)(noa))
	this.names.shadow = this.createComponent(__webpack_require__(84)(noa, shadowDist))
	this.names.collideTerrain = this.createComponent(__webpack_require__(85)(noa))
	this.names.collideEntities = this.createComponent(__webpack_require__(86)(noa))
	this.names.smoothCamera = this.createComponent(__webpack_require__(97)(noa))
	this.names.movement = this.createComponent(__webpack_require__(98)(noa))
	this.names.receivesInputs = this.createComponent(__webpack_require__(99)(noa))
	this.names.fadeOnZoom = this.createComponent(__webpack_require__(100)(noa))

	// decorate the entities object with accessor functions
	this.isPlayer = function (id) { return id === noa.playerEntity }
	this.hasPhysics = this.getComponentAccessor(this.names.physics)
	this.cameraSmoothed = this.getComponentAccessor(this.names.smoothCamera)
	this.hasMesh = this.getComponentAccessor(this.names.mesh)

	// position functions
	this.hasPosition = this.getComponentAccessor(this.names.position)
	var getPos = this.getStateAccessor(this.names.position)
	this.getPositionData = getPos
	this.getPosition = function (id) { return getPos(id).position }
	this.setPosition = function (id, x, y, z) {
		var pdat = this.getPositionData(id)
		vec3.set(pdat.position, x, y, z)
		pdat._extentsChanged = true
		if (this.hasPhysics(id)) {
			setAABBFromPosition(this.getPhysicsBody(id).aabb, pdat)
		}
	}

	// physics
	var getPhys = this.getStateAccessor(this.names.physics)
	this.getPhysicsBody = function (id) { return getPhys(id).body }

	// misc
	this.getMeshData = this.getStateAccessor(this.names.mesh)
	this.getMovement = this.getStateAccessor(this.names.movement)
	this.getCollideTerrain = this.getStateAccessor(this.names.collideTerrain)
	this.getCollideEntities = this.getStateAccessor(this.names.collideEntities)

	// pairwise collideEntities event - this is for client to override
	this.onPairwiseEntityCollision = function (id1, id2) { }

	// events
	var self = this
	noa.on('tick', function (dt) { self.tick(dt) })
	noa.on('beforeRender', function (dt) { self.render(dt) })

	// this burns entity ID=0, so later code can do (if(entityID)) checks
	this.createEntity()
}

// inherit from EntComp
Entities.prototype = Object.create(EntComp.prototype)
Entities.prototype.constructor = Entities




/*
 *
 *    ENTITY MANAGER API
 *
*/


/** @param id,name,state */
Entities.prototype.addComponentAgain = function (id, name, state) {
	// removes component first if necessary
	if (this.hasComponent(id, name)) this.removeComponent(id, name, true)
	this.addComponent(id, name, state)
}


/** @param x,y,z */
Entities.prototype.isTerrainBlocked = function (x, y, z) {
	// checks if terrain location is blocked by entities
	var box = _blockAABB
	var eps = 0.001
	box.setPosition([x + eps, y + eps, z + eps])
	var hits = this.getEntitiesInAABB(box, this.names.collideTerrain)
	return (hits.length > 0)
}
var _blockAABB = new aabb([0, 0, 0], [0.998, 0.998, 0.998])


/** @param x,y,z */
Entities.prototype.setEntitySize = function (id, xs, ys, zs) {
	// adding this so client doesn't need to understand the internals
	if (!this.hasPosition(id)) throw 'Set size of entity without a position component'
	var pdat = this.getPositionData(id)
	pdat.width = (xs + zs) / 2
	pdat.height = ys
	pdat._extentsChanged = true
	if (this.hasPhysics(id)) {
		var box = this.getPhysicsBody(id).aabb
		setAABBFromPosition(box, pdat)
	}
}


function setAABBFromPosition(box, posData) {
	var w = posData.width
	var pos = posData.position
	var hw = w / 2
	vec3.set(box.base, pos[0] - hw, pos[1], pos[2] - hw)
	vec3.set(box.vec, w, posData.height, w)
	vec3.add(box.max, box.base, box.vec)
}


/** @param box */
Entities.prototype.getEntitiesInAABB = function (box, withComponent) {
	// TODO - use bipartite box-intersect?
	var hits = []
	var self = this
	var posArr = (withComponent) ?
		self.getStatesList(withComponent).map(function (state) {
			return self.getPositionData(state.__id)
		}) :
		posArr = self.getStatesList(this.names.position)
	var tmpBox = _searchBox
	for (var i = 0; i < posArr.length; i++) {
		setAABBFromPosition(tmpBox, posArr[i])
		if (box.intersects(tmpBox)) hits.push(posArr[i].__id)
	}
	return hits
}
var _searchBox = new aabb([], [])



/** 
 * Helper to set up a general entity, and populate with some common components depending on arguments.
 * 
 * Parameters: position, width, height [, mesh, meshOffset, doPhysics, shadow]
 * 
 * @param position
 * @param width
 * @param height..
 */
Entities.prototype.add = function (position, width, height, // required
	mesh, meshOffset, doPhysics, shadow) {

	var self = this

	// new entity
	var eid = this.createEntity()

	// position component - force position vector to be a vec3
	var pos = vec3.create()
	vec3.copy(pos, position)
	this.addComponent(eid, this.names.position, {
		position: pos,
		width: width,
		height: height
	})

	// rigid body in physics simulator
	if (doPhysics) {
		// body = this.noa.physics.addBody(box)
		this.addComponent(eid, this.names.physics)
		var body = this.getPhysicsBody(eid)

		// handler for physics engine to call on auto-step
		var smoothName = this.names.smoothCamera
		body.onStep = function () {
			self.addComponentAgain(eid, smoothName)
		}
	}

	// mesh for the entity
	if (mesh) {
		if (!meshOffset) meshOffset = vec3.create()
		this.addComponent(eid, this.names.mesh, {
			mesh: mesh,
			offset: meshOffset
		})
	}

	// add shadow-drawing component
	if (shadow) {
		this.addComponent(eid, this.names.shadow, { size: width })
	}

	return eid
}










/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = ECS

var extend = __webpack_require__(14)._extend


/**
 * # ent-comp API Documentation:
 */



/**
 * @class ECS
 * 
 * Creates a new entity-component-system manager.
 * 
 * ```js
 * var ECS = require('ent-comp')
 * var ecs = new ECS()
 * ```
*/

function ECS() {
	// public properties:

	/** 
	 * Hash of component definitions. Also aliased to `comps`.
	 * 
	 * ```js
	 * var comp = { name: 'foo' }
	 * ecs.createComponent(comp)
	 * ecs.components['foo'] === comp // true
	 * ecs.comps['foo'] // same
	 * ```
	*/
	this.components = {}
	this.comps = this.components

	// internals:

	this._uid = 0

	// internal data store:
	//    this._data['component-name'] = {
	//        hash: {}, // hash of state objects keyed by entity ID
	//        list: [], // array of state objects in no particular order
	//        map: {},  // map of entity ID to index in list
	//    }
	this._data = {}

	// flat arrays of names of components with systems
	this._systems = []
	this._renderSystems = []

	// list of entity IDs queued for deferred deletion
	this._deferredEntityRemovals = []
	// entity/component pairs for deferred removal
	this._deferredCompRemovals = []
	// entity/component/index tuples for deferred multi-comp removal
	this._deferredMultiCompRemovals = []
}


// Internal function to ping all removal queues. 
// Called before tick/render, and also via timeouts when deferrals are made

function runAllDeferredRemovals(ecs) {
	// implementations are below, next to the relevant removal APIs
	doDeferredEntityRemovals(ecs)
	doDeferredComponentRemovals(ecs)
	doDeferredMultiComponentRemovals(ecs)
}

function makeDeferralTimeout(ecs) {
	if (deferralTimeoutPending) return
	deferralTimeoutPending = true
	setTimeout(function () {
		runAllDeferredRemovals(ecs)
		deferralTimeoutPending = false
	}, 0)
}
var deferralTimeoutPending = false







/**
 * Creates a new entity id (currently just an incrementing integer).
 * 
 * Optionally takes a list of component names to add to the entity (with default state data).
 * 
 * ```js
 * var id1 = ecs.createEntity()
 * var id2 = ecs.createEntity([ 'my-component' ])
 * ```
*/
ECS.prototype.createEntity = function (comps) {
	var id = this._uid++
	if (comps && comps.length) {
		for (var i = 0; i < comps.length; i++) {
			this.addComponent(id, comps[i])
		}
	}
	return id
}


/**
 * Deletes an entity, which in practice just means removing all its components.
 * By default the actual removal is deferred (since entities will tend to call this 
 * on themselves during event handlers, etc).
 * Pass a truthy second parameter to force immediate removal.
 * 
 * ```js
 * ecs.deleteEntity(id)
 * ecs.deleteEntity(id2, true) // deletes immediately
 * ```
*/
ECS.prototype.deleteEntity = function (entID, immediately) {
	if (immediately) {
		deleteEntityNow(this, entID)
	} else {
		this._deferredEntityRemovals.push(entID)
		makeDeferralTimeout(this)
	}
	return this
}


// empty entity removal queue
function doDeferredEntityRemovals(ecs) {
	while (ecs._deferredEntityRemovals.length) {
		var entID = ecs._deferredEntityRemovals.pop()
		deleteEntityNow(ecs, entID)
	}
}


function deleteEntityNow(ecs, entID) {
	// remove all components from the entity, by looping through known components
	// Future: consider speeding this up by keeping a hash of components held by each entity?
	// For now, for max performance user can remove entity's components instead of deleting it
	var keys = Object.keys(ecs._data)
	for (var i = 0; i < keys.length; i++) {
		var name = keys[i]
		var data = ecs._data[name]
		if (data.hash[entID]) ecs.removeComponent(entID, name, true)
	}
}





/**
 * Creates a new component from a definition object. 
 * The definition must have a `name` property; all others are optional.
 * 
 * Returns the component name, to make it easy to grab when the component definition is 
 * being `require`d from a module.
 * 
 * ```js
 * var comp = {
 * 	 name: 'a-unique-string',
 * 	 state: {},
 * 	 onAdd:     function(id, state){ },
 * 	 onRemove:  function(id, state){ },
 * 	 system:       function(dt, states){ },
 * 	 renderSystem: function(dt, states){ },
 * 	 multi: false,
 * }
 * var name = ecs.createComponent( comp )
 * // name == 'a-unique-string'
 * ```
*/
ECS.prototype.createComponent = function (compDefn) {
	if (!compDefn) throw 'Missing component definition'
	var name = compDefn.name
	if (!name) throw 'Component definition must have a name property.'
	if (typeof name !== 'string') throw 'Component name must be a string.'
	if (name === '') throw 'Component name must be a non-empty string.'
	if (this._data[name]) throw 'Component "' + name + '" already exists.'

	// rebuild definition object for cleanliness
	var internalDef = {}
	internalDef.name = name
	internalDef.state = compDefn.state || {}
	internalDef.onAdd = compDefn.onAdd || null
	internalDef.onRemove = compDefn.onRemove || null
	internalDef.system = compDefn.system || null
	internalDef.renderSystem = compDefn.renderSystem || null
	internalDef.multi = !!compDefn.multi

	this.components[name] = internalDef

	if (internalDef.system) this._systems.push(name)
	if (internalDef.renderSystem) this._renderSystems.push(name)

	this._data[name] = {
		list: [],
		hash: {},
		map: {},
	}

	return name
}






/**
 * Deletes the component definition with the given name. 
 * First removes the component from all entities that have it.
 * This probably shouldn't be called in real-world usage
 * (better to define all components when you begin and leave them be)
 * but it's here for the sake of completeness.
 * 
 * ```js
 * ecs.deleteComponent( comp.name )
 * ```
 */
ECS.prototype.deleteComponent = function (compName) {
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'

	var list = data.list
	while (list.length) {
		var entID = list[list.length - 1].__id
		this.removeComponent(entID, compName, true)
	}

	var i = this._systems.indexOf(compName)
	if (i > -1) this._systems.splice(i, 1)
	i = this._renderSystems.indexOf(compName)
	if (i > -1) this._renderSystems.splice(i, 1)

	delete this.components[compName]
	delete this._data[compName]
	return this
}




/**
 * Adds a component to an entity, optionally initializing the state object.
 * 
 * ```js
 * ecs.createComponent({
 * 	name: 'foo',
 * 	state: { val: 0 }
 * })
 * ecs.addComponent(id, 'foo', {val:20})
 * ecs.getState(id, 'foo').val // 20
 * ```
 */
ECS.prototype.addComponent = function (entID, compName, state) {
	var def = this.components[compName]
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'

	// if the component is pending removal, remove it so it can be readded
	var pendingRemoval = false
	this._deferredCompRemovals.forEach(function (obj) {
		if (obj.id === entID && obj.comp === compName) pendingRemoval = true
	})
	if (pendingRemoval) {
		doDeferredComponentRemovals(this)
	}

	if (data.hash[entID] && !def.multi) throw 'Entity already has component: ' + compName + '.'

	// new component state object for this entity
	var newState = {}
	newState.__id = entID
	extend(newState, def.state)
	extend(newState, state)

	// just in case passed-in state object had an __id property
	newState.__id = entID

	if (def.multi) {
		var statesArr = data.hash[entID]
		if (!statesArr) {
			statesArr = []
			data.hash[entID] = statesArr
			data.list.push(statesArr)
			data.map[entID] = data.list.length - 1
		}
		statesArr.push(newState)
	} else {
		data.hash[entID] = newState
		data.list.push(newState)
		data.map[entID] = data.list.length - 1
	}

	if (def.onAdd) def.onAdd(entID, newState)

	return this
}



/**
 * Checks if an entity has a component.
 * 
 * ```js
 * ecs.addComponent(id, 'foo')
 * ecs.hasComponent(id, 'foo') // true
 * ```
 */

ECS.prototype.hasComponent = function (entID, compName) {
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'
	return (data.hash[entID] !== undefined)
}




/**
 * Removes a component from an entity, deleting any state data.
 * 
 * 
 * ```js
 * ecs.removeComponent(id, 'foo', true) // final arg means "immediately"
 * ecs.hasComponent(id, 'foo') // false
 * ecs.removeComponent(id, 'bar')
 * ecs.hasComponent(id, 'bar') // true - by default the removal is asynchronous
 * ```
 */
ECS.prototype.removeComponent = function (entID, compName, immediately) {
	var def = this.components[compName]
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'

	// if comp isn't present, fail silently for multi or throw otherwise
	if (!data.hash[entID]) {
		if (def.multi) return this
		else throw 'Entity does not have component: ' + compName + '.'
	}

	// defer or remove
	if (immediately) {
		removeComponentNow(this, entID, compName)
	} else {
		this._deferredCompRemovals.push({
			id: entID,
			comp: compName,
		})
		makeDeferralTimeout(this)
	}

	return this
}

// empty entity removal queue
function doDeferredComponentRemovals(ecs) {
	while (ecs._deferredCompRemovals.length) {
		var obj = ecs._deferredCompRemovals.pop()
		removeComponentNow(ecs, obj.id, obj.comp)
	}
}

// actual component removal
function removeComponentNow(ecs, entID, compName) {
	var def = ecs.components[compName]
	if (!def) return
	var data = ecs._data[compName]
	if (!data) return
	if (!data.hash[entID]) return // probably removed twice, e.g. due to deferral

	// call onAdd removal handler - on each instance for multi components
	if (def.onRemove) {
		if (def.multi) {
			var statesArr = data.hash[entID]
			statesArr.forEach(function (state) {
				def.onRemove(entID, state)
			})
		} else {
			def.onRemove(entID, data.hash[entID])
		}
	}

	// if multi, kill the states array to hopefully free the objects
	if (def.multi) data.hash[entID].length = 0

	// removal - first quick-splice out of list, then fix hash and map
	var id = data.map[entID]
	var list = data.list
	if (id === list.length - 1) {
		list.pop()
	} else {
		list[id] = list.pop()
		var movedID = list[id].__id
		data.map[movedID] = id
	}
	delete data.hash[entID]
	delete data.map[entID]
}








/**
 * Get the component state for a given entity.
 * It will automatically be populated with an `__id` property denoting the entity id.
 * 
 * ```js
 * ecs.createComponent({
 * 	name: 'foo',
 * 	state: { val: 0 }
 * })
 * ecs.addComponent(id, 'foo')
 * ecs.getState(id, 'foo').val // 0
 * ecs.getState(id, 'foo').__id // equals id
 * ```
 */

ECS.prototype.getState = function (entID, compName) {
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'
	return data.hash[entID]
}



/**
 * Returns a `getState`-like accessor function bound to a given component name. 
 * The accessor is much faster than `getState`, so you should create an accessor 
 * for any component whose state you'll be accessing a lot.
 * 
 * ```js
 * ecs.createComponent({
 * 	name: 'size',
 * 	state: { val: 0 }
 * })
 * ecs.addComponent(id, 'size')
 * var getSize = ecs.getStateAccessor('size')
 * getSize(id).val // 0
 * ```  
 */

ECS.prototype.getStateAccessor = function (compName) {
	if (!this._data[compName]) throw 'Unknown component: ' + compName + '.'
	var hash = this._data[compName].hash
	return function (entID) {
		return hash[entID]
	}
}



/**
 * Returns a `hasComponent`-like accessor function bound to a given component name. 
 * The accessor is much faster than `hasComponent`.
 * 
 * ```js
 * ecs.createComponent({
 * 	name: 'foo',
 * })
 * ecs.addComponent(id, 'foo')
 * var hasFoo = ecs.getComponentAccessor('foo')
 * hasFoo(id) // true
 * ```  
 */

ECS.prototype.getComponentAccessor = function (compName) {
	if (!this._data[compName]) throw 'Unknown component: ' + compName + '.'
	var hash = this._data[compName].hash
	return function (entID) {
		return (hash[entID] !== undefined)
	}
}



/**
 * Get an array of state objects for every entity with the given component. 
 * Each one will have an `__id` property for which entity it refers to.
 * 
 * ```js
 * var arr = ecs.getStatesList('foo')
 * // returns something shaped like:
 * //   [ { __id:0, stateVar:1 },
 * //     { __id:7, stateVar:6 }  ]
 * ```  
 */

ECS.prototype.getStatesList = function (compName) {
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'
	return data.list
}



/**
 * Tells the ECS that a game tick has occurred, causing component `system` functions to get called.
 * 
 * The optional parameter simply gets passed to the system functions. It's meant to be a 
 * timestep, but can be used (or not used) as you like.    
 * 
 * ```js
 * ecs.createComponent({
 * 	name: foo,
 * 	system: function(dt, states) {
 * 		// states is the same array you'd get from #getStatesList()
 * 		console.log(states.length)
 * 	}
 * })
 * ecs.tick(30) // triggers log statement
 * ```
 */

ECS.prototype.tick = function (dt) {
	runAllDeferredRemovals(this)
	var systems = this._systems
	for (var i = 0; i < systems.length; ++i) {
		var name = systems[i]
		var list = this._data[name].list
		var comp = this.components[name]
		comp.system(dt, list)
	}
	runAllDeferredRemovals(this)
	return this
}



/**
 * Functions exactly like `tick`, but calls `renderSystem` functions.
 * This effectively gives you a second set of systems that are 
 * called with separate timing, in case you want to 
 * [tick and render in separate loops](http://gafferongames.com/game-physics/fix-your-timestep/)
 * (and you should!).
 * 
 * ```js
 * ecs.createComponent({
 * 	name: foo,
 * 	renderSystem: function(dt, states) {
 * 		// states is the same array you'd get from #getStatesList()
 * 	}
 * })
 * ecs.render(16.666)
 * ```
 */

ECS.prototype.render = function (dt) {
	runAllDeferredRemovals(this)
	var systems = this._renderSystems
	for (var i = 0; i < systems.length; ++i) {
		var name = systems[i]
		var list = this._data[name].list
		var comp = this.components[name]
		comp.renderSystem(dt, list)
	}
	runAllDeferredRemovals(this)
	return this
}




/**
 * Removes a particular state instance of a multi-component.
 * Pass a final truthy argument to make this happen synchronously - 
 * but be careful, that will splice an element out of the multi-component array,
 * changing the indexes of subsequent elements.
 * 
 * ```js
 * ecs.getState(id, 'foo')   // [ state1, state2, state3 ]
 * ecs.removeMultiComponent(id, 'foo', 1, true)  // true means: immediately
 * ecs.getState(id, 'foo')   // [ state1, state3 ]
 * ```
 */
ECS.prototype.removeMultiComponent = function (entID, compName, index, immediately) {
	var def = this.components[compName]
	var data = this._data[compName]
	if (!data) throw 'Unknown component: ' + compName + '.'
	if (!def.multi) throw 'removeMultiComponent called on non-multi component'

	// throw if comp isn't present, or multicomp isn't present at index
	var statesArr = data.hash[entID]
	if (!statesArr || !statesArr[index]) {
		throw 'Multicomponent ' + compName + ' instance not found at index ' + index
	}

	// do removal by object, in case index changes (due to other queued removals)
	var stateToRemove = statesArr[index]

	// actual removal - deferred by default
	if (immediately) {
		removeMultiCompNow(this, entID, compName, stateToRemove)
	} else {
		this._deferredMultiCompRemovals.push({
			id: entID,
			comp: compName,
			state: stateToRemove,
		})
	}

	return this
}



function doDeferredMultiComponentRemovals(ecs) {
	while (ecs._deferredMultiCompRemovals.length) {
		var obj = ecs._deferredMultiCompRemovals.pop()
		removeMultiCompNow(ecs, obj.id, obj.comp, obj.state)
		obj.state = null
	}
}

function removeMultiCompNow(ecs, entID, compName, stateObj) {
	var def = ecs.components[compName]
	if (!def) return
	var data = ecs._data[compName]
	if (!data) return
	var statesArr = data.hash[entID]
	if (!statesArr) return
	var i = statesArr.indexOf(stateObj)
	if (i < 0) return
	if (def.onRemove) {
		if (def.onRemove) def.onRemove(entID, stateObj)
	}
	statesArr.splice(i, 1)
	// if the state list is now empty, remove the whole component
	if (statesArr.length === 0) {
		ecs.removeComponent(entID, compName, true)
	}
}








/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)


/**
 * 
 * 	Component holding entity's position, width, and height.
 *  By convention, "position" is the bottom center of the entity's AABB
 * 
 */


module.exports = function (noa) {

	var hasWarned = false

	return {

		name: 'position',

		state: {
			position: null,
			renderPosition: null,
			width: +0,
			height: +0,
			_extents: null,
			_extentsChanged: true,
		},


		onAdd: function (eid, state) {
			if (state.position) {
				if (!(state.position instanceof Float32Array) && !hasWarned) {
					console.warn('Better to set entity positions as instances of "gl-vec3"!')
					hasWarned = true
				}
			} else state.position = vec3.create()

			state.renderPosition = vec3.create()
			vec3.copy(state.renderPosition, state.position)

			state._extents = new Float32Array(6)
		},

		onRemove: null,



		system: function (dt, states) {
			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				if (!state._extentsChanged) continue
				updateExtents(state._extents, state.position, state.height, state.width)
				state._extentsChanged = false
			}
		},


	}
}


function updateExtents(ext, pos, height, width) {
	var hw = width / 2
	ext[0] = pos[0] - hw
	ext[1] = pos[1]
	ext[2] = pos[2] - hw
	ext[3] = pos[0] + hw
	ext[4] = pos[1] + height
	ext[5] = pos[2] + hw
}




/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)
var AABB = __webpack_require__(3)


module.exports = function (noa) {

	var tempVec = vec3.create()

	return {

		name: 'physics',


		state: {
			body: null,
		},


		onAdd: function (entID, state) {
			state.body = noa.physics.addBody()
			// implicitly assume body has a position component, to get size
			var dat = noa.ents.getPositionData(state.__id)
			noa.ents.setEntitySize(state.__id, dat.width, dat.height, dat.width)
		},


		onRemove: function (entID, state) {
			noa.physics.removeBody(state.body)
		},


		system: null,


		renderSystem: function (dt, states) {
			// dt is time (ms) since physics engine tick
			// to avoid temporal aliasing, render the state as if lerping between
			// the last position and the next one 
			// since the entity data is the "next" position this amounts to 
			// offsetting each entity into the past by tickRate - dt
			// http://gafferongames.com/game-physics/fix-your-timestep/

			var backtrack = - (noa._tickRate - dt) / 1000
			var pos = tempVec

			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var id = state.__id
				var pdat = noa.ents.getPositionData(id)

				// pos = pos + backtrack * body.velocity
				vec3.scaleAndAdd(pos, pdat.position, state.body.velocity, backtrack)

				// smooth out position update if component is present
				// (normally set after sudden movements like auto-stepping)
				if (noa.ents.cameraSmoothed(id)) {
					vec3.lerp(pos, pdat.renderPosition, pos, 0.3)
				}

				// copy values over to renderPosition, 
				vec3.copy(pdat.renderPosition, pos)


			}
		}



	}
}



/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)


/*
 * Indicates that an entity should be moved to another entity's position each tick,
 * possibly by a fixed offset, and the same for renderPositions each render
*/

module.exports = function (noa) {

	return {

		name: 'followsEntity',

		state: {
			entity: 0 | 0,
			offset: null,
		},

		onAdd: function (eid, state) {
			var off = vec3.create()
			state.offset = (state.offset) ? vec3.copy(off, state.offset) : off
			updatePosition(state)
			updateRenderPosition(state)
		},

		onRemove: null,


		// on tick, copy over regular positions
		system: function followEntity(dt, states) {
			for (var i = 0; i < states.length; i++) {
				updatePosition(states[i])
			}
		},


		// on render, copy over render positions
		renderSystem: function followEntityMesh(dt, states) {
			for (var i = 0; i < states.length; i++) {
				updateRenderPosition(states[i])
			}
		}
	}



	function updatePosition(state) {
		var id = state.__id
		var self = noa.ents.getPositionData(id)
		var other = noa.ents.getPositionData(state.entity)
		if (other) {
			vec3.add(self.position, other.position, state.offset)
		} else {
			noa.ents.removeComponent(id, noa.ents.names.followsEntity)
		}
	}

	function updateRenderPosition(state) {
		var id = state.__id
		var self = noa.ents.getPositionData(id)
		var other = noa.ents.getPositionData(state.entity)
		if (other) {
			vec3.add(self.renderPosition, other.renderPosition, state.offset)
		} else {
			noa.ents.removeComponent(id, noa.ents.names.followsEntity)
		}
	}

}




/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)

module.exports = function (noa) {
	return {

		name: 'mesh',

		state: {
			mesh: null,
			offset: null
		},


		onAdd: function (eid, state) {
			if (state.mesh) {
				noa.rendering.addMeshToScene(state.mesh)
			} else {
				throw new Error('Mesh component added without a mesh - probably a bug!')
			}
			if (!state.offset) {
				state.offset = new vec3.create()
			}

			// initialize mesh to correct position
			var pos = noa.ents.getPosition(eid)
			var mpos = state.mesh.position
			mpos.x = pos[0] + state.offset[0]
			mpos.y = pos[1] + state.offset[1]
			mpos.z = pos[2] + state.offset[2]
		},


		onRemove: function (eid, state) {
			state.mesh.dispose()
		},


		system: null,



		renderSystem: function (dt, states) {
			// before render move each mesh to its render position, 
			// set by the physics engine or driving logic

			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var id = state.__id

				var rpos = noa.ents.getPositionData(id).renderPosition
				var x = rpos[0] + state.offset[0]
				var y = rpos[1] + state.offset[1]
				var z = rpos[2] + state.offset[2]

				state.mesh.position.copyFromFloats(x, y, z)
			}
		}


	}
}




/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)
var shadowDist

module.exports = function (noa, dist) {

	shadowDist = dist

	// create a mesh to re-use for shadows
	var scene = noa.rendering.getScene()
	var disc = BABYLON.Mesh.CreateDisc('shadow', 0.75, 30, scene)
	disc.rotation.x = Math.PI / 2
	disc.material = noa.rendering.makeStandardMaterial('shadowMat')
	disc.material.diffuseColor = BABYLON.Color3.Black()
	disc.material.ambientColor = BABYLON.Color3.Black()
	disc.material.alpha = 0.5
	disc.setEnabled(false)

	// source mesh needn't be in the scene graph
	scene.removeMesh(disc)


	return {

		name: 'shadow',

		state: {
			size: 0.5,
			_mesh: null,
		},


		onAdd: function (eid, state) {
			state._mesh = noa.rendering.makeMeshInstance(disc, false)
		},


		onRemove: function (eid, state) {
			state._mesh.dispose()
		},


		system: function shadowSystem(dt, states) {
			var cpos = noa.rendering.getCameraPosition()
			vec3.set(camPos, cpos.x, cpos.y, cpos.z)
			var dist = shadowDist
			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				updateShadowHeight(state.__id, state._mesh, state.size, dist, noa)
			}
		},


		renderSystem: function (dt, states) {
			// before render adjust shadow x/z to render positions
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				var rpos = noa.ents.getPositionData(state.__id).renderPosition
				var spos = state._mesh.position
				spos.x = rpos[0]
				spos.z = rpos[2]
			}
		}




	}
}

var down = vec3.fromValues(0, -1, 0)
var camPos = vec3.fromValues(0, 0, 0)
var shadowPos = vec3.fromValues(0, 0, 0)

function updateShadowHeight(id, mesh, size, shadowDist, noa) {
	var ents = noa.entities
	var dat = ents.getPositionData(id)
	var loc = dat.position
	var b = ents.getPhysicsBody(id)
	var y
	// set to entity position if entity standing on ground
	if (b.resting[1] < 0) {
		y = dat.renderPosition[1]
	} else {
		var pick = noa.pick(loc, down, shadowDist)
		if (pick) y = pick.position[1]
	}
	if (y !== undefined) {
		y = Math.round(y) // pick results get slightly countersunk
		// set shadow slightly above ground to avoid z-fighting
		vec3.set(shadowPos, mesh.position.x, y, mesh.position.z)
		var sqdist = vec3.squaredDistance(camPos, shadowPos)
		// offset ~ 0.01 for nearby shadows, up to 0.1 at distance of ~40
		var offset = 0.01 + 0.1 * (sqdist / 1600)
		if (offset > 0.1) offset = 0.1
		mesh.position.y = y + offset
		// set shadow scale
		var dist = loc[1] - y
		var scale = size * 0.7 * (1 - dist / shadowDist)
		mesh.scaling.copyFromFloats(scale, scale, scale)
		mesh.setEnabled(true)
	} else {
		mesh.setEnabled(false)
	}
}




/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = function (noa) {
	return {

		name: 'collideTerrain',

		state: {
			callback: null
		},

		onAdd: function (eid, state) {
			// add collide handler for physics engine to call
			var ents = noa.entities
			if (ents.hasPhysics(eid)) {
				var body = ents.getPhysicsBody(eid)
				body.onCollide = function bodyOnCollide(impulse) {
					var cb = noa.ents.getCollideTerrain(eid).callback
					if (cb) cb(impulse, eid)
				}
			}
		},

		onRemove: function (eid, state) {
			var ents = noa.entities
			if (ents.hasPhysics(eid)) {
				ents.getPhysicsBody(eid).onCollide = null
			}
		},


		system: null


	}
}



/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var boxIntersect = __webpack_require__(87)
var vec3 = __webpack_require__(0)


/*
 * 	Every frame, entities with this component will get mutually checked for colliions
 * 
 *   * cylinder: flag for checking collisions as a vertical cylindar (rather than AABB)
 *   * collideBits: category for this entity
 *   * collideMask: categories this entity collides with
 *   * callback: function(other_id) - called when `own.collideBits & other.collideMask` is true
 * 
 * 
 * 		Notes:
 * 	Set collideBits=0 for entities like bullets, which can collide with things 
 * 		but are never the target of a collision.
 * 	Set collideMask=0 for things with no callback - things that get collided with,
 * 		but don't themselves instigate collisions.
 * 
*/



module.exports = function (noa) {

	return {

		name: 'collideEntities',

		state: {
			cylinder: false,
			collideBits: 1 | 0,
			collideMask: 1 | 0,
			callback: null,
		},

		onAdd: null,

		onRemove: null,


		system: function entityCollider(dt, states) {
			var ents = noa.ents

			// data struct that boxIntersect looks for
			// - array of [lo, lo, lo, hi, hi, hi] extents
			var intervals = []
			for (var i = 0; i < states.length; i++) {
				var id = states[i].__id
				var dat = ents.getPositionData(id)
				intervals[i] = dat._extents
			}

			// run the intersect library
			boxIntersect(intervals, function (a, b) {
				var stateA = states[a]
				var stateB = states[b]
				var intervalA = intervals[a]
				var intervalB = intervals[b]
				if (cylindricalHitTest(stateA, stateB, intervalA, intervalB)) {
					handleCollision(noa, stateA, stateB)
				}
			})

		}
	}



	/*
	 * 
	 * 		IMPLEMENTATION
	 * 
	*/


	function handleCollision(noa, stateA, stateB) {
		var idA = stateA.__id
		var idB = stateB.__id

		// entities really do overlap, so check masks and call event handlers
		if (stateA.collideMask & stateB.collideBits) {
			if (stateA.callback) stateA.callback(idB)
		}
		if (stateB.collideMask & stateA.collideBits) {
			if (stateB.callback) stateB.callback(idA)
		}

		// general pairwise handler
		noa.ents.onPairwiseEntityCollision(idA, idB)
	}



	// For entities whose extents overlap, 
	// test if collision still happens when taking cylinder flags into account

	function cylindricalHitTest(stateA, stateB, intervalA, intervalB) {
		if (stateA.cylinder) {
			if (stateB.cylinder) {
				return cylinderCylinderTest(intervalA, intervalB)
			} else {
				return cylinderBoxTest(intervalA, intervalB)
			}
		} else if (stateB.cylinder) {
			return cylinderBoxTest(intervalB, intervalA)
		}
		return true
	}




	// Cylinder-cylinder hit test (AABBs are known to overlap)
	// given their extent arrays [lo, lo, lo, hi, hi, hi]

	function cylinderCylinderTest(a, b) {
		// distance between cylinder centers
		var rada = (a[3] - a[0]) / 2
		var radb = (b[3] - b[0]) / 2
		var dx = a[0] + rada - (b[0] + radb)
		var dz = a[2] + rada - (b[2] + radb)
		// collide if dist <= sum of radii
		var distsq = dx * dx + dz * dz
		var radsum = rada + radb
		return (distsq <= radsum * radsum)
	}




	// Cylinder-Box hit test (AABBs are known to overlap)
	// given their extent arrays [lo, lo, lo, hi, hi, hi]

	function cylinderBoxTest(cyl, cube) {
		// X-z center of cylinder
		var rad = (cyl[3] - cyl[0]) / 2
		var cx = cyl[0] + rad
		var cz = cyl[2] + rad
		// point in X-Z square closest to cylinder
		var px = clamp(cx, cube[0], cube[3])
		var pz = clamp(cz, cube[2], cube[5])
		// collision if distance from that point to circle <= cylinder radius
		var dx = px - cx
		var dz = pz - cz
		var distsq = dx * dx + dz * dz
		return (distsq <= rad * rad)
	}

	function clamp(val, lo, hi) {
		return (val < lo) ? lo : (val > hi) ? hi : val
	}




}


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = boxIntersectWrapper

var pool = __webpack_require__(7)
var sweep = __webpack_require__(17)
var boxIntersectIter = __webpack_require__(94)

function boxEmpty(d, box) {
  for(var j=0; j<d; ++j) {
    if(!(box[j] <= box[j+d])) {
      return true
    }
  }
  return false
}

//Unpack boxes into a flat typed array, remove empty boxes
function convertBoxes(boxes, d, data, ids) {
  var ptr = 0
  var count = 0
  for(var i=0, n=boxes.length; i<n; ++i) {
    var b = boxes[i]
    if(boxEmpty(d, b)) {
      continue
    }
    for(var j=0; j<2*d; ++j) {
      data[ptr++] = b[j]
    }
    ids[count++] = i
  }
  return count
}

//Perform type conversions, check bounds
function boxIntersect(red, blue, visit, full) {
  var n = red.length
  var m = blue.length

  //If either array is empty, then we can skip this whole thing
  if(n <= 0 || m <= 0) {
    return
  }

  //Compute dimension, if it is 0 then we skip
  var d = (red[0].length)>>>1
  if(d <= 0) {
    return
  }

  var retval

  //Convert red boxes
  var redList  = pool.mallocDouble(2*d*n)
  var redIds   = pool.mallocInt32(n)
  n = convertBoxes(red, d, redList, redIds)

  if(n > 0) {
    if(d === 1 && full) {
      //Special case: 1d complete
      sweep.init(n)
      retval = sweep.sweepComplete(
        d, visit, 
        0, n, redList, redIds,
        0, n, redList, redIds)
    } else {

      //Convert blue boxes
      var blueList = pool.mallocDouble(2*d*m)
      var blueIds  = pool.mallocInt32(m)
      m = convertBoxes(blue, d, blueList, blueIds)

      if(m > 0) {
        sweep.init(n+m)

        if(d === 1) {
          //Special case: 1d bipartite
          retval = sweep.sweepBipartite(
            d, visit, 
            0, n, redList,  redIds,
            0, m, blueList, blueIds)
        } else {
          //General case:  d>1
          retval = boxIntersectIter(
            d, visit,    full,
            n, redList,  redIds,
            m, blueList, blueIds)
        }

        pool.free(blueList)
        pool.free(blueIds)
      }
    }

    pool.free(redList)
    pool.free(redIds)
  }

  return retval
}


var RESULT

function appendItem(i,j) {
  RESULT.push([i,j])
}

function intersectFullArray(x) {
  RESULT = []
  boxIntersect(x, x, appendItem, true)
  return RESULT
}

function intersectBipartiteArray(x, y) {
  RESULT = []
  boxIntersect(x, y, appendItem, false)
  return RESULT
}

//User-friendly wrapper, handle full input and no-visitor cases
function boxIntersectWrapper(arg0, arg1, arg2) {
  var result
  switch(arguments.length) {
    case 1:
      return intersectFullArray(arg0)
    case 2:
      if(typeof arg1 === 'function') {
        return boxIntersect(arg0, arg0, arg1, true)
      } else {
        return intersectBipartiteArray(arg0, arg1)
      }
    case 3:
      return boxIntersect(arg0, arg1, arg2, false)
    default:
      throw new Error('box-intersect: Invalid arguments')
  }
}

/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(89)
var ieee754 = __webpack_require__(90)
var isArray = __webpack_require__(91)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}


/***/ }),
/* 90 */
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),
/* 91 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function dupe_array(count, value, i) {
  var c = count[i]|0
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1)
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i
  result = new Array(count)
  for(i=0; i<count; ++i) {
    result[i] = value
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

module.exports = dupe

/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


//This code is extracted from ndarray-sort
//It is inlined here as a temporary workaround

module.exports = wrapper;

var INSERT_SORT_CUTOFF = 32

function wrapper(data, n0) {
  if (n0 <= 4*INSERT_SORT_CUTOFF) {
    insertionSort(0, n0 - 1, data);
  } else {
    quickSort(0, n0 - 1, data);
  }
}

function insertionSort(left, right, data) {
  var ptr = 2*(left+1)
  for(var i=left+1; i<=right; ++i) {
    var a = data[ptr++]
    var b = data[ptr++]
    var j = i
    var jptr = ptr-2
    while(j-- > left) {
      var x = data[jptr-2]
      var y = data[jptr-1]
      if(x < a) {
        break
      } else if(x === a && y < b) {
        break
      }
      data[jptr]   = x
      data[jptr+1] = y
      jptr -= 2
    }
    data[jptr]   = a
    data[jptr+1] = b
  }
}

function swap(i, j, data) {
  i *= 2
  j *= 2
  var x = data[i]
  var y = data[i+1]
  data[i] = data[j]
  data[i+1] = data[j+1]
  data[j] = x
  data[j+1] = y
}

function move(i, j, data) {
  i *= 2
  j *= 2
  data[i] = data[j]
  data[i+1] = data[j+1]
}

function rotate(i, j, k, data) {
  i *= 2
  j *= 2
  k *= 2
  var x = data[i]
  var y = data[i+1]
  data[i] = data[j]
  data[i+1] = data[j+1]
  data[j] = data[k]
  data[j+1] = data[k+1]
  data[k] = x
  data[k+1] = y
}

function shufflePivot(i, j, px, py, data) {
  i *= 2
  j *= 2
  data[i] = data[j]
  data[j] = px
  data[i+1] = data[j+1]
  data[j+1] = py
}

function compare(i, j, data) {
  i *= 2
  j *= 2
  var x = data[i],
      y = data[j]
  if(x < y) {
    return false
  } else if(x === y) {
    return data[i+1] > data[j+1]
  }
  return true
}

function comparePivot(i, y, b, data) {
  i *= 2
  var x = data[i]
  if(x < y) {
    return true
  } else if(x === y) {
    return data[i+1] < b
  }
  return false
}

function quickSort(left, right, data) {
  var sixth = (right - left + 1) / 6 | 0, 
      index1 = left + sixth, 
      index5 = right - sixth, 
      index3 = left + right >> 1, 
      index2 = index3 - sixth, 
      index4 = index3 + sixth, 
      el1 = index1, 
      el2 = index2, 
      el3 = index3, 
      el4 = index4, 
      el5 = index5, 
      less = left + 1, 
      great = right - 1, 
      tmp = 0
  if(compare(el1, el2, data)) {
    tmp = el1
    el1 = el2
    el2 = tmp
  }
  if(compare(el4, el5, data)) {
    tmp = el4
    el4 = el5
    el5 = tmp
  }
  if(compare(el1, el3, data)) {
    tmp = el1
    el1 = el3
    el3 = tmp
  }
  if(compare(el2, el3, data)) {
    tmp = el2
    el2 = el3
    el3 = tmp
  }
  if(compare(el1, el4, data)) {
    tmp = el1
    el1 = el4
    el4 = tmp
  }
  if(compare(el3, el4, data)) {
    tmp = el3
    el3 = el4
    el4 = tmp
  }
  if(compare(el2, el5, data)) {
    tmp = el2
    el2 = el5
    el5 = tmp
  }
  if(compare(el2, el3, data)) {
    tmp = el2
    el2 = el3
    el3 = tmp
  }
  if(compare(el4, el5, data)) {
    tmp = el4
    el4 = el5
    el5 = tmp
  }

  var pivot1X = data[2*el2]
  var pivot1Y = data[2*el2+1]
  var pivot2X = data[2*el4]
  var pivot2Y = data[2*el4+1]

  var ptr0 = 2 * el1;
  var ptr2 = 2 * el3;
  var ptr4 = 2 * el5;
  var ptr5 = 2 * index1;
  var ptr6 = 2 * index3;
  var ptr7 = 2 * index5;
  for (var i1 = 0; i1 < 2; ++i1) {
    var x = data[ptr0+i1];
    var y = data[ptr2+i1];
    var z = data[ptr4+i1];
    data[ptr5+i1] = x;
    data[ptr6+i1] = y;
    data[ptr7+i1] = z;
  }

  move(index2, left, data)
  move(index4, right, data)
  for (var k = less; k <= great; ++k) {
    if (comparePivot(k, pivot1X, pivot1Y, data)) {
      if (k !== less) {
        swap(k, less, data)
      }
      ++less;
    } else {
      if (!comparePivot(k, pivot2X, pivot2Y, data)) {
        while (true) {
          if (!comparePivot(great, pivot2X, pivot2Y, data)) {
            if (--great < k) {
              break;
            }
            continue;
          } else {
            if (comparePivot(great, pivot1X, pivot1Y, data)) {
              rotate(k, less, great, data)
              ++less;
              --great;
            } else {
              swap(k, great, data)
              --great;
            }
            break;
          }
        }
      }
    }
  }
  shufflePivot(left, less-1, pivot1X, pivot1Y, data)
  shufflePivot(right, great+1, pivot2X, pivot2Y, data)
  if (less - 2 - left <= INSERT_SORT_CUTOFF) {
    insertionSort(left, less - 2, data);
  } else {
    quickSort(left, less - 2, data);
  }
  if (right - (great + 2) <= INSERT_SORT_CUTOFF) {
    insertionSort(great + 2, right, data);
  } else {
    quickSort(great + 2, right, data);
  }
  if (great - less <= INSERT_SORT_CUTOFF) {
    insertionSort(less, great, data);
  } else {
    quickSort(less, great, data);
  }
}

/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = boxIntersectIter

var pool = __webpack_require__(7)
var bits = __webpack_require__(8)
var bruteForce = __webpack_require__(95)
var bruteForcePartial = bruteForce.partial
var bruteForceFull = bruteForce.full
var sweep = __webpack_require__(17)
var findMedian = __webpack_require__(96)
var genPartition = __webpack_require__(18)

//Twiddle parameters
var BRUTE_FORCE_CUTOFF    = 128       //Cut off for brute force search
var SCAN_CUTOFF           = (1<<22)   //Cut off for two way scan
var SCAN_COMPLETE_CUTOFF  = (1<<22)  

//Partition functions
var partitionInteriorContainsInterval = genPartition(
  '!(lo>=p0)&&!(p1>=hi)', 
  ['p0', 'p1'])

var partitionStartEqual = genPartition(
  'lo===p0',
  ['p0'])

var partitionStartLessThan = genPartition(
  'lo<p0',
  ['p0'])

var partitionEndLessThanEqual = genPartition(
  'hi<=p0',
  ['p0'])

var partitionContainsPoint = genPartition(
  'lo<=p0&&p0<=hi',
  ['p0'])

var partitionContainsPointProper = genPartition(
  'lo<p0&&p0<=hi',
  ['p0'])

//Frame size for iterative loop
var IFRAME_SIZE = 6
var DFRAME_SIZE = 2

//Data for box statck
var INIT_CAPACITY = 1024
var BOX_ISTACK  = pool.mallocInt32(INIT_CAPACITY)
var BOX_DSTACK  = pool.mallocDouble(INIT_CAPACITY)

//Initialize iterative loop queue
function iterInit(d, count) {
  var levels = (8 * bits.log2(count+1) * (d+1))|0
  var maxInts = bits.nextPow2(IFRAME_SIZE*levels)
  if(BOX_ISTACK.length < maxInts) {
    pool.free(BOX_ISTACK)
    BOX_ISTACK = pool.mallocInt32(maxInts)
  }
  var maxDoubles = bits.nextPow2(DFRAME_SIZE*levels)
  if(BOX_DSTACK < maxDoubles) {
    pool.free(BOX_DSTACK)
    BOX_DSTACK = pool.mallocDouble(maxDoubles)
  }
}

//Append item to queue
function iterPush(ptr,
  axis, 
  redStart, redEnd, 
  blueStart, blueEnd, 
  state, 
  lo, hi) {

  var iptr = IFRAME_SIZE * ptr
  BOX_ISTACK[iptr]   = axis
  BOX_ISTACK[iptr+1] = redStart
  BOX_ISTACK[iptr+2] = redEnd
  BOX_ISTACK[iptr+3] = blueStart
  BOX_ISTACK[iptr+4] = blueEnd
  BOX_ISTACK[iptr+5] = state

  var dptr = DFRAME_SIZE * ptr
  BOX_DSTACK[dptr]   = lo
  BOX_DSTACK[dptr+1] = hi
}

//Special case:  Intersect single point with list of intervals
function onePointPartial(
  d, axis, visit, flip,
  redStart, redEnd, red, redIndex,
  blueOffset, blue, blueId) {

  var elemSize = 2 * d
  var bluePtr  = blueOffset * elemSize
  var blueX    = blue[bluePtr + axis]

red_loop:
  for(var i=redStart, redPtr=redStart*elemSize; i<redEnd; ++i, redPtr+=elemSize) {
    var r0 = red[redPtr+axis]
    var r1 = red[redPtr+axis+d]
    if(blueX < r0 || r1 < blueX) {
      continue
    }
    if(flip && blueX === r0) {
      continue
    }
    var redId = redIndex[i]
    for(var j=axis+1; j<d; ++j) {
      var r0 = red[redPtr+j]
      var r1 = red[redPtr+j+d]
      var b0 = blue[bluePtr+j]
      var b1 = blue[bluePtr+j+d]
      if(r1 < b0 || b1 < r0) {
        continue red_loop
      }
    }
    var retval
    if(flip) {
      retval = visit(blueId, redId)
    } else {
      retval = visit(redId, blueId)
    }
    if(retval !== void 0) {
      return retval
    }
  }
}

//Special case:  Intersect one point with list of intervals
function onePointFull(
  d, axis, visit,
  redStart, redEnd, red, redIndex,
  blueOffset, blue, blueId) {

  var elemSize = 2 * d
  var bluePtr  = blueOffset * elemSize
  var blueX    = blue[bluePtr + axis]

red_loop:
  for(var i=redStart, redPtr=redStart*elemSize; i<redEnd; ++i, redPtr+=elemSize) {
    var redId = redIndex[i]
    if(redId === blueId) {
      continue
    }
    var r0 = red[redPtr+axis]
    var r1 = red[redPtr+axis+d]
    if(blueX < r0 || r1 < blueX) {
      continue
    }
    for(var j=axis+1; j<d; ++j) {
      var r0 = red[redPtr+j]
      var r1 = red[redPtr+j+d]
      var b0 = blue[bluePtr+j]
      var b1 = blue[bluePtr+j+d]
      if(r1 < b0 || b1 < r0) {
        continue red_loop
      }
    }
    var retval = visit(redId, blueId)
    if(retval !== void 0) {
      return retval
    }
  }
}

//The main box intersection routine
function boxIntersectIter(
  d, visit, initFull,
  xSize, xBoxes, xIndex,
  ySize, yBoxes, yIndex) {

  //Reserve memory for stack
  iterInit(d, xSize + ySize)

  var top  = 0
  var elemSize = 2 * d
  var retval

  iterPush(top++,
      0,
      0, xSize,
      0, ySize,
      initFull ? 16 : 0, 
      -Infinity, Infinity)
  if(!initFull) {
    iterPush(top++,
      0,
      0, ySize,
      0, xSize,
      1, 
      -Infinity, Infinity)
  }

  while(top > 0) {
    top  -= 1

    var iptr = top * IFRAME_SIZE
    var axis      = BOX_ISTACK[iptr]
    var redStart  = BOX_ISTACK[iptr+1]
    var redEnd    = BOX_ISTACK[iptr+2]
    var blueStart = BOX_ISTACK[iptr+3]
    var blueEnd   = BOX_ISTACK[iptr+4]
    var state     = BOX_ISTACK[iptr+5]

    var dptr = top * DFRAME_SIZE
    var lo        = BOX_DSTACK[dptr]
    var hi        = BOX_DSTACK[dptr+1]

    //Unpack state info
    var flip      = (state & 1)
    var full      = !!(state & 16)

    //Unpack indices
    var red       = xBoxes
    var redIndex  = xIndex
    var blue      = yBoxes
    var blueIndex = yIndex
    if(flip) {
      red         = yBoxes
      redIndex    = yIndex
      blue        = xBoxes
      blueIndex   = xIndex
    }

    if(state & 2) {
      redEnd = partitionStartLessThan(
        d, axis,
        redStart, redEnd, red, redIndex,
        hi)
      if(redStart >= redEnd) {
        continue
      }
    }
    if(state & 4) {
      redStart = partitionEndLessThanEqual(
        d, axis,
        redStart, redEnd, red, redIndex,
        lo)
      if(redStart >= redEnd) {
        continue
      }
    }
    
    var redCount  = redEnd  - redStart
    var blueCount = blueEnd - blueStart

    if(full) {
      if(d * redCount * (redCount + blueCount) < SCAN_COMPLETE_CUTOFF) {
        retval = sweep.scanComplete(
          d, axis, visit, 
          redStart, redEnd, red, redIndex,
          blueStart, blueEnd, blue, blueIndex)
        if(retval !== void 0) {
          return retval
        }
        continue
      }
    } else {
      if(d * Math.min(redCount, blueCount) < BRUTE_FORCE_CUTOFF) {
        //If input small, then use brute force
        retval = bruteForcePartial(
            d, axis, visit, flip,
            redStart,  redEnd,  red,  redIndex,
            blueStart, blueEnd, blue, blueIndex)
        if(retval !== void 0) {
          return retval
        }
        continue
      } else if(d * redCount * blueCount < SCAN_CUTOFF) {
        //If input medium sized, then use sweep and prune
        retval = sweep.scanBipartite(
          d, axis, visit, flip, 
          redStart, redEnd, red, redIndex,
          blueStart, blueEnd, blue, blueIndex)
        if(retval !== void 0) {
          return retval
        }
        continue
      }
    }
    
    //First, find all red intervals whose interior contains (lo,hi)
    var red0 = partitionInteriorContainsInterval(
      d, axis, 
      redStart, redEnd, red, redIndex,
      lo, hi)

    //Lower dimensional case
    if(redStart < red0) {

      if(d * (red0 - redStart) < BRUTE_FORCE_CUTOFF) {
        //Special case for small inputs: use brute force
        retval = bruteForceFull(
          d, axis+1, visit,
          redStart, red0, red, redIndex,
          blueStart, blueEnd, blue, blueIndex)
        if(retval !== void 0) {
          return retval
        }
      } else if(axis === d-2) {
        if(flip) {
          retval = sweep.sweepBipartite(
            d, visit,
            blueStart, blueEnd, blue, blueIndex,
            redStart, red0, red, redIndex)
        } else {
          retval = sweep.sweepBipartite(
            d, visit,
            redStart, red0, red, redIndex,
            blueStart, blueEnd, blue, blueIndex)
        }
        if(retval !== void 0) {
          return retval
        }
      } else {
        iterPush(top++,
          axis+1,
          redStart, red0,
          blueStart, blueEnd,
          flip,
          -Infinity, Infinity)
        iterPush(top++,
          axis+1,
          blueStart, blueEnd,
          redStart, red0,
          flip^1,
          -Infinity, Infinity)
      }
    }

    //Divide and conquer phase
    if(red0 < redEnd) {

      //Cut blue into 3 parts:
      //
      //  Points < mid point
      //  Points = mid point
      //  Points > mid point
      //
      var blue0 = findMedian(
        d, axis, 
        blueStart, blueEnd, blue, blueIndex)
      var mid = blue[elemSize * blue0 + axis]
      var blue1 = partitionStartEqual(
        d, axis,
        blue0, blueEnd, blue, blueIndex,
        mid)

      //Right case
      if(blue1 < blueEnd) {
        iterPush(top++,
          axis,
          red0, redEnd,
          blue1, blueEnd,
          (flip|4) + (full ? 16 : 0),
          mid, hi)
      }

      //Left case
      if(blueStart < blue0) {
        iterPush(top++,
          axis,
          red0, redEnd,
          blueStart, blue0,
          (flip|2) + (full ? 16 : 0),
          lo, mid)
      }

      //Center case (the hard part)
      if(blue0 + 1 === blue1) {
        //Optimization: Range with exactly 1 point, use a brute force scan
        if(full) {
          retval = onePointFull(
            d, axis, visit,
            red0, redEnd, red, redIndex,
            blue0, blue, blueIndex[blue0])
        } else {
          retval = onePointPartial(
            d, axis, visit, flip,
            red0, redEnd, red, redIndex,
            blue0, blue, blueIndex[blue0])
        }
        if(retval !== void 0) {
          return retval
        }
      } else if(blue0 < blue1) {
        var red1
        if(full) {
          //If full intersection, need to handle special case
          red1 = partitionContainsPoint(
            d, axis,
            red0, redEnd, red, redIndex,
            mid)
          if(red0 < red1) {
            var redX = partitionStartEqual(
              d, axis,
              red0, red1, red, redIndex,
              mid)
            if(axis === d-2) {
              //Degenerate sweep intersection:
              //  [red0, redX] with [blue0, blue1]
              if(red0 < redX) {
                retval = sweep.sweepComplete(
                  d, visit,
                  red0, redX, red, redIndex,
                  blue0, blue1, blue, blueIndex)
                if(retval !== void 0) {
                  return retval
                }
              }

              //Normal sweep intersection:
              //  [redX, red1] with [blue0, blue1]
              if(redX < red1) {
                retval = sweep.sweepBipartite(
                  d, visit,
                  redX, red1, red, redIndex,
                  blue0, blue1, blue, blueIndex)
                if(retval !== void 0) {
                  return retval
                }
              }
            } else {
              if(red0 < redX) {
                iterPush(top++,
                  axis+1,
                  red0, redX,
                  blue0, blue1,
                  16,
                  -Infinity, Infinity)
              }
              if(redX < red1) {
                iterPush(top++,
                  axis+1,
                  redX, red1,
                  blue0, blue1,
                  0,
                  -Infinity, Infinity)
                iterPush(top++,
                  axis+1,
                  blue0, blue1,
                  redX, red1,
                  1,
                  -Infinity, Infinity)
              }
            }
          }
        } else {
          if(flip) {
            red1 = partitionContainsPointProper(
              d, axis,
              red0, redEnd, red, redIndex,
              mid)
          } else {
            red1 = partitionContainsPoint(
              d, axis,
              red0, redEnd, red, redIndex,
              mid)
          }
          if(red0 < red1) {
            if(axis === d-2) {
              if(flip) {
                retval = sweep.sweepBipartite(
                  d, visit,
                  blue0, blue1, blue, blueIndex,
                  red0, red1, red, redIndex)
              } else {
                retval = sweep.sweepBipartite(
                  d, visit,
                  red0, red1, red, redIndex,
                  blue0, blue1, blue, blueIndex)
              }
            } else {
              iterPush(top++,
                axis+1,
                red0, red1,
                blue0, blue1,
                flip,
                -Infinity, Infinity)
              iterPush(top++,
                axis+1,
                blue0, blue1,
                red0, red1,
                flip^1,
                -Infinity, Infinity)
            }
          }
        }
      }
    }
  }
}

/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var DIMENSION   = 'd'
var AXIS        = 'ax'
var VISIT       = 'vv'
var FLIP        = 'fp'

var ELEM_SIZE   = 'es'

var RED_START   = 'rs'
var RED_END     = 're'
var RED_BOXES   = 'rb'
var RED_INDEX   = 'ri'
var RED_PTR     = 'rp'

var BLUE_START  = 'bs'
var BLUE_END    = 'be'
var BLUE_BOXES  = 'bb'
var BLUE_INDEX  = 'bi'
var BLUE_PTR    = 'bp'

var RETVAL      = 'rv'

var INNER_LABEL = 'Q'

var ARGS = [
  DIMENSION,
  AXIS,
  VISIT,
  RED_START,
  RED_END,
  RED_BOXES,
  RED_INDEX,
  BLUE_START,
  BLUE_END,
  BLUE_BOXES,
  BLUE_INDEX
]

function generateBruteForce(redMajor, flip, full) {
  var funcName = 'bruteForce' + 
    (redMajor ? 'Red' : 'Blue') + 
    (flip ? 'Flip' : '') +
    (full ? 'Full' : '')

  var code = ['function ', funcName, '(', ARGS.join(), '){',
    'var ', ELEM_SIZE, '=2*', DIMENSION, ';']

  var redLoop = 
    'for(var i=' + RED_START + ',' + RED_PTR + '=' + ELEM_SIZE + '*' + RED_START + ';' +
        'i<' + RED_END +';' +
        '++i,' + RED_PTR + '+=' + ELEM_SIZE + '){' +
        'var x0=' + RED_BOXES + '[' + AXIS + '+' + RED_PTR + '],' +
            'x1=' + RED_BOXES + '[' + AXIS + '+' + RED_PTR + '+' + DIMENSION + '],' +
            'xi=' + RED_INDEX + '[i];'

  var blueLoop = 
    'for(var j=' + BLUE_START + ',' + BLUE_PTR + '=' + ELEM_SIZE + '*' + BLUE_START + ';' +
        'j<' + BLUE_END + ';' +
        '++j,' + BLUE_PTR + '+=' + ELEM_SIZE + '){' +
        'var y0=' + BLUE_BOXES + '[' + AXIS + '+' + BLUE_PTR + '],' +
            (full ? 'y1=' + BLUE_BOXES + '[' + AXIS + '+' + BLUE_PTR + '+' + DIMENSION + '],' : '') +
            'yi=' + BLUE_INDEX + '[j];'

  if(redMajor) {
    code.push(redLoop, INNER_LABEL, ':', blueLoop)
  } else {
    code.push(blueLoop, INNER_LABEL, ':', redLoop)
  }

  if(full) {
    code.push('if(y1<x0||x1<y0)continue;')
  } else if(flip) {
    code.push('if(y0<=x0||x1<y0)continue;')
  } else {
    code.push('if(y0<x0||x1<y0)continue;')
  }

  code.push('for(var k='+AXIS+'+1;k<'+DIMENSION+';++k){'+
    'var r0='+RED_BOXES+'[k+'+RED_PTR+'],'+
        'r1='+RED_BOXES+'[k+'+DIMENSION+'+'+RED_PTR+'],'+
        'b0='+BLUE_BOXES+'[k+'+BLUE_PTR+'],'+
        'b1='+BLUE_BOXES+'[k+'+DIMENSION+'+'+BLUE_PTR+'];'+
      'if(r1<b0||b1<r0)continue ' + INNER_LABEL + ';}' +
      'var ' + RETVAL + '=' + VISIT + '(')

  if(flip) {
    code.push('yi,xi')
  } else {
    code.push('xi,yi')
  }

  code.push(');if(' + RETVAL + '!==void 0)return ' + RETVAL + ';}}}')

  return {
    name: funcName, 
    code: code.join('')
  }
}

function bruteForcePlanner(full) {
  var funcName = 'bruteForce' + (full ? 'Full' : 'Partial')
  var prefix = []
  var fargs = ARGS.slice()
  if(!full) {
    fargs.splice(3, 0, FLIP)
  }

  var code = ['function ' + funcName + '(' + fargs.join() + '){']

  function invoke(redMajor, flip) {
    var res = generateBruteForce(redMajor, flip, full)
    prefix.push(res.code)
    code.push('return ' + res.name + '(' + ARGS.join() + ');')
  }

  code.push('if(' + RED_END + '-' + RED_START + '>' +
                    BLUE_END + '-' + BLUE_START + '){')

  if(full) {
    invoke(true, false)
    code.push('}else{')
    invoke(false, false)
  } else {
    code.push('if(' + FLIP + '){')
    invoke(true, true)
    code.push('}else{')
    invoke(true, false)
    code.push('}}else{if(' + FLIP + '){')
    invoke(false, true)
    code.push('}else{')
    invoke(false, false)
    code.push('}')
  }
  code.push('}}return ' + funcName)

  var codeStr = prefix.join('') + code.join('')
  var proc = new Function(codeStr)
  return proc()
}


exports.partial = bruteForcePlanner(false)
exports.full    = bruteForcePlanner(true)

/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = findMedian

var genPartition = __webpack_require__(18)

var partitionStartLessThan = genPartition('lo<p0', ['p0'])

var PARTITION_THRESHOLD = 8   //Cut off for using insertion sort in findMedian

//Base case for median finding:  Use insertion sort
function insertionSort(d, axis, start, end, boxes, ids) {
  var elemSize = 2 * d
  var boxPtr = elemSize * (start+1) + axis
  for(var i=start+1; i<end; ++i, boxPtr+=elemSize) {
    var x = boxes[boxPtr]
    for(var j=i, ptr=elemSize*(i-1); 
        j>start && boxes[ptr+axis] > x; 
        --j, ptr-=elemSize) {
      //Swap
      var aPtr = ptr
      var bPtr = ptr+elemSize
      for(var k=0; k<elemSize; ++k, ++aPtr, ++bPtr) {
        var y = boxes[aPtr]
        boxes[aPtr] = boxes[bPtr]
        boxes[bPtr] = y
      }
      var tmp = ids[j]
      ids[j] = ids[j-1]
      ids[j-1] = tmp
    }
  }
}

//Find median using quick select algorithm
//  takes O(n) time with high probability
function findMedian(d, axis, start, end, boxes, ids) {
  if(end <= start+1) {
    return start
  }

  var lo       = start
  var hi       = end
  var mid      = ((end + start) >>> 1)
  var elemSize = 2*d
  var pivot    = mid
  var value    = boxes[elemSize*mid+axis]
  
  while(lo < hi) {
    if(hi - lo < PARTITION_THRESHOLD) {
      insertionSort(d, axis, lo, hi, boxes, ids)
      value = boxes[elemSize*mid+axis]
      break
    }
    
    //Select pivot using median-of-3
    var count  = hi - lo
    var pivot0 = (Math.random()*count+lo)|0
    var value0 = boxes[elemSize*pivot0 + axis]
    var pivot1 = (Math.random()*count+lo)|0
    var value1 = boxes[elemSize*pivot1 + axis]
    var pivot2 = (Math.random()*count+lo)|0
    var value2 = boxes[elemSize*pivot2 + axis]
    if(value0 <= value1) {
      if(value2 >= value1) {
        pivot = pivot1
        value = value1
      } else if(value0 >= value2) {
        pivot = pivot0
        value = value0
      } else {
        pivot = pivot2
        value = value2
      }
    } else {
      if(value1 >= value2) {
        pivot = pivot1
        value = value1
      } else if(value2 >= value0) {
        pivot = pivot0
        value = value0
      } else {
        pivot = pivot2
        value = value2
      }
    }

    //Swap pivot to end of array
    var aPtr = elemSize * (hi-1)
    var bPtr = elemSize * pivot
    for(var i=0; i<elemSize; ++i, ++aPtr, ++bPtr) {
      var x = boxes[aPtr]
      boxes[aPtr] = boxes[bPtr]
      boxes[bPtr] = x
    }
    var y = ids[hi-1]
    ids[hi-1] = ids[pivot]
    ids[pivot] = y

    //Partition using pivot
    pivot = partitionStartLessThan(
      d, axis, 
      lo, hi-1, boxes, ids,
      value)

    //Swap pivot back
    var aPtr = elemSize * (hi-1)
    var bPtr = elemSize * pivot
    for(var i=0; i<elemSize; ++i, ++aPtr, ++bPtr) {
      var x = boxes[aPtr]
      boxes[aPtr] = boxes[bPtr]
      boxes[bPtr] = x
    }
    var y = ids[hi-1]
    ids[hi-1] = ids[pivot]
    ids[pivot] = y

    //Swap pivot to last pivot
    if(mid < pivot) {
      hi = pivot-1
      while(lo < hi && 
        boxes[elemSize*(hi-1)+axis] === value) {
        hi -= 1
      }
      hi += 1
    } else if(pivot < mid) {
      lo = pivot + 1
      while(lo < hi &&
        boxes[elemSize*lo+axis] === value) {
        lo += 1
      }
    } else {
      break
    }
  }

  //Make sure pivot is at start
  return partitionStartLessThan(
    d, axis, 
    start, mid, boxes, ids,
    boxes[elemSize*mid+axis])
}

/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = function (noa) {
	return {

		name: 'smooth-camera',

		state: {
			time: 100.1
		},

		onAdd: null,

		onRemove: null,

		system: function (dt, states) {
			// remove self after time elapses
			for (var i = 0; i < states.length; ++i) {
				var state = states[i]
				state.time -= dt
				if (state.time < 0) noa.ents.removeComponent(state.__id, 'smooth-camera')
			}
		},



	}
}



/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vec3 = __webpack_require__(0)

/**
 * 
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body. 
 * 
 */

module.exports = function (noa) {
	return {

		name: 'movement',

		state: {
			// current state
			heading: 0, 			// radians
			running: false,
			jumping: false,

			// options:
			maxSpeed: 10,
			moveForce: 30,
			responsiveness: 15,
			runningFriction: 0,
			standingFriction: 50,

			airMoveMult: 0.5,
			jumpImpulse: 10,
			jumpForce: 12,
			jumpTime: 500, 			// ms
			airJumps: 1,

			// internal state
			_jumpCount: 0,
			_isJumping: 0,
			_currjumptime: 0,
		},

		onAdd: null,

		onRemove: null,


		system: function movementProcessor(dt, states) {
			var ents = noa.entities

			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				var body = ents.getPhysicsBody(state.__id)
				applyMovementPhysics(dt, state, body)
			}

		}


	}
}


var tempvec = vec3.create()
var tempvec2 = vec3.create()
var zeroVec = vec3.create()


function applyMovementPhysics(dt, state, body) {
	// move implementation originally written as external module
	//   see https://github.com/andyhall/voxel-fps-controller
	//   for original code

	// jumping
	var onGround = (body.atRestY() < 0)
	var canjump = (onGround || state._jumpCount < state.airJumps)
	if (onGround) {
		state._isJumping = false
		state._jumpCount = 0
	}

	// process jump input
	if (state.jumping) {
		if (state._isJumping) { // continue previous jump
			if (state._currjumptime > 0) {
				var jf = state.jumpForce
				if (state._currjumptime < dt) jf *= state._currjumptime / dt
				body.applyForce([0, jf, 0])
				state._currjumptime -= dt
			}
		} else if (canjump) { // start new jump
			state._isJumping = true
			if (!onGround) state._jumpCount++
			state._currjumptime = state.jumpTime
			body.applyImpulse([0, state.jumpImpulse, 0])
			// clear downward velocity on airjump
			if (!onGround && body.velocity[1] < 0) body.velocity[1] = 0
		}
	} else {
		state._isJumping = false
	}

	// apply movement forces if entity is moving, otherwise just friction
	var m = tempvec
	var push = tempvec2
	if (state.running) {

		var speed = state.maxSpeed
		// todo: add crouch/sprint modifiers if needed
		// if (state.sprint) speed *= state.sprintMoveMult
		// if (state.crouch) speed *= state.crouchMoveMult
		vec3.set(m, 0, 0, speed)

		// rotate move vector to entity's heading
		vec3.rotateY(m, m, zeroVec, state.heading)

		// push vector to achieve desired speed & dir
		// following code to adjust 2D velocity to desired amount is patterned on Quake: 
		// https://github.com/id-Software/Quake-III-Arena/blob/master/code/game/bg_pmove.c#L275
		vec3.subtract(push, m, body.velocity)
		push[1] = 0
		var pushLen = vec3.length(push)
		vec3.normalize(push, push)

		if (pushLen > 0) {
			// pushing force vector
			var canPush = state.moveForce
			if (!onGround) canPush *= state.airMoveMult

			// apply final force
			var pushAmt = state.responsiveness * pushLen
			if (canPush > pushAmt) canPush = pushAmt

			vec3.scale(push, push, canPush)
			body.applyForce(push)
		}

		// different friction when not moving
		// idea from Sonic: http://info.sonicretro.org/SPG:Running
		body.friction = state.runningFriction
	} else {
		body.friction = state.standingFriction
	}



}





/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * 
 * Input processing component - gets (key) input state and  
 * applies it to receiving entities by updating their movement 
 * component state (heading, movespeed, jumping, etc.)
 * 
 */

module.exports = function (noa) {
	return {

		name: 'receivesInputs',

		state: {},

		onAdd: null,

		onRemove: null,

		system: function inputProcessor(dt, states) {
			var ents = noa.entities
			var inputState = noa.inputs.state
			var camHeading = noa.rendering.getCameraRotation()[1]

			for (var i = 0; i < states.length; i++) {
				var moveState = ents.getMovement(states[i].__id)
				setMovementState(moveState, inputState, camHeading)
			}
		}

	}
}



function setMovementState(state, inputs, camHeading) {
	state.jumping = !!inputs.jump

	var fb = inputs.forward ? (inputs.backward ? 0 : 1) : (inputs.backward ? -1 : 0)
	var rl = inputs.right ? (inputs.left ? 0 : 1) : (inputs.left ? -1 : 0)

	if ((fb | rl) === 0) {
		state.running = false
	} else {
		state.running = true
		if (fb) {
			if (fb == -1) camHeading += Math.PI
			if (rl) {
				camHeading += Math.PI / 4 * fb * rl // didn't plan this but it works!
			}
		} else {
			camHeading += rl * Math.PI / 2
		}
		state.heading = camHeading
	}

}





/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Component for the player entity, when active hides the player's mesh 
 * when camera zoom is less than a certain amount
 */

module.exports = function (noa) {
	return {

		name: 'fadeOnZoom',

		state: {
			cutoff: 1.5,
			_showing: true
		},

		onAdd: null,

		onRemove: null,

		system: function fadeOnZoomProc(dt, states) {
			var zoom = noa.rendering._currentZoom
			var ents = noa.entities
			for (var i = 0; i < states.length; i++) {
				var state = states[i]
				checkZoom(state, state.__id, zoom, ents)
			}
		}
	}
}


function checkZoom(state, id, zoom, ents) {
	if (!ents.hasMesh(id)) return

	if (state._showing && zoom < state.cutoff || !state._showing && zoom > state.cutoff) {
		var mesh = ents.getMeshData(id).mesh
		mesh.visibility = state._showing = (zoom > state.cutoff)
	}
}




/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function traceRay_impl( getVoxel,
	px, py, pz,
	dx, dy, dz,
	max_d, hit_pos, hit_norm) {
	
	// consider raycast vector to be parametrized by t
	//   vec = [px,py,pz] + t * [dx,dy,dz]
	
	// algo below is as described by this paper:
	// http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
	
	var t = 0.0
		, floor = Math.floor
		, ix = floor(px) | 0
		, iy = floor(py) | 0
		, iz = floor(pz) | 0

		, stepx = (dx > 0) ? 1 : -1
		, stepy = (dy > 0) ? 1 : -1
		, stepz = (dz > 0) ? 1 : -1
		
	// dx,dy,dz are already normalized
		, txDelta = Math.abs(1 / dx)
		, tyDelta = Math.abs(1 / dy)
		, tzDelta = Math.abs(1 / dz)

		, xdist = (stepx > 0) ? (ix + 1 - px) : (px - ix)
		, ydist = (stepy > 0) ? (iy + 1 - py) : (py - iy)
		, zdist = (stepz > 0) ? (iz + 1 - pz) : (pz - iz)
		
	// location of nearest voxel boundary, in units of t 
		, txMax = (txDelta < Infinity) ? txDelta * xdist : Infinity
		, tyMax = (tyDelta < Infinity) ? tyDelta * ydist : Infinity
		, tzMax = (tzDelta < Infinity) ? tzDelta * zdist : Infinity

		, steppedIndex = -1
	
	// main loop along raycast vector
	while (t <= max_d) {
		
		// exit check
		var b = getVoxel(ix, iy, iz)
		if (b) {
			if (hit_pos) {
				hit_pos[0] = px + t * dx
				hit_pos[1] = py + t * dy
				hit_pos[2] = pz + t * dz
			}
			if (hit_norm) {
				hit_norm[0] = hit_norm[1] = hit_norm[2] = 0
				if (steppedIndex === 0) hit_norm[0] = -stepx
				if (steppedIndex === 1) hit_norm[1] = -stepy
				if (steppedIndex === 2) hit_norm[2] = -stepz
			}
			return b
		}
		
		// advance t to next nearest voxel boundary
		if (txMax < tyMax) {
			if (txMax < tzMax) {
				ix += stepx
				t = txMax
				txMax += txDelta
				steppedIndex = 0
			} else {
				iz += stepz
				t = tzMax
				tzMax += tzDelta
				steppedIndex = 2
			}
		} else {
			if (tyMax < tzMax) {
				iy += stepy
				t = tyMax
				tyMax += tyDelta
				steppedIndex = 1
			} else {
				iz += stepz
				t = tzMax
				tzMax += tzDelta
				steppedIndex = 2
			}
		}

	}
	
	// no voxel hit found
	if (hit_pos) {
		hit_pos[0] = px + t * dx
		hit_pos[1] = py + t * dy
		hit_pos[2] = pz + t * dz
	}
	if (hit_norm) {
		hit_norm[0] = hit_norm[1] = hit_norm[2] = 0
	}

	return 0

}


// conform inputs

function traceRay(getVoxel, origin, direction, max_d, hit_pos, hit_norm) {
	var px = +origin[0]
		, py = +origin[1]
		, pz = +origin[2]
		, dx = +direction[0]
		, dy = +direction[1]
		, dz = +direction[2]
		, ds = Math.sqrt(dx * dx + dy * dy + dz * dz)

	if (ds === 0) {
		throw new Error("Can't raycast along a zero vector")
	}

	dx /= ds
	dy /= ds
	dz /= ds
	if (typeof (max_d) === "undefined") {
		max_d = 64.0
	} else {
		max_d = +max_d
	}
	return traceRay_impl(getVoxel, px, py, pz, dx, dy, dz, max_d, hit_pos, hit_norm)
}

module.exports = traceRay

/***/ })
/******/ ]);