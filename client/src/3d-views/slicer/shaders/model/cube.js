let glMatrix = require('gl-matrix');
let vec3 = glMatrix.vec3;

/*

    Represents a cube that'll give feedback on clicks in 3D coordinates.
    (Get 3D coords from first-hit ray shooting after clicking the 3D view)


    COORD SYSTEM: Same as openGL coords,
        - Z goes OUT of the screen
        - X goes to the right
        - Y goes up
*/
class PickingCube {
    constructor(p000, p111) {
        let x0 = p000[0],
            y0 = p000[1],
            z0 = p000[2];

        let x1 = p111[0],
            y1 = p111[1],
            z1 = p111[2];

        let p001 = vec3.fromValues(x0, y0, z1),
            p010 = vec3.fromValues(x0, y1, z0),
            p100 = vec3.fromValues(x1, y0, z0),
            p110 = vec3.fromValues(x1, y1, z0),
            p101 = vec3.fromValues(x1, y0, z1),
            p011 = vec3.fromValues(x0, y1, z1);

        this.points = {
            p000: p000,
            p001: p001,
            p010: p010,
            p100: p100,
            p110: p110,
            p101: p101,
            p011: p011,
            p111: p111
        };


        this.edges = {
            p000: {
                p001: p001.subtract(p000),
                p100: p100.subtract(p000),
                p010: p010.subtract(p000)
            },

            p011: {
                p010: p010.subtract(p011),
                p001: p001.subtract(p011),
                p111: p111.subtract(p011)
            },

            p110: {
                p010: p010.subtract(p110),
                p100: p100.subtract(p110),
                p111: p111.subtract(p110)
            },

            p101: {
                p001: p001.subtract(p101),
                p100: p100.subtract(p101),
                p111: p111.subtract(p101)
            }
        }

        this.settings = {
            edgeProximityThreshold: 0.1
        };
    }

    /*

        @point, a 3D NORMALIZED point with format [x,y,z]

    */
    pick(point) {

        let pointV = vec3.fromValues(point);

        // 1. Check if it is within proximity of an edge
        // Check if it is close enough to an edge to be considered an intersection.
        for (let originPointKey in this.edges) {
            let edgesFromOriginPoint = this.edges[originPointKey];
            let originPoint = this.points[originPointKey];

            for (let vectorFromOriginKey in edgesFromOriginPoint) {
                let edgeVector = edgesFromOriginPoint[vectorFromOriginKey];
                // Now finally check the shortest distance between the vector
                // from originPoint...
                let originToPointDist = originPoint.distance(pointV);
                let originToPointVec = pointV.subtract(originPoint);

                let angle = vec3.angle(edgeVector, originToPointVec);

                let shortestDistance = originToPointDist * Math.sin(angle);

                if (shortestDistance < this.settings.edgeProximityThreshold)
                    return {
                        type: 'HIT-EDGE',
                        edge: null
                    }
            }
        }
    }


}
