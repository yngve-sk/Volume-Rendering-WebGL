let twgl = require('twgl.js'),
    primitives = twgl.primitives,
    m4 = twgl.m4,
    v3 = twgl.v3;

let Settings = require('../settings').Views.Slicer;

let SLICERBUFFERS = null;
let genXYQuadVertexInfo = (p0, translate) => {
    let x = p0[0],
        y = p0[1],
        z = p0[2];

    return {
        normal: 'Z',
        p0: p0,
        p1: [-x, y, z],
        p2: [-x, -y, z],
        p3: [x, -y, z],
        offset: 0,
        translate: translate  ||  0
    }
}

let genXZQuadVertexInfo = (p0, translate) => {
    let x = p0[0],
        y = p0[1],
        z = p0[2];

    return {
        normal: 'Y',
        p0: p0,
        p1: [x, y, -z],
        p2: [-x, y, -z],
        p3: [-x, y, z],
        offset: 0,
        translate: translate  ||  0
    }
}

let genYZQuadVertexInfo = (p0, translate) => {
    let x = p0[0],
        y = p0[1],
        z = p0[2];

    return {
        normal: 'X',
        p0: p0,
        p1: [x, y, -z],
        p2: [x, -y, -z],
        p3: [x, -y, z],
        offset: 0,
        translate: translate  ||  0
    }
}

let genQuadWithNormal = (normalAxis, p0) => {
    switch (normalAxis) {
        case 'X':
            return genYZQuadVertexInfo(p0);
        case 'Y':
            return genXZQuadVertexInfo(p0);
        case 'Z':
            return genXYQuadVertexInfo(p0);
        default:
            return -1;
    }
}

let rotateFromYTo = (newDirection) => {
    switch (newDirection) {
        case 'X':
            return m4.rotationZ(Math.PI / 2);
        case 'Y':
            return m4.identity();
        case 'Z':
            return m4.rotationX(Math.PI / 2);
    }
}

let rotateFromXYTo = (newNormal, transDir) => {

    // Starts as XY quad, normal goes in +Z direction...
    // transDir = -1 means that...
    // Y: Face in negative YZ, i.e rotate
    //

    let angle = -transDir * Math.PI / 2;
    switch (newNormal) {
        case 'X': // YZ
            return m4.rotationY(angle);
        case 'Y': // XZ
            return m4.rotationX(angle);
        case 'Z': // XY
            return m4.rotationX(transDir === -1 ? 0 : Math.PI);
    }
}

/**
 *
 *
 * @method translateQuadVerticesToEdge
 * @param {Object} normal normal of the quad, ex an XY quad has the normal Z
 * @param {Object} direction which direction to translate it, can be seen as
 * backwards (-n) or forwards(+n)
 * @param {Object} offset how far to translate it
 * @return {twgl.m4} translation the translation matrix
 */
let translateQuadVerticesToEdge = (normal, direction, offset) => {
    let tx = normal === 'X' ? direction * offset : 0,
        ty = normal === 'Y' ? direction * offset : 0,
        tz = normal === 'Z' ? -direction * offset : 0;

    let translateVec = v3.create(tx, ty, tz);
    return m4.translation(translateVec);
}

/**
 *
 *
 * @method translateCylinderVerticesToEdge
 * @param {Object} alongAxis axis the cylinder is centered and aligned along
 * @param {Object} direction direction to translate it 2D-wise.
 * ex if aligned along axis X, this will represent how much to translate it by
 * offset along the Y (index 0) and Z (index 1) axis
 * @param {Object} offset how far to translate the cylinder vertices. If creating
 * a bounding box translate by size/2
 * @return {twgl.m4} translation the translation matrix
 */
let translateCylinderVerticesToEdge = (alongAxis, direction, offset) => {
    let translateVec = null;

    switch (alongAxis) {
        case 'X': // YZ
            translateVec = v3.create(0, direction[0] * offset, direction[1] * offset);
            break;
        case 'Y': // XZ
            translateVec = v3.create(direction[0] * offset, 0, direction[1] * offset);
            break;
        case 'Z': // XY
            translateVec = v3.create(direction[0] * offset, direction[1] * offset, 0);
            break;
        default:
            console.error("WTF is this alongAxis argument? : " + alongAxis + " ????... expecting 'X', 'Y' or 'Z'");
            break;
    }

    return m4.translation(translateVec);
}


let genSlicerBuffers = (size) => {
    if (SLICERBUFFERS)
        return SLICERBUFFERS;

    let quads = {};
    let rails = {};
    let faces = {};
    let faceInfo = {};

    let getRailInfo = (id) => {
        return rails[id];
    }

    let getCubeFaceInfo = (id) => {
        return faceInfo[id];
    }


    let half = size / 2;

    this.quadID = -1;
    this.qCounts = {
        'X': 0,
        'Y': 0,
        'Z': 0
    };

    let p0s = [
            [-half, -half, -half],
            [half, half, half]
        ];

    let translateDirs = [
            -1, // face center 2 back
            1 // face center 2 front
        ];

    quads[0] = genYZQuadVertexInfo(p0s[0], -1); // normal X
    quads[1] = genYZQuadVertexInfo(p0s[0], -1);

    quads[2] = genXZQuadVertexInfo(p0s[0], -1); // normal Y
    quads[3] = genXZQuadVertexInfo(p0s[0], -1);

    quads[4] = genXYQuadVertexInfo(p0s[0], -1); // normal Z
    quads[5] = genXYQuadVertexInfo(p0s[0], -1);

    let id = 6;
    // Gen faces, 6x, need 2 start points, id range: [6, 11]
    for (let i = 0; i < p0s.length; i++) {
        let p0 = p0s[i];

        let x = p0[0],
            y = p0[1],
            z = p0[2];

        faceInfo[id] = {
            normal: 'X',
            direction: translateDirs[i]
        };
        faces[id++] = genYZQuadVertexInfo(p0, translateDirs[i]);

        faceInfo[id] = {
            normal: 'Y',
            direction: translateDirs[i]
        };
        faces[id++] = genXZQuadVertexInfo(p0, translateDirs[i]);

        faceInfo[id] = {
            normal: 'Z',
            direction: translateDirs[i]
        };
        faces[id++] = genXYQuadVertexInfo(p0, translateDirs[i]);
    }

    p0s = [
            [-size, -size, -size],
            [-size, size, size],
            [size, size, -size],
            [size, -size, size]
        ];

    translateDirs = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]
        ];

    for (let i = 0; i < p0s.length; i++) {
        let p0 = p0s[i];

        let x = p0[0],
            y = p0[1],
            z = p0[2];

        let p1 = [-x, y, z],
            p2 = [x, -y, z],
            p3 = [x, y, -z];

        rails[id++] = {
            p0: p0,
            p1: p1,
            direction: 'X',
            translate: translateDirs[i]
        };
        rails[id++] = {
            p0: p0,
            p1: p2,
            direction: 'Y',
            translate: translateDirs[i]
        };
        rails[id++] = {
            p0: p0,
            p1: p3,
            direction: 'Z',
            translate: translateDirs[i]
        };
    }

    let Vertices = {};

    let RailVertices = {},
        RailVerticesPB = {},
        CubeFaceVertices = {},
        SliceVertices = {};

    let a_position = [],
        a_direction = [],
        a_id = [],
        indices = [];

    let a_positionCubeFace = [],
        a_directionCubeFace = [],
        a_idCubeFace = [],
        indicesCubeFace = [];

    let a_positionSlices = [],
        a_directionSlices = [],
        a_idSlices = [],
        indicesSlices = [];

    let a_positionRails = [],
        a_directionRails = [],
        a_idRails = [],
        indicesRails = [];

    let a_positionRailsPB = [],
        a_directionRailsPB = [],
        a_idRailsPB = [],
        indicesRailsPB = [];


    let numRailsDebug = 4;
    let railNum = 0;

    let getDirectionIndex = (normal) => {
        switch (normal) {
            case 'X':
                return 0;
            case 'Y':
                return 1;
            case 'Z':
                return 2;
            default:
                return -1;
        }
    }

    /**
     * Represents a rails underlying structure, only used in SlicerModel.
     * The rail is a line from p0 to p1
     * @typedef {object} RailInfo
     * @property {twgl.primitives.v3} p0
     * @property {twgl.primitives.v3} p1
     * @property {string} direction X, Y or Z, axis the rail is aligned with
     * @property {Array.number} translate size is always 2. Direction the rail is to be translate in
     * normal to its direction axis, ex if direction is X then it is to be translated
     * along the Y by offset translate[0] and the Z axis by offset translate[1].
     * @memberof module:Core/Models
     **/

    // 1a. Generate polylines (cylinders) for all rails, display ones
    for (let id in rails) {
        let rail = rails[id];
        let direction = getDirectionIndex(rail.direction);

        let railverts = primitives.createCylinderVertices(
            Settings.RailRadiusDisplayMode, // Radius of cylinder
            size, // Height of cylinder
            Settings.RailRadialSubdivisions, //  radialSubdivisions The number of subdivisions around the cylinder
            Settings.RailVerticalSubdivisions, // verticalSubdivisions The number of subdivisions down the cylinder.
            true, // topCap
            true // bottomCap
        );

        let numVerts = railverts.position.length / 3;

        // Append direction and a_id to them too. same size as num verts
        railverts.direction = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        railverts.direction.fill(direction);

        railverts.id = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        railverts.id.fill(id);

        // Rotate+Translate rails from centered along Y to respective position
        let rotate = rotateFromYTo(rail.direction);
        let translate = translateCylinderVerticesToEdge(
            rail.direction,
            rail.translate,
            size / 2
        );

        let rotateThenTranslate = m4.multiply(translate, rotate);
        primitives.reorientVertices(railverts, rotateThenTranslate);

        console.log("ID = " + id + " .... ");
        console.log(rail);
        console.log("-------");

        let indexOffset = a_position.length / 3;

        a_position.push(...railverts.position);
        a_direction.push(...railverts.direction);
        a_id.push(...railverts.id);
        indices.push(...railverts.indices.map((i) => {
            return i + indexOffset;
        }));

        let railIndexOffset = a_positionRails.length / 3;

        a_positionRails.push(...railverts.position);
        a_directionRails.push(...railverts.direction);
        a_idRails.push(...railverts.id);
        indicesRails.push(...railverts.indices.map((i) => {
            return i + railIndexOffset;
        }));
        //if (railNum++ === numRailsDebug)
        //    break;
    }

    // 1b. Generate polylines (cylinders) for all rails, extra thick picking buffer ones
    for (let id in rails) {
        let rail = rails[id];
        let direction = getDirectionIndex(rail.direction);

        let railverts = primitives.createCylinderVertices(
            Settings.RailRadiusPickingBufferMode, // Radius of cylinder
            size, // Height of cylinder
            Settings.RailRadialSubdivisions, //  radialSubdivisions The number of subdivisions around the cylinder
            Settings.RailVerticalSubdivisions, // verticalSubdivisions The number of subdivisions down the cylinder.
            true, // topCap
            true // bottomCap
        );

        let numVerts = railverts.position.length / 3;

        // Append direction and a_id to them too. same size as num verts
        railverts.direction = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        railverts.direction.fill(direction);

        railverts.id = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        railverts.id.fill(id);

        // Rotate+Translate rails from centered along Y to respective position
        let rotate = rotateFromYTo(rail.direction);
        let translate = translateCylinderVerticesToEdge(
            rail.direction,
            rail.translate,
            (size / 2) * Settings.RailOutwardsFactorPickingBuffer
        );

        let rotateThenTranslate = m4.multiply(translate, rotate);
        primitives.reorientVertices(railverts, rotateThenTranslate);

        console.log("ID = " + id + " .... ");
        console.log(rail);
        console.log("-------");

        let railIndexOffset = a_positionRailsPB.length / 3;

        a_positionRailsPB.push(...railverts.position);
        a_directionRailsPB.push(...railverts.direction);
        a_idRailsPB.push(...railverts.id);
        indicesRailsPB.push(...railverts.indices.map((i) => {
            return i + railIndexOffset;
        }));
    }


    // 2. Generate cube faces (quads)
    for (let id in faces) {
        let face = faces[id];
        let direction = getDirectionIndex(face.normal);

        let cubefvs = {};

        let vbo = primitives.createAugmentedTypedArray(3, 4, Float32Array);
        vbo.push(face.p0);
        vbo.push(face.p1);
        vbo.push(face.p2);
        vbo.push(face.p3);

        let ibo = primitives.createAugmentedTypedArray(3, 4, Int16Array);
        ibo.push([0, 1, 2]);
        ibo.push([0, 2, 3]);

        cubefvs.position = vbo;
        cubefvs.indices = ibo;

        let numVerts = cubefvs.position.length / 3;

        cubefvs.direction = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        cubefvs.direction.fill(direction);

        cubefvs.id = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        cubefvs.id.fill(id);

        // Move quad from XY centered to edges
        let rotate = rotateFromXYTo(face.normal, face.translate);
        let translate = translateQuadVerticesToEdge(face.normal, face.translate, size / 2);

        let rotateThenTranslate = m4.multiply(translate, rotate);
        //primitives.reorientPositions(vbo, m4.identity());

        if (face.normal === 'X' && face.translate === 1)
            cubefvs.indices = cubefvs.indices.reverse();
        else if (face.normal !== 'X' && face.translate === -1)
            cubefvs.indices = cubefvs.indices.reverse();


        let indexOffset = a_position.length / 3;

        a_position.push(...cubefvs.position);
        a_direction.push(...cubefvs.direction);
        a_id.push(...cubefvs.id);
        indices.push(...cubefvs.indices.map((i) => {
            return i + indexOffset
        }));

        let cubeFaceIndexOffset = a_positionCubeFace.length / 3;

        a_positionCubeFace.push(...cubefvs.position);
        a_directionCubeFace.push(...cubefvs.direction);
        a_idCubeFace.push(...cubefvs.id);
        indicesCubeFace.push(...cubefvs.indices.map((i) => {
            return i + cubeFaceIndexOffset
        }));
    }

    // 3. Generate the actual slice quads, 2 for each direction
    for (let id in quads) {
        let quad = quads[id];
        let direction = getDirectionIndex(quad.normal);

        let quadfvs = {};

        let vbo = primitives.createAugmentedTypedArray(3, 4, Float32Array);
        vbo.push(quad.p0);
        vbo.push(quad.p1);
        vbo.push(quad.p2);
        vbo.push(quad.p3);

        let ibo = primitives.createAugmentedTypedArray(3, 4, Int16Array);
        ibo.push([0, 1, 2]);
        ibo.push([0, 2, 3]);

        quadfvs.position = vbo;
        quadfvs.indices = ibo;

        let numVerts = quadfvs.position.length / 3;

        quadfvs.direction = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        quadfvs.direction.fill(direction);

        quadfvs.id = primitives.createAugmentedTypedArray(1, numVerts, Int16Array);
        quadfvs.id.fill(id);


        // Move quad from XY centered to edges
        let rotate = rotateFromXYTo(quad.normal, quad.translate);
        let translate = translateQuadVerticesToEdge(quad.normal, quad.translate, size / 2);

        let rotateThenTranslate = m4.multiply(translate, rotate);
        //primitives.reorientPositions(vbo, m4.identity());

        if (quad.normal === 'X' && quad.translate === 1)
            quadfvs.indices = quadfvs.indices.reverse();
        else if (quad.normal !== 'X' && quad.translate === -1)
            quadfvs.indices = quadfvs.indices.reverse();


        let indexOffset = a_position.length / 3;

        a_position.push(...quadfvs.position);
        a_direction.push(...quadfvs.direction);
        a_id.push(...quadfvs.id);
        indices.push(...quadfvs.indices.map((i) => {
            return i + indexOffset
        }));

        let slicesIndexOffset = a_positionSlices.length / 3;

        a_positionSlices.push(...quadfvs.position);
        a_directionSlices.push(...quadfvs.direction);
        a_idSlices.push(...quadfvs.id);
        indicesSlices.push(...quadfvs.indices.map((i) => {
            return i + slicesIndexOffset
        }));
    }

    let totalNumVertices = a_position.length / 3;

    Vertices = { // twgl-friendly format for createBufferInfoFromArrays
        position: {
            numComponents: 3,
            data: new Float32Array(a_position)
        },
        direction: {
            numComponents: 1,
            data: new Int16Array(a_direction)
        },
        id: {
            numComponents: 1,
            data: new Int16Array(a_id)
        },
        indices: {
            numComponents: 3,
            data: new Int16Array(indices)
        }
    };

    RailVertices = { // twgl-friendly format for createBufferInfoFromArrays
        position: {
            numComponents: 3,
            data: new Float32Array(a_positionRails)
        },
        direction: {
            numComponents: 1,
            data: new Int16Array(a_directionRails)
        },
        id: {
            numComponents: 1,
            data: new Int16Array(a_idRails)
        },
        indices: {
            numComponents: 3,
            data: new Int16Array(indicesRails)
        }
    };

    RailVerticesPB = { // twgl-friendly format for createBufferInfoFromArrays
        position: {
            numComponents: 3,
            data: new Float32Array(a_positionRailsPB)
        },
        direction: {
            numComponents: 1,
            data: new Int16Array(a_directionRailsPB)
        },
        id: {
            numComponents: 1,
            data: new Int16Array(a_idRailsPB)
        },
        indices: {
            numComponents: 3,
            data: new Int16Array(indicesRailsPB)
        }
    };

    CubeFaceVertices = { // twgl-friendly format for createBufferInfoFromArrays
        position: {
            numComponents: 3,
            data: new Float32Array(a_positionCubeFace)
        },
        direction: {
            numComponents: 1,
            data: new Int16Array(a_directionCubeFace)
        },
        id: {
            numComponents: 1,
            data: new Int16Array(a_idCubeFace)
        },
        indices: {
            numComponents: 3,
            data: new Int16Array(indicesCubeFace)
        }
    };

    SliceVertices = { // twgl-friendly format for createBufferInfoFromArrays
        position: {
            numComponents: 3,
            data: new Float32Array(a_positionSlices)
        },
        direction: {
            numComponents: 1,
            data: new Int16Array(a_directionSlices)
        },
        id: {
            numComponents: 1,
            data: new Int16Array(a_idSlices)
        },
        indices: {
            numComponents: 3,
            data: new Int16Array(indicesSlices)
        }
    };


    SLICERBUFFERS = {
        Vertices: Vertices,
        CubeFaceVertices: CubeFaceVertices,
        RailVertices: RailVertices,
        RailPickingBufferVertices: RailVerticesPB,
        SliceVertices: SliceVertices,
        IDInfo: {
            getRailInfo: getRailInfo,
            getCubeFaceInfo: getCubeFaceInfo,
            isRail: (id) => {
                return 11 < id;
            },
            isFace: (id) => {
                return 6 <= id && id <= 11;
            },
            isSlice: (id) => {
                return id < 6;
            }
        }
    };

    return SLICERBUFFERS;
}

module.exports = genSlicerBuffers;
