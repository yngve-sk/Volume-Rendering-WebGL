let MouseHandler = require('../mouse-handler');
let Models = require('../all-models').Models;
let GetInteractionMode = require('../interaction-modes-v2').getInteractionModeGetterForCategory('Volume');

let twgl = require('twgl.js');
let v3 = twgl.v3;

let displayFBImageFromFramebuffer = require('../debug-fb-to-canvas').displayFBImageFromFramebuffer;


class VolumeEventHandlerDelegate {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.modelSyncManager = viewManager.modelSyncManager;

        this.mouseHandler = new MouseHandler({
            clickTimeout: 150
        });

        this._bindMouseHandler();
        this.activeSubviewID = 0;

        this.pickingbufferNeedsUpdate = false;

        this.refreshPB = () => {
            this.viewManager.renderVolumePickingBuffer(this.activeSubviewID);
            this.viewManager.pickingBufferManager.refreshBuffer('Volume', 'debugcanvas1');
            this.viewManager.pickingBufferManager.refreshBuffer('VolumeBackface', 'debugcanvas2');
        }

        this.getModelXYZFromMouse = (mx, my) => {
            let rgba = this.viewManager.pickingBufferManager.readPixel('Volume', mx, my);

            return [
                rgba[0] / 255.0,
                rgba[1] / 255.0,
                rgba[2] / 255.0
            ];
        }

        this.getModelBackfaceXYZFromMouse = (mx, my) => {
            let rgba = this.viewManager.pickingBufferManager.readPixel('VolumeBackface', mx, my);

            return [
                rgba[0] / 255.0,
                rgba[1] / 255.0,
                rgba[2] / 255.0
            ];
        }

        this.getRayInfoFromMouse = (mx, my) => {
            // 1. Get camera eye position, is in world coords
         /*   let eye = this.viewManager.modelSyncManager.getActiveModel(Models.CAMERA.name, this.activeSubviewID).getEyePosition();
            */

            let start = this.getModelXYZFromMouse(mx, my),
                end = this.getModelBackfaceXYZFromMouse(mx, my);/*

            // 2. Get XYZ position of mouse click, is in model coords (0,1)
            let xyz = this.getModelXYZFromMouse(mx, my);

            // 3. Transform eye pos into model coord space
            // World2model: [-1,1] to [0,1]
            // Divide by BB, and add 0.5
            let nbb = this.viewManager.uniformManagerVolume._getSharedUniform('u_BoundingBoxNormalized');

            let eyeModelCoords = v3.add(v3.divide(eye, nbb), v3.create(0.5, 0.5, 0.5));
*/
            // 3. Shoot from first-hit
            //let rayDirN = v3.normalize(v3.subtract(xyz, eyeModelCoords));

            let rayDir = v3.normalize(v3.subtract(end, start));


            return {
                start: start,
                direction: rayDir
            };

        }

    }

    // Events to bind...
    // Left drag ONLY
    // Mouse enter ->
    _bindMouseHandler() {

         let getCamera = () => {
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, this.activeSubviewID);
        }

        let update = () => {

            this.viewManager.notifyNeedsUpdateForModel(Models.CAMERA.name, this.activeSubviewID, ['Volume', 'Slicer']);
            this.viewManager.requestAnimationFrame();
        }

        this.mouseHandler.on('mouseenter', null, (state) => {
            // Render picking buffer for given subviewID
            this.refreshPB();
        });

        this.mouseHandler.on('mouseout', null, (state) => {

        });

        this.mouseHandler.on('click', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'select-point':
                    let point = this.getModelXYZFromMouse(state.x, state.y);
                    this.viewManager.selectionManager.selectPoint(point);
                    this.viewManager.renderSelectedPoints();
                    displayFBImageFromFramebuffer(
                        this.viewManager.masterContext, this.viewManager.FBAndTextureManager.getFrameBuffer('PointProjectionTexture'),
                        512, 512,
                        'debugcanvas2'
                    );
                    break;
                case 'select-ray':
                    let ray = this.getRayInfoFromMouse(state.x, state.y);
                    this.viewManager.selectionManager.selectRay(ray);
                    this.viewManager.renderVolumeRay(this.activeSubviewID);
                    /*displayFBImageFromFramebuffer(
                        this.viewManager.masterContext,
                        this.viewManager.FBAndTextureManager.getFrameBuffer('RayProjectionTexture'),
                        512, 512,
                        'debugcanvas2'
                    );*/

                    break;
                default:
                    break;
            }
        });



        this.mouseHandler.on('mousedown', 'left', (state) => {
            let interactionMode = GetInteractionMode();
            switch (interactionMode) {
                case 'measure':
                    // Start measure
                    break;
                default:
                    break;
            }
        });

        this.mouseHandler.on('drag', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'move':
                    getCamera().pan(state.dx, state.dy);
                    update();
                    break;
                case 'zoom':
                    getCamera().zoom(state.dx + state.dy);
                    update();
                    break;
                case 'rotate':
                    console.log("Rotate!");
                    getCamera().rotate(state.dx, state.dy, state.x, state.y);
                    update();
                    break;

                case 'measure':
                    // Where to store the "measure" cache?
                    // To store: Start point, end point
                    break;
                default:
                    break;
            }
        });

        this.mouseHandler.on('mouseup', 'left', (state) => {
            let interactionMode = GetInteractionMode();
            switch (interactionMode) {
                case 'measure':
                    // end measure
                    break;
                default:
                    break;
            }

            this.refreshPB();
        });

        this.mouseHandler.on('mousemove', 'left', (state) => {

        });

    }

    handle(event, subviewID) {
        this.activeSubviewID = subviewID;
        this.mouseHandler.handle(event);
    }

}

module.exports = VolumeEventHandlerDelegate;
