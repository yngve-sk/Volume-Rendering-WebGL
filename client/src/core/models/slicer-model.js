let SIZE = 1.0; // Slicer BB size

let twgl = require('twgl.js'),
    primitives = twgl.primitives,
    m4 = twgl.m4,
    v3 = twgl.v3;

//let CameraV2 = require('./camera-orbiter-v2');
let CameraV2 = require('./camera-orbiter-v2');
let MouseHandler = require('../mouse-handler');

let OrbiterCamera = require('./camera-orbiter');
let getSlicerBuffers = require('./slicer-model-buffers');

let BufferInfo = getSlicerBuffers(SIZE); // Generate it now so it is cached and can be retrieved

let IDInfo = BufferInfo.IDInfo;

let GetInteractionMode = require('../interaction-modes-v2').getInteractionModeGetterForCategory('Slicer');
let Settings = require('../settings').Views.Slicer;

let clamp01 = (val) => {
    return val < 0 ? 0 : (val > 1) ? 1 : val;
}

/** @module Core/Models */


/**
 * Represents an underlying discrete model of a slicer. It only represents the
 * slices itself, and will generate the geometry needed to render the
 * _SLICER_ but how it affects rendering is up to other implementations.
 * @memberof module:Core/Models
 */
class SlicerModel {
    constructor(gl, viewManager, myID) {
        this.viewManager = viewManager;

        // Debugging only
        window['HID' + myID] = (id) => {
            this.slicerBox.highlightID(id);
            this._refreshUniforms();
        }

        this.gl = gl;
        this.pickingBuffer = viewManager.getPickingBufferInfo('SlicerPicking', myID);
        this.myID = myID;

        this.camera = new CameraV2({
            radius: 5.2,

            theta: 0,
            phi: 0,
            //target: v3.create(0,0,0),

            projectionSettings: {
                fieldOfViewRadians: Math.PI / 10,
                aspectRatio: 1, // Initial
                zNear: 0.5,
                zFar: 18.0
            },

            ROT_SPEED_X: 2.1,
            ROT_SPEED_Y: 2.1
        });


        this.slicerBox = new LabeledSlicerBox(SIZE);

        this.uniforms = {
            u_HighlightID: -1,
            u_SliceOffsets: [-1.0, -1.0, -1.0, -1.0, -1.0, -1.0],
            //u_QuadOffsetIndices: [0, 1, 2, 3, 4, 5],
            u_WorldViewProjection: -1,
            u_IntersectionPointDebug: [0, 0, 0]
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

    linkCameraPhiAndThetaTo(otherCameraModel) {
        this.camera.linkTo(otherCameraModel, ['rotation'], () => {
            console.log("Master camera changed for slicer model w/ subview ID " + this.myID);
            this._refreshUniforms();
        });
    }

    getSliceOffsets(axis) {
        let clampMin = (val) => {
            return (0 <= val && val <= 1) ? val : 0;
        }

        let clampMax = (val) => {
            return (0 <= val && val <= 1) ? val : 1;
        }

        let theSlices = [];

        switch (axis) {
            case 'X':
                theSlices = [
                    this.uniforms.u_SliceOffsets[0],
                    this.uniforms.u_SliceOffsets[1]
                ].sort((a, b) => {
                    return a > b
                });

                theSlices[0] = clampMin(theSlices[0]);
                theSlices[1] = clampMax(theSlices[1]);

                return theSlices;
            case 'Y':
                theSlices = [
                    this.uniforms.u_SliceOffsets[2],
                    this.uniforms.u_SliceOffsets[3]
                ].sort((a, b) => {
                    return a > b
                });

                theSlices[0] = clampMin(theSlices[0]);
                theSlices[1] = clampMax(theSlices[1]);

                return theSlices;
            case 'Z':
                theSlices = [
                    this.uniforms.u_SliceOffsets[4],
                    this.uniforms.u_SliceOffsets[5]
                ].sort((a, b) => {
                    return a > b
                });

                theSlices[0] = clampMin(theSlices[0]);
                theSlices[1] = clampMax(theSlices[1]);

                return theSlices;
            default:
                break;
        }

    }

    _refreshUniforms() {
        // Fetch uniforms from the slicer box
        for (let key in this.slicerBox.uniforms)
            this.uniforms[key] = this.slicerBox.uniforms[key];

        // Fetch MVP from camera
        this.uniforms.u_WorldViewProjection = this.camera.getWorldViewProjectionMatrix();
    }

    _genAttribArrays() {
        this.attribArrays = getSlicerBuffers(SIZE);
        //this.attribArrays = this.slicerBox.getBufferArrays();
    }

    mouse(event) {
        this.mouseHandler.handle(event);
    }

    _bindMouseHandler() {
        let gl = this.gl;

        let id = -1;

        let refreshPBs = () => {
            // Ehh... Render them before refreshing from PB manager...
            this.viewManager.renderSlicerPickingBuffers(this.myID);

            this.viewManager.pickingBufferManager.refreshBuffer('SlicerRails', 'debugcanvas1');
            this.viewManager.pickingBufferManager.refreshBuffer('SlicerSlices', 'debugcanvas2');
            this.viewManager.pickingBufferManager.refreshBuffer('SlicerCubeFace', 'debugcanvas3');
        }

        let refreshRailsPB = () => {
            this.viewManager.renderSlickingRailBuffer(this.myID);
            this.viewManager.pickingBufferManager.refreshBuffer('SlicerRails', 'debugcanvas1');
        }

        let getRailIDAndOffset = (mx, my) => {
            let rgb = this.viewManager.pickingBufferManager.readPixel('SlicerRails', mx, my);

            let id = rgb[0] - 1;

            if (IDInfo.isInvalidID(id)) {
                console.error("ID is " + id + ", expected it to be in range [12, " + IDInfo.RAILS_MAX_ID + "]");
            }

            return {
                id: rgb[0] - 1,
                railOffset: rgb[1] / 255.0
            };
        }

        let getSliceID = (mx, my) => {
            let rgb = this.viewManager.pickingBufferManager.readPixel('SlicerSlices', mx, my);

            return rgb[0] - 1;
        }

        let getCubeFaceID = (mx, my) => {
            let rgb = this.viewManager.pickingBufferManager.readPixel('SlicerCubeFace', mx, my);

            return rgb[0] - 1;
        }

        let refreshSlicer = () => {
            this._refreshUniforms();
            this.viewManager.notifySlicerNeedsUpdate(this.myID);
        }

        let refreshSlicerAndVolume = () => {
            this.viewManager.notifySlicesDidChange(this.myID);
        }


        /*        let debugDisplayPickingBuffer = () => {
                    let pb = this.pickingBuffer.get();
                    let dest = new Uint8Array(4 * pb.width * pb.height);

                    let pixels = pb.readPixels(
                        0, 0,
                        pb.width, pb.height,
                        gl.RGBA, gl.UNSIGNED_BYTE,
                        dest, 0
                    );

                    let debugcanvas = document.getElementById('debugcanvas');
                    let gl2 = debugcanvas.getContext('2d');
                    debugcanvas.width = pb.width;
                    debugcanvas.height = pb.height;
                    gl2.clearRect(0, 0, gl2.canvas.width, gl2.canvas.height);
                    let imagedata = new ImageData(new Uint8ClampedArray(dest), pb.width, pb.height);
                    gl2.putImageData(imagedata, 0, 0);
                }

                let readPBPixels = (mx, my) => {
                    this.pickingBuffer.refresh(); // Render it onto FB before reading
                    let pb = this.pickingBuffer.get();
                    let dest = new Uint8Array(4 * 1);
                    let pixels = pb.readPixels(
                        mx * pb.width,
                        (1.0 - my) * pb.height,
                        1.0, 1.0,
                        gl.RGBA, gl.UNSIGNED_BYTE,
                        dest, 0
                    );
                    let id = (dest[0]) - 1;
                    let railOffset = dest[1] / 255.0;

                    return {
                        id: id,
                        railOffset: railOffset
                    };
                }*/


        let dragInfo = {
            railInfo: null
        }

        let getIntersectionOffset = (x, y) => {
            let ray = this.camera.getRayFromMouseClick({
                x: x,
                y: y
            });

            let p0 = dragInfo.railInfo.p0,
                p1 = dragInfo.railInfo.p1,
                direction = dragInfo.railInfo.direction;

            let p = null;

            switch (direction) {
                case 'X':
                    p = p0[0] < p1[0] ? p0 : p1;
                    break;
                case 'Y':
                    p = p0[1] < p1[1] ? p0 : p1;
                    break;
                case 'Z':
                    p = p0[2] < p1[2] ? p0 : p1;
                    break;
            }

            let intersectInfo = ray.intersectsLinePlanes(p, direction, SIZE);
            let intersectionOffset = intersectInfo.intersectOffset;

            this.uniforms.u_IntersectionPointDebug = new Float32Array([
                intersectInfo.point[0],
                intersectInfo.point[0],
                intersectInfo.point[0]
            ]);


            return intersectionOffset;
        }

        this.mouseHandler.on('mouseenter', null, (state) => {
            let interactionMode = GetInteractionMode();

            refreshPBs();

            switch (interactionMode) {
                case 'add': // Render PB cube faces only
                    break;
                case 'remove': // Render PB slices only
                    break;

                default:
                    break;
            }
        });

        this.mouseHandler.on('mouseout', null, (state) => {
            dragInfo.railInfo = null;
            this.slicerBox.resetHighlighting();
            refreshSlicer();
        });

        this.mouseHandler.on('click', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'add':
                    id = getCubeFaceID(state.x, state.y);

                    if (IDInfo.isFace(id)) { // Click on face, will add slice
                        // Add the slice
                        this.slicerBox.addSliceFromCubeFace(id);
                        //this.slicerBox.highlightID(id);
                    } else {
                        this.slicerBox.resetHighlighting();
                    }
                    break;
                case 'remove':
                    id = getSliceID(state.x, state.y);
                    if (IDInfo.isSlice(id))
                        this.slicerBox.removeSlice(id);
                    else
                        this.slicerBox.resetHighlighting();
                    break;
                default: // nothing
                    break;
            }


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
            let interactionMode = GetInteractionMode();
            //let pb = readPBPixels(state.x, state.y);
            //id = pb.id;

            switch (interactionMode) {
                case 'rotate':
                    // Do nothing
                    break;
                case 'move':
                    let idAndOffset = getRailIDAndOffset(state.x, state.y);
                    id = idAndOffset.id;

                    if (IDInfo.isRail(id)) { // Will initiate drag of slice
                        // 1. Find out direction of rail
                        let railInfo = IDInfo.getRailInfo(id);
                        dragInfo.railInfo = railInfo;

                        let offset = idAndOffset.railOffset;
                        console.log("Offset = " + offset);
                        // Drag is magically initiated!
                        this.slicerBox.initiateDragIfHit(railInfo.direction, offset, id);
                        this._refreshUniforms();
                        // Only need rail, now it does all, TODO fix if
                        // it becomes an issue
                        refreshRailsPB();
                        refreshSlicer();
                        return;
                    }
                    break;
            }



            /* switch (interactionMode) {
                 case 'rotate':
                     break;
                 case 'add':
                     if (IDInfo.isFace(id))
                         this.slicerBox.addSliceFromCubeFace(id);
                     break;
                 case 'remove':
                     break;
             }*/


            console.log("MouseDOWN left");

        });
        this.mouseHandler.on('mouseup', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'rotate':
                    refreshPBs();
                    break;
                case 'move':
                    if (dragInfo.railInfo) {
                        dragInfo.railInfo = null;
                        this.slicerBox.endDrag();
                        this._refreshUniforms();
                        refreshRailsPB();
                        return;
                    }
                    break;
            }

            this.slicerBox.resetHighlighting();
            refreshSlicer();

        });
        this.mouseHandler.on('mousemove', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'rotate':
                    // Highlight nothing
                    break;
                case 'add':
                    id = getCubeFaceID(state.x, state.y);

                    if (IDInfo.isFace(id)) {
                        this.slicerBox.highlightID(id);
                        this._refreshUniforms();
                    } else {
                        this.slicerBox.resetHighlighting();
                    }
                    refreshSlicer();
                    // Cube faces only
                    break;
                case 'remove':
                    // Slices only
                    id = getSliceID(state.x, state.y);

                    if (IDInfo.isSlice(id)) {
                        this.slicerBox.highlightID(id);
                        this._refreshUniforms();
                    } else {
                        this.slicerBox.resetHighlighting();
                    }
                    refreshSlicer();
                    break;
                case 'move':
                    // Rails only
                    let railIDAndOffset = getRailIDAndOffset(state.x, state.y);
                    id = railIDAndOffset.id;
                    let railInfo = IDInfo.getRailInfo(id);

                    if (IDInfo.isRail(id)) {
                        this.slicerBox.highlightID(id);
                        this.slicerBox.highlightPotentialDragIfHit(railInfo.direction, railIDAndOffset.railOffset);
                        this._refreshUniforms();
                    } else {
                        this.slicerBox.resetHighlighting();
                    }
                    refreshSlicer();
                    break;
            }

            /*debugDisplayPickingBuffer();
            let pb = readPBPixels(state.x, state.y);
            let id = pb.id;

            if (IDInfo.isRail(id)) {
                let railInfo = IDInfo.getRailInfo(id);
                this.slicerBox.highlightPotentialDragIfHit(railInfo.direction, pb.railOffset);
            } else {
                this.slicerBox.endDrag();
            }


            this.slicerBox.highlightID(id);

            // Can be useful for dragging stuff
            let ray = this.camera.getRayFromMouseClick({
                x: state.x,
                y: state.y
            });

            this.slicerBox.highlightIntersected(ray);
            this._refreshUniforms();*/

        });
        this.mouseHandler.on('drag', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'rotate':
                    this.camera.rotate(state.dx, state.dy, state.x, state.y);
                    this._refreshUniforms();
                    refreshSlicer();
                    break;
                case 'move':
                    let railIDAndOffset = getRailIDAndOffset(state.x, state.y);
                    id = railIDAndOffset.id;
                    if (IDInfo.isRail(id)) {
                        let offset = railIDAndOffset.railOffset;
                        this.slicerBox.dragActiveSlicesAlongAxis(offset);
                        this._refreshUniforms();
                        refreshSlicerAndVolume();
                        break;
                    }
            }


            /* console.log("Drag left");

             let pb = readPBPixels(state.x, state.y);

             if (IDInfo.isRail(pb.id) && this.slicerBox.isDragActive()) {
                 let offset = pb.railOffset;
                 this.slicerBox.dragActiveSlicesAlongAxis(offset);
                 this._refreshUniforms();
                 this.viewManager.notifySlicesDidChange(this.myID);

             } else { // dont rotate when drag in progress...
                 this.camera.rotate(state.dx, state.dy);
                 /*this._refreshUniforms();
                 this.viewManager.requestAnimationFrame(['Slicer'], this.myID);
             }*/





            /*switch (interactionMode) {
                case 'rotate':
                    this.camera.rotate(state.dx, state.dy);
                    break;
                default:
                    //if (this.slicerBox.isSliceDragActive()) {
                    let pb = readPBPixels(state.x, state.y);
                    let offset = pb.railOffset;
                    console.log("Offset = " + offset);

                    this.slicerBox.dragActiveSlicesAlongAxis(offset);
                    //}
                    break;
            }*/
        });

    }
}

module.exports = SlicerModel;

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
     *
     * @constructor
     */
    constructor(size) {

        this.size = size;

        this.uniforms = {
            u_Size: this.size,
            u_HighlightID: -1,
            u_SliceOffsets: [0.2, 0.8, 0.2, 0.8, 0.2, 0.8],
            u_RayDir: [0, 0, -1],
            u_PickingRayOrigin: [0, 0, 10],
            u_DraggedSliceIndices: [-1, -1],
            u_ActiveDragRailID: -1
        };

        this.qCounts = {
            'X': 2,
            'Y': 2,
            'Z': 2
        };


        this.draggedSliceIndex = -1;
        this.draggedSliceIndices = null;
        this.activeDrag = false;

        this.dragOffset = 0;
    }

    _getOffsetIndex(normal) {
        if (this.qCounts[normal] >= 2) {
            console.error("Sir! You cannot add more than 2 slices per axis, sir!");
            return -1;
        }

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

    _getOffsetStartIndex(normal) {
        switch (normal) {
            case 'X':
                return 0;
            case 'Y':
                return 2;
            case 'Z':
                return 4;
            default:
                return -1;
        }
    }

    _getNormal(id) {
        return id < 2 ? 'X' : (id < 4) ? 'Y' : 'Z';
    }

    addSliceFromCubeFace(fromCubeFace) {
        // 1. Convert cube face index to direction and starting position
        let info = this._cubeFaceIDToNormalAndStartOffset(fromCubeFace);

        if (this.qCounts[info.normal] === 2)
            return;

        let index = this._getOffsetIndex(info.normal);
        // 3. Set the offset @ given index
        this.uniforms.u_SliceOffsets[index] = info.startOffset;

        return index;
    }

    _cubeFaceIDToNormalAndStartOffset(cubefaceID) {
        // first 3 are back faces

        let startIndent = 0.02;

        let info = IDInfo.getCubeFaceInfo(cubefaceID);

        let startOffset = info.direction === -1 ?
            (0.0 + startIndent) :
            (1.0 - startIndent);

        let normal = info.normal;

        return {
            startOffset: startOffset,
            normal: normal
        };

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

    _directionIndexToDirection(index) {
        switch (index) {
            case 0:
                return 'X';
            case 1:
                return 'Y';
            case 2:
                return 'Z';
            default:
                return -1;
        }
    }

    getSlicesAtAxisAndOffset(alongAxis, offset) {
        // fuck making it dynamic for now, hardcoding!
        let id1 = this._getOffsetStartIndex(alongAxis),
            id2 = id1 + 1;

        let distances = [];

        let offset1 = this.uniforms.u_SliceOffsets[id1],
            offset2 = this.uniforms.u_SliceOffsets[id2];

        let dist1 = Math.abs(offset1 - offset),
            dist2 = Math.abs(offset2 - offset);

        let snap1 = dist1 <= Settings.SelectSliceSnapThreshold,
            snap2 = dist2 <= Settings.SelectSliceSnapThreshold;

        if (snap1 || snap2) { // Pick the closest out of the two anyway
            // If within snap range of both, pick closest,
            return dist1 < dist2 ? {
                hit: true,
                ids: [id1, -1]
            } : {
                hit: true,
                ids: [id2, -1]
            };
        } else if (offset1 < offset2 ?
            (offset1 < offset && offset < offset2) :
            (offset2 < offset && offset < offset1)
        ) { // If between but not within snap range, drag both
            return { // Drag both
                hit: true,
                ids: [id1, id2]
            }
        } else {
            return {
                hit: false
            }
        }
    }

    highlightPotentialDragIfHit(alongAxis, offset) {
        let slices = this.getSlicesAtAxisAndOffset(alongAxis, offset);
        if (slices.hit) {
            this.activeDrag = false;
            this.draggedSliceIndices = slices.ids;
            this.uniforms.u_DraggedSliceIndices = slices.ids;
        }
    }

    initiateDragIfHit(alongAxis, offset, id) {
        let slices = this.getSlicesAtAxisAndOffset(alongAxis, offset);
        if (slices.hit) {
            this.uniforms.u_ActiveDragRailID = id;
            this.activeDrag = true;
            this.draggedSliceIndices = slices.ids;
            this.uniforms.u_DraggedSliceIndices = slices.ids;
            this.dragOffset = offset;
        }
    }

    resetHighlighting() {
        this.endDrag();
    }

    endDrag() {
        this.uniforms.u_ActiveDragRailID = -1;
        this.draggedSliceIndices = null;
        this.uniforms.u_DraggedSliceIndices = [-1, -1];
        this.dragOffset = -1;
        this.activeDrag = false;
    }

    isDragActive() {
        return this.activeDrag;
    }

    dragActiveSlicesAlongAxis(newOffset) {
        if (!this.draggedSliceIndices) {
            console.error("No slices selected");
            return;
        }

        let deltaOffset = newOffset - this.dragOffset;

        for (let sliceID of this.draggedSliceIndices) {
            this.uniforms.u_SliceOffsets[sliceID] += deltaOffset;
            this.uniforms.u_SliceOffsets[sliceID] = clamp01(this.uniforms.u_SliceOffsets[sliceID]);
        }

        this.dragOffset = newOffset;
    }

    removeSlice(id) {
        this.uniforms.u_SliceOffsets[id] = -1;
        let normal = this._getNormal(id);
        this.qCounts[normal]--;
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
    }
}
