
import boxIntersect from 'box-intersect'



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



export default function (noa) {

    var intervals = []

    return {

        name: 'collideEntities',

        order: 70,

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
            for (var i = 0; i < states.length; i++) {
                var id = states[i].__id
                var dat = ents.getPositionData(id)
                intervals[i] = dat._extents
            }
            intervals.length = states.length

            // run the intersect library
            boxIntersect(intervals, function (a, b) {
                var stateA = states[a]
                var stateB = states[b]
                if (!stateA || !stateB) return
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
