let MouseHandler = require('../mouse-handler');
let Models = require('../linkable-models').Models;
let GetInteractionMode = require('../interaction-modes-v2').getInteractionModeGetterForCategory('Volume');

class VolumeEventHandlerDelegate {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.modelSyncManager = viewManager.modelSyncManager;

        this.mouseHandler = new MouseHandler({
            clickTimeout: 150
        });

        this._bindMouseHandler();
        this.activeSubviewID = 0;
    }

    // Events to bind...
    // Left drag ONLY
    // Mouse enter ->
    _bindMouseHandler() {
        this.mouseHandler.on('mouseenter', null, (state) => {
            // Render picking buffer for given subviewID
        });

        this.mouseHandler.on('mouseout', null, (state) => {

        });

        this.mouseHandler.on('click', 'left', (state) => {
            let interactionMode = GetInteractionMode();

            switch (interactionMode) {
                case 'select-point':
                    break;
                case 'select-ray':
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

        let getCamera = () => {
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, this.activeSubviewID);
        }

        let update = () => {

            this.viewManager.notifyNeedsUpdateForModel(Models.CAMERA.name, this.activeSubviewID, ['Volume', 'Slicer']);
            this.viewManager.requestAnimationFrame();
        }

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
                    getCamera().rotate(state.dx, state.dy);
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
