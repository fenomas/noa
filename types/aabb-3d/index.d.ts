declare module "aabb-3d" {
    export = AABB;
    function AABB(pos: any, vec: any): AABB;
    class AABB {
        constructor(pos: any, vec: any);
        base: any;
        vec: any;
        max: any;
        mag: any;
    }
}
