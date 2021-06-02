declare module "epsilon" {
    const _exports: number;
    export = _exports;
}
declare module "create" {
    export = create;
    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */
    function create(): any;
}
declare module "clone" {
    export = clone;
    /**
     * Creates a new vec3 initialized with values from an existing vector
     *
     * @param {vec3} a vector to clone
     * @returns {vec3} a new 3D vector
     */
    function clone(a: any): any;
}
declare module "fromValues" {
    export = fromValues;
    /**
     * Creates a new vec3 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} a new 3D vector
     */
    function fromValues(x: number, y: number, z: number): any;
}
declare module "normalize" {
    export = normalize;
    /**
     * Normalize a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to normalize
     * @returns {vec3} out
     */
    function normalize(out: any, a: any): any;
}
declare module "dot" {
    export = dot;
    /**
     * Calculates the dot product of two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} dot product of a and b
     */
    function dot(a: any, b: any): number;
}
declare module "angle" {
    export = angle;
    /**
     * Get the angle between two 3D vectors
     * @param {vec3} a The first operand
     * @param {vec3} b The second operand
     * @returns {Number} The angle in radians
     */
    function angle(a: any, b: any): number;
}
declare module "copy" {
    export = copy;
    /**
     * Copy the values from one vec3 to another
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the source vector
     * @returns {vec3} out
     */
    function copy(out: any, a: any): any;
}
declare module "set" {
    export = set;
    /**
     * Set the components of a vec3 to the given values
     *
     * @param {vec3} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} out
     */
    function set(out: any, x: number, y: number, z: number): any;
}
declare module "equals" {
    export = equals;
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {vec3} a The first vector.
     * @param {vec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    function equals(a: any, b: any): boolean;
}
declare module "exactEquals" {
    export = exactEquals;
    /**
     * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
     *
     * @param {vec3} a The first vector.
     * @param {vec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    function exactEquals(a: any, b: any): boolean;
}
declare module "add" {
    export = add;
    /**
     * Adds two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function add(out: any, a: any, b: any): any;
}
declare module "subtract" {
    export = subtract;
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function subtract(out: any, a: any, b: any): any;
}
declare module "sub" {
    const _exports: typeof import("subtract");
    export = _exports;
}
declare module "multiply" {
    export = multiply;
    /**
     * Multiplies two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function multiply(out: any, a: any, b: any): any;
}
declare module "mul" {
    const _exports: typeof import("multiply");
    export = _exports;
}
declare module "divide" {
    export = divide;
    /**
     * Divides two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function divide(out: any, a: any, b: any): any;
}
declare module "div" {
    const _exports: typeof import("divide");
    export = _exports;
}
declare module "min" {
    export = min;
    /**
     * Returns the minimum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function min(out: any, a: any, b: any): any;
}
declare module "max" {
    export = max;
    /**
     * Returns the maximum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function max(out: any, a: any, b: any): any;
}
declare module "floor" {
    export = floor;
    /**
     * Math.floor the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to floor
     * @returns {vec3} out
     */
    function floor(out: any, a: any): any;
}
declare module "ceil" {
    export = ceil;
    /**
     * Math.ceil the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to ceil
     * @returns {vec3} out
     */
    function ceil(out: any, a: any): any;
}
declare module "round" {
    export = round;
    /**
     * Math.round the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to round
     * @returns {vec3} out
     */
    function round(out: any, a: any): any;
}
declare module "scale" {
    export = scale;
    /**
     * Scales a vec3 by a scalar number
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec3} out
     */
    function scale(out: any, a: any, b: number): any;
}
declare module "scaleAndAdd" {
    export = scaleAndAdd;
    /**
     * Adds two vec3's after scaling the second operand by a scalar value
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec3} out
     */
    function scaleAndAdd(out: any, a: any, b: any, scale: number): any;
}
declare module "distance" {
    export = distance;
    /**
     * Calculates the euclidian distance between two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} distance between a and b
     */
    function distance(a: any, b: any): number;
}
declare module "dist" {
    const _exports: typeof import("distance");
    export = _exports;
}
declare module "squaredDistance" {
    export = squaredDistance;
    /**
     * Calculates the squared euclidian distance between two vec3's
     *
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {Number} squared distance between a and b
     */
    function squaredDistance(a: any, b: any): number;
}
declare module "sqrDist" {
    const _exports: typeof import("squaredDistance");
    export = _exports;
}
declare module "length" {
    export = length;
    /**
     * Calculates the length of a vec3
     *
     * @param {vec3} a vector to calculate length of
     * @returns {Number} length of a
     */
    function length(a: any): number;
}
declare module "len" {
    const _exports: typeof import("length");
    export = _exports;
}
declare module "squaredLength" {
    export = squaredLength;
    /**
     * Calculates the squared length of a vec3
     *
     * @param {vec3} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    function squaredLength(a: any): number;
}
declare module "sqrLen" {
    const _exports: typeof import("squaredLength");
    export = _exports;
}
declare module "negate" {
    export = negate;
    /**
     * Negates the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to negate
     * @returns {vec3} out
     */
    function negate(out: any, a: any): any;
}
declare module "inverse" {
    export = inverse;
    /**
     * Returns the inverse of the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a vector to invert
     * @returns {vec3} out
     */
    function inverse(out: any, a: any): any;
}
declare module "cross" {
    export = cross;
    /**
     * Computes the cross product of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */
    function cross(out: any, a: any, b: any): any;
}
declare module "lerp" {
    export = lerp;
    /**
     * Performs a linear interpolation between two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec3} out
     */
    function lerp(out: any, a: any, b: any, t: number): any;
}
declare module "random" {
    export = random;
    /**
     * Generates a random vector with the given scale
     *
     * @param {vec3} out the receiving vector
     * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec3} out
     */
    function random(out: any, scale?: number): any;
}
declare module "transformMat4" {
    export = transformMat4;
    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '1'
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec3} out
     */
    function transformMat4(out: any, a: any, m: any): any;
}
declare module "transformMat3" {
    export = transformMat3;
    /**
     * Transforms the vec3 with a mat3.
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m the 3x3 matrix to transform with
     * @returns {vec3} out
     */
    function transformMat3(out: any, a: any, m: any): any;
}
declare module "transformQuat" {
    export = transformQuat;
    /**
     * Transforms the vec3 with a quat
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {quat} q quaternion to transform with
     * @returns {vec3} out
     */
    function transformQuat(out: any, a: any, q: any): any;
}
declare module "rotateX" {
    export = rotateX;
    /**
     * Rotate a 3D vector around the x-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    function rotateX(out: any, a: any, b: any, c: number): any;
}
declare module "rotateY" {
    export = rotateY;
    /**
     * Rotate a 3D vector around the y-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    function rotateY(out: any, a: any, b: any, c: number): any;
}
declare module "rotateZ" {
    export = rotateZ;
    /**
     * Rotate a 3D vector around the z-axis
     * @param {vec3} out The receiving vec3
     * @param {vec3} a The vec3 point to rotate
     * @param {vec3} b The origin of the rotation
     * @param {Number} c The angle of rotation
     * @returns {vec3} out
     */
    function rotateZ(out: any, a: any, b: any, c: number): any;
}
declare module "forEach" {
    export = forEach;
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
    function forEach(a: any[], stride: number, offset: number, count: number, fn: Function, arg?: any): any[];
}
declare module "gl-vec3" {
    export const EPSILON: number;
    export const create: typeof import("create");
    export const clone: typeof import("clone");
    export const angle: typeof import("angle");
    export const fromValues: typeof import("fromValues");
    export const copy: typeof import("copy");
    export const set: typeof import("set");
    export const equals: typeof import("equals");
    export const exactEquals: typeof import("exactEquals");
    export const add: typeof import("add");
    export const subtract: typeof import("subtract");
    export const sub: typeof import("subtract");
    export const multiply: typeof import("multiply");
    export const mul: typeof import("multiply");
    export const divide: typeof import("divide");
    export const div: typeof import("divide");
    export const min: typeof import("min");
    export const max: typeof import("max");
    export const floor: typeof import("floor");
    export const ceil: typeof import("ceil");
    export const round: typeof import("round");
    export const scale: typeof import("scale");
    export const scaleAndAdd: typeof import("scaleAndAdd");
    export const distance: typeof import("distance");
    export const dist: typeof import("distance");
    export const squaredDistance: typeof import("squaredDistance");
    export const sqrDist: typeof import("squaredDistance");
    export const length: typeof import("length");
    export const len: typeof import("length");
    export const squaredLength: typeof import("squaredLength");
    export const sqrLen: typeof import("squaredLength");
    export const negate: typeof import("negate");
    export const inverse: typeof import("inverse");
    export const normalize: typeof import("normalize");
    export const dot: typeof import("dot");
    export const cross: typeof import("cross");
    export const lerp: typeof import("lerp");
    export const random: typeof import("random");
    export const transformMat4: typeof import("transformMat4");
    export const transformMat3: typeof import("transformMat3");
    export const transformQuat: typeof import("transformQuat");
    export const rotateX: typeof import("rotateX");
    export const rotateY: typeof import("rotateY");
    export const rotateZ: typeof import("rotateZ");
    export const forEach: typeof import("forEach");
}
