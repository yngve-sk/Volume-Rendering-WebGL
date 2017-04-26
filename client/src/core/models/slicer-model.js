let twgl = require('twgl.js'),
    primitives = twgl.primitives,
    m4 = twgl.m4,
    v3 = twgl.v3;

let CameraV2 = require('./camera-orbiter-v2');
let MouseHandler = require('../mouse-handler');

let OrbiterCamera = require('./camera-orbiter');

// Create XY Quad
primitives.createXYQuadVertices = function (size, xOffset, yOffset) {

}

primitives.createCenteredXYQuadVertices = function (size) {
    return primitives.createXYQuadVertices(size, 0, 0); // [-size/2, size/2]
}

primitives.createCenteredYZQuadVertices = function (size) {
    let XYQuadVertices = primitives.createXYQuadVerticesVertices(size, 0, 0);

    // XY -> YZ Rotate 90 degrees around Y-axis
    let YZQuadVertices = primitives.reorientVertices(XYQuadVertices, m4.rotationX(Math.PI / 2));

    return YZQuadVertices;
}

primitives.createCenteredXZQuadVertices = function (size) {
    let XYQuadVertices = primitives.createXYQuadVertices(size, 0, 0);

    // XY -> XZ Rotate 90 degrees around Z-axis
    let XZQuadVertices = primitives.reorientVertices(XYQuadVertices, m4.rotationZ(Math.PI / 2));

    return XZQuadVertices;
}

/**
 * Represents an underlying discrete model of a slicer. It only represents the
 * slices itself, and will generate the geometry needed to render the
 * _SLICER_ but how it affects rendering is up to other implementations.
 * @memberof module:Core/Models
 */
class SlicerModel {
    constructor(gl, viewManager, myID) {

        window['HID' + myID] = (id) => {
            this.slicerBox.highlightID(id);
            this._refreshUniforms();
        }

        this.gl = gl;
        this.pickingBuffer = viewManager.getPickingBufferInfo('SlicerPicking', myID);

        // .get, .refresh

        console.log("SlicerModel constrcutor!");

        this.camera = new OrbiterCamera(v3.create(1, 3, -7), {
            fieldOfViewRadians: Math.PI / 10,
            aspectRatio: 1, // Initial
            zNear: 1.0,
            zFar: 15.0
        });

        this.camera = new CameraV2({
            radius: 10.2,

            theta: 0,
            phi: 0,
            //target: v3.create(0,0,0),

            projectionSettings: {
                fieldOfViewRadians: Math.PI / 10,
                aspectRatio: 1, // Initial
                zNear: 0.5,
                zFar: 18.0
            },

            ROT_SPEED_X: 3.5,
            ROT_SPEED_Y: 3.5
        });


        this.slicerBox = new LabeledSlicerBox(Math.sqrt(2));

        this.uniforms = {
            u_HighlightID: -1,
            u_QuadOffsets: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            u_QuadOffsetIndices: [0, 1, 2, 3, 4, 5],
            u_WorldViewProjection: -1,
        };

        this.attribArrays = {

        };

        this._refreshUniforms();
        this._genAttribArrays();
        this.mouseHandler = new MouseHandler({
            clickTimeout: 150
        });
        this._bindMouseHandler();
    }

    _refreshUniforms() {
        // Fetch uniforms from the slicer box
        for (let key in this.slicerBox.uniforms)
            this.uniforms[key] = this.slicerBox.uniforms[key];

        // Fetch MVP from camera
        this.uniforms.u_WorldViewProjection = this.camera.getWorldViewProjectionMatrix();
    }

    _genAttribArrays() {
        this.attribArrays = this.slicerBox.getBufferArrays();
    }

    mouse(event) {
        this.mouseHandler.handle(event);
        if (1)
            return;
        // left click -> rotate / orbit camera
        //let res = this.camera.mouse(event); // TEMP, TODO do raycasting to add/move slices etc

        if (res) {
            console.log("SlicerModel, did shoot ray");
            console.log(res);
        }

        this._refreshUniforms();

        // right click -> context menu?..
        console.log("Slicer mouse event");
        console.log(event);

        let x0 = event.pos.x, // [0,1]
            y0 = event.pos.y;

        let x1 = (x0 * 2.0) - 1.0, // [0,1] -> [-1, 1]
            y1 = -((y0 * 2.0) - 1.0);

    }

    getBuffers() {
        let sideLength = Math.sqrt(2); // Will always just fit
        // 1. Gen the cube vertices, 1 quad per side

    }

    _bindMouseHandler() {
        let gl = this.gl;
        this.mouseHandler.on('click', 'left', (state) => {

            let decodeRGBToID = (r, g, b) => {

            }

            let encodeIDToRGB = (id) => {
                // assume ID is 32bit
                // r g b
                // 8 8 8
            }

            this.pickingBuffer.refresh(); // Render it onto FB before reading
            console.log("MouseCLICK left");
            let pb = this.pickingBuffer.get();
            let dest = new Uint8Array(1.0 * 4);
            let pixels = pb.readPixels(
                state.x * pb.width,
                (1.0 - state.y) * pb.height,
                1.0, 1.0,
                gl.RGBA, gl.UNSIGNED_BYTE,
                dest, 0
            );

            let id = parseInt(dest[0]);

            console.log("Highlighting ID: " + id);

            this.slicerBox.highlightID(id);
            this._refreshUniforms();
            return;


            let ray = this.camera.getRayFromMouseClick({
                x: state.x,
                y: state.y
            });
            console.log("Shot ray: ");
            console.log(ray);

            this.slicerBox.highlightIntersected(ray);
            this._refreshUniforms();
            // Check if it intersects with any of the geometries...


        });
        this.mouseHandler.on('mousedown', 'left', (state) => {
            console.log("MouseDOWN left");

        });
        this.mouseHandler.on('mouseup', 'left', (state) => {
            console.log("MouseUP left");
        });
        this.mouseHandler.on('mousemove', 'left', (state) => {
            console.log("Mousemove left");

            this.pickingBuffer.refresh(); // Render it onto FB before reading
            console.log("MouseCLICK left");
            let pb = this.pickingBuffer.get();
            let dest = new Uint8Array(4 * pb.width * pb.height);

            let pixels = pb.readPixels(
                0, 0,
                pb.width, pb.height,
                gl.RGBA, gl.UNSIGNED_BYTE,
                dest, 0
            );

            let dest2 = new Uint8Array(4 * 1);
            let pixels2 = pb.readPixels(
                state.x * pb.width, (1.0 - state.y) * pb.height,
                1.0, 1.0,
                gl.RGBA, gl.UNSIGNED_BYTE,
                dest2, 0
            );

            let debugcanvas = document.getElementById('debugcanvas');
            let gl2 = debugcanvas.getContext('2d');
            debugcanvas.width = pb.width;
            debugcanvas.height = pb.height;
            gl2.clearRect(0, 0, gl2.canvas.width, gl2.canvas.height);
            let imagedata = new ImageData(new Uint8ClampedArray(dest), pb.width, pb.height);
            gl2.putImageData(imagedata, 0, 0);

            let id = dest2[0];

            this.slicerBox.highlightID(id);
            this._refreshUniforms();

            let pbfb = this.pickingBuffer.get();

            let ray = this.camera.getRayFromMouseClick({
                x: state.x,
                y: state.y
            });
            console.log("Shot ray: ");
            console.log(ray);

            this.slicerBox.highlightIntersected(ray);
            this._refreshUniforms();

        });
        this.mouseHandler.on('drag', 'left', (state) => {
            console.log("Drag left");
            this.camera.rotate(state.dx, state.dy);
            this._refreshUniforms();
        });

    }
}

module.exports = SlicerModel;

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

let UniqueIndexBag = require('../../widgets/split-view/unique-index-bag');

/**
 * Description for LabeledSlicerBox
 * @class LabeledSlicerBox
 * @constructor
 */
class LabeledSlicerBox {
    /**
     * Generates a labeled slicer box with the given size,
     * centered around (0,0,0).
     * It will assign an ID to each rail, face and slice,
     * reason for this is to make highlighting via shaders manageable.
     *
     * @param {number} size
     * @constructor
     */
    constructor(size) {
        this.size = size;
        this.quadIndexBag = new UniqueIndexBag(6); // ids [0,5] reserved for quads

        this.rails = {};
        this.faces = {};
        this.slices = {};

        this.tempsss = true; //TEMP!!

        this.uniforms = {
            u_HighlightID: -1,
            u_QuadOffsets: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            u_QuadOffsetIndices: [0, 1, 2, 3, 4, 5],
            u_RayDir: [0, 0, -1],
            u_PickingRayOrigin: [0, 0, 10]
        };

        this.attribs = null;

        let half = size / 2;
        let id = 6;

        this.quadID = -1;
        this.qCounts = {
            'X': 0,
            'Y': 0,
            'Z': 0
        };

        // Gen faces, 6x, need 2 start points, id range: [6, 11]
        let p0s = [
            [-half, -half, -half],
            [half, half, half]
        ];

        let translateDirs = [
            -1, // face center 2 back
            1 // face center 2 front
        ];

        for (let i = 0; i < p0s.length; i++) {
            let p0 = p0s[i];

            let x = p0[0],
                y = p0[1],
                z = p0[2];

            this.faces[id++] = genYZQuadVertexInfo(p0, translateDirs[i]);
            this.faces[id++] = genXZQuadVertexInfo(p0, translateDirs[i]);
            this.faces[id++] = genXYQuadVertexInfo(p0, translateDirs[i]);
        }

        // Gen rails, all 12 of them, label with IDs etc
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

            this.rails[id++] = {
                p0: p0,
                p1: p1,
                direction: 'X',
                translate: translateDirs[i]
            };
            this.rails[id++] = {
                p0: p0,
                p1: p2,
                direction: 'Y',
                translate: translateDirs[i]
            };
            this.rails[id++] = {
                p0: p0,
                p1: p3,
                direction: 'Z',
                translate: translateDirs[i]
            };
        }

        this.getBufferArrays();
    }

    _getOffsetIndex(normal) {
        switch (normal) {
            case 'X':
                return 0 + this.qCounts[normal];
            case 'Y':
                return 2 + this.qCounts[normal];
            case 'Z':
                return 4 + this.qCounts[normal];
            default:
                return -1;
        }
    }

    _getDirectionIndex(normal) {
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

    _getOffsetIndexOfQuadWithIndex(quadIndex) {
        return this.uniforms.u_QuadOffsetIndices[quadIndex];
    }

    _setOffsetOfQuadWithIndex(quadIndex, offset) {
        let offsetIndex = this.uniforms.u_QuadOffsetIndices[quadIndex];
        this.uniforms.u_QuadOffsets[offsetIndex] = offset;
    }

    addQuad(normal, p0) {
        if (this.qCounts[normal] === 2) // max 2 per direction
            return;

        let quadIndex = this.quadIndexBag.getIndex();
        let offsetIndex = this._getOffsetIndex(normal);

        // Point quad index to offset index
        this.uniforms.u_QuadOffsetIndices[quadIndex] = offsetIndex;

        this.slices[index] = genQuadWithNormal(normal, p0);
        this.qCounts[normal]++;
    }

    moveQuadToOffset(quadID, offset) {
        this._setOffsetOfQuadWithIndex(quadID, offset);
    }

    removeQuad(quadID) {
        delete this.slices[quadID];
        this.quadIndexBag.returnIndex(quadID);
        this.qCounts[normal]--;
        this.uniforms.u_QuadOffsetIndices[quadID] = -1; // Mark quad as inactive
    }

    getUniforms() {
        return this.uniforms;
    }

    highlightID(id) {
        this.uniforms.u_HighlightID = id;
    }

    highlightIntersected(ray) {
        this.uniforms.u_PickingRayOrigin = ray.eye;
        this.uniforms.u_RayDir = ray.dir;

        //// 1. Intersect-test with rails
        //for (let id in this.rails) {
        //    let rail = this.rails[id];
        //    console.log("Checking intersection w/ rail" + id);
        //    if (ray.intersectsLine(rail.p0, rail.p1, 0.07)) {
        //        this.uniforms.u_HighlightID = id;
        //        console.log("RAY HIT RAIL WITH ID: " + id);
        //        return;
        //    }
        //}
        //
        //this.uniforms.u_HighlightID = this.tempsss ? 7 : 9;
        //this.tempsss = !this.tempsss;
    }

    getBufferArrays() {
        // All attrib arrays etc

        if (this.attribs)
            return this.attribs;

        let Vertices = {};

        let RailVertices = {},
            CubeFaceVertices = {};

        let a_position = [],
            a_direction = [],
            a_id = [],
            indices = [];

        let a_positionCubeFace = [],
            a_directionCubeFace = [],
            a_idCubeFace = [],
            indicesCubeFace = [];

        let a_positionRails = [],
            a_directionRails = [],
            a_idRails = [],
            indicesRails = [];

        let numRailsDebug = 4;
        let railNum = 0;

        let xRails = [
            12,
            15,
            18,
            21
                     ];

        // 1. Generate polylines (cylinders) for all rails
        for (let id in this.rails) {
            let rail = this.rails[id];
            let direction = this._getDirectionIndex(rail.direction);

            let railverts = primitives.createCylinderVertices(
                0.07, // Radius of cylinder
                this.size, // Height of cylinder
                5, //  radialSubdivisions The number of subdivisions around the cylinder
                5, // verticalSubdivisions The number of subdivisions down the cylinder.
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
                this.size / 2
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

        // 2. Generate cube faces (quads)
        for (let id in this.faces) {
            let face = this.faces[id];
            let direction = this._getDirectionIndex(face.normal);

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
            let translate = translateQuadVerticesToEdge(face.normal, face.translate, this.size / 2);

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


        let attribs = {
            Vertices: Vertices,
            CubeFaceVertices: CubeFaceVertices,
            RailVertices: RailVertices
        };

        this.attribs = attribs;


        return attribs;
    }
}
