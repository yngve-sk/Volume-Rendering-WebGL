let ViewManager = require('../core/views/view-manager');
let DatasetManager = require('../datasets&selections/dataset-manager');
let LinksAndLayout = require('../widgets/split-view/view-splitter-master-controller');

let modes = require('./interaction-modes'),
    Interactions = modes.Interactions,
    CameraModes = modes.CameraModes;

let Models = require('./all-models').Models;

//let TransferFunction = require('../widgets/transfer-function/transfer-function');

let WSClient = require('../client2server/websocket-client');


let MODEL2LISTENERKEY = {
                [Models.TRANSFER_FUNCTION.name]: 'TFModelDidChange',
                [Models.CAMERA.name]: 'CameraModelDidChange',
                [Models.LIGHTS.name]: 'LightModelDidChange',
                [Models.THRESHOLDS.name]: 'TFModelDidChange', // Same local subview
                [Models.SELECTION_DISPLAY.name]: 'SelectionDisplayModelDidChange'
};

/** @module Core/Environment */

/**
 * Represents the environment of the volume renderer and all its widgets.
 * This object encapsulates the entire thing and is also a proxy for
 * communication between all the objects.
 */
class Environment {
    /**
     * Constructs a new environment
     * @constructor
     */
    constructor() {
        this.DatasetManager = new DatasetManager();

        // If a link changes there's no need to pingback, it'll only affect the
        // rendering, which reads the link for every frame anyway.
        this.links = LinksAndLayout.read().links; // Reads links from the linker widget

        // If layout changes, the view manager must be notified and adjust accordingly
        // The links must also be refreshed because a view may be obsolete.
        this.layout = LinksAndLayout.read().layout; // Reads layout from view splitter

        this.SelectSubview = LinksAndLayout.write().Select;
        this.SetViewType = LinksAndLayout.write().SetViewType;

        this.ViewManager = null; // Depends on links&view view

        this.tfEditors = {
            'GLOBAL': {
                editor: null,
                canvas: null
            },
            'LOCAL': {
                editor: null,
                canvas: null
            },
        };

        this.listeners = {
            LocalSubviewDidChange: (id) => {
                console.log("Subview changed!")
            },
            TFModelDidChange: { // channel
                'GLOBAL': null, // handle
                'LOCAL': null
            },
            DatasetDidChange: {
                'GLOBAL': null,
                'LOCAL': null
            },
            CameraModelDidChange: {
                'GLOBAL': null,
                'LOCAL': null
            },
            LightModelDidChange: {
                'GLOBAL': null,
                'LOCAL': null
            },
            SelectionDisplayModelDidChange: {
                'GLOBAL': null,
                'LOCAL': null
            }
        };

        this.modelGetters = {
            TFModelDidChange: (name) => {
                return {
                    TRANSFER_FUNCTION: this.ViewManager.getModelObjectForEditor(Models.TRANSFER_FUNCTION, name),
                    THRESHOLDS: this.ViewManager.getModelObjectForEditor(Models.THRESHOLDS, name)
                };
            },
            DatasetDidChange: (name) => {
                let dataset = this.DatasetManager.getDataset('GLOBAL');
                let histogram = dataset.histogram;

                // TF Editor doesn't need anything other than histo
                return {
                    histogram: histogram
                };
            },
            CameraModelDidChange: (name) => {
                return this.ViewManager.getModelObjectForEditor(Models.CAMERA, name);
            },
            LightModelDidChange: (name) => {
                return this.ViewManager.getModelObjectForEditor(Models.LIGHTS, name);
            },
            SelectionDisplayModelDidChange: (name) => {
                return this.ViewManager.getModelObjectForEditor(Models.SELECTION_DISPLAY, name);
            }
        };



        // Using arrow func to always have this. be the this. of __THIS CONTEXT__
        // Same as passing this.func.bind(this) as a callback but less verbose

        // called when a link group for the given property changes
        this.notifyLinkChanged = (propertyKey) => {
            console.log("LINK CHANGED!");
            console.log(propertyKey);

            this.ViewManager.linkChanged(propertyKey);

            let modelChangeListenerKey = MODEL2LISTENERKEY[propertyKey];
            // Notify local subview to refresh
            // If it doesnt exist there is no subview i.e no need to update
            if (modelChangeListenerKey)
                this._notifyListeners(modelChangeListenerKey, 'LOCAL');
        }

        this.notifyIsoThresholdChanged = (editorName, newMin, newMax) => {
            console.log("this.notifyIsoThresholdChanged(" + editorName + ", " + newMin + ", " + newMax + ")");
            this.ViewManager.notifyIsoThresholdDidChange(editorName, newMin, newMax);
        }

        this.notifyModelPointsToGlobalChanged = (modelName, pointToGlobal) => {
            this.ViewManager.setModelPointsToGlobal(modelName, pointToGlobal);
        }

        // called when the layout changes
        this.notifyLayoutChanged = (event) => {
            //console.log("layoutDidChange(" + event + ")");
            switch (event.action) {
                case 'CELL_ADDED':
                    this._initNewView(event.id);
                    break;
                case 'CELL_REMOVED':
                    this._removeView(event.id);
                    break;
                default:
                    console.error("Unknown event action...");
                    console.error(event);
                    break;
            }
        }

        this.notifyViewTypeChanged = (cellID, newType) => {
            this.ViewManager.notifyViewTypeChanged(cellID, newType);
            let LocalControllerSubview = this.ViewManager.localControllerSelectedSubviewID;

            if (LocalControllerSubview === cellID) {
                this.ViewManager.notifyTransferFunctionDidChangeAtEditor('LOCAL');
                this.SelectSubview(cellID);
            } else { // TF needs manual update to render texture and all that.
                setTimeout(() => {
                    this.SelectSubview(cellID);
                    setTimeout(() => {
                        this.SelectSubview(LocalControllerSubview);
                    }, 1000)
                }, 1000);

                //this.ViewManager.localControllerSelectedSubviewID = cellID;
                //this.ViewManager.notifyTransferFunctionDidChangeAtEditor('LOCAL');
                //this.ViewManager.localControllerSelectedSubviewID = LocalControllerSubview;
            }
        }

        this.notifyLocalControllerTargetSubviewIDDidChange = (newTarget) => {
            this.ViewManager.notifyLocalControllerSelectionDidChange(newTarget);

            // Link TF model to local TF editor
            //this.TransferFunctionManager.setLocalEditorActiveSubview(newTarget);
            this._notifyListeners('TFModelDidChange', 'LOCAL');

            // Link camera model to local camera settings editor
            this._notifyListeners('CameraModelDidChange', 'LOCAL');

            // Link light settings model to local light settings editor
            this._notifyListeners('LightModelDidChange', 'LOCAL');

            // Slicer has no editor, needs no notification

            // Notify selection settings changed
            this._notifyListeners('SelectionDisplayModelDidChange', 'LOCAL');
        }

        this.notifyDatasetWasLoaded = (name, header, isovaluesAndGradientMagnitudes) => {
            console.log("notifyDatasetWasLoaded!");
            this.DatasetManager.addDataset({
                name: name,
                header: header,
                isovalues: isovaluesAndGradientMagnitudes
            });

            this.tfEditors.GLOBAL.editor.setHistogram(header.histogram);
            this.tfEditors.LOCAL.editor.setHistogram(header.histogram);

            this.ViewManager.notifyDatasetDidChange();

            // For now pretend only one dataset will be loaded at a time.
            this._notifyListeners('DatasetDidChange', 'LOCAL');
            this._notifyListeners('DatasetDidChange', 'GLOBAL');

            this._notifyListeners('TFModelDidChange', 'GLOBAL');
            this._notifyListeners('TFModelDidChange', 'LOCAL');

            this._notifyListeners('CameraModelDidChange', 'GLOBAL');
            this._notifyListeners('CameraModelDidChange', 'LOCAL');

            this._notifyListeners('LightModelDidChange', 'GLOBAL');
            this._notifyListeners('LightModelDidChange', 'LOCAL');

            this._notifyListeners('SelectionDisplayModelDidChange', 'LOCAL');

            this.notifyLocalControllerTargetSubviewIDDidChange(0);
        }

        this.notifyDatasetWasRead = () => {
            //this.DatasetManager.clearDataset();
        }

        this.readyElements = []; // Expect call from:
        // LinksAndViewsController, TransferFunctionController

        window.addEventListener('keydown', (event) => {
            console.log("Key down: " + event.key);
            switch (event.key) {
                case '1':
                    console.log("Refreshing...");
                    this.ViewManager.refresh();
                    break;
                case '2':
                    this.ViewManager._init();
                    break;
                case '3':
                    break;
                case '4':
                    break;
                case '5':
                    break;
                case '6':
                    break;
                case '7':
                    break;
                case '8':
                    break;
                case '9':
                    break;
                case 'q':
                    break;

            }
        });
    }


    /**
     * Called from a controller when it is done initializing its
     * DOM and underlying model. Some objects need other objects
     * to be initialized, before they themselves can be initialized.
     * This function allows for shimming it.
     *
     * @param {string} from from name of the controller
     * @param {Object} args Varies per object.
     */
    ready(from, args) {
        console.log("READY from " + from);
        this.readyElements.push(from);
        console.log("Num elements = " + this.readyElements.length);

        switch (from) {
            case 'LinksAndViewsController':
                this.ViewManager = new ViewManager(this, LinksAndLayout.getAddRemoveView);
                break;
            case 'TransferFunctionController':
                this.tfEditors[args.name] = {
                    editor: args.editor,
                    canvas: args.canvas
                };
                //this.TransferFunctionManager.setEditor(args);
                break;
            default:
                break;
        }

        // Bind all local controllers to subview 0 initially
        // FIXME get a more reliable way to ensure that all views are initialized
        if (this.readyElements.length >= 10)
            this.notifyLocalControllerTargetSubviewIDDidChange(0);
    }

    /**
     * (Ideally scoped as private)<br>
     * Called whenever a new view is added.
     * Initializes a set of objects related to the view
     * and adds them to the environment!
     *
     * @param {number} id the ID of the view
     */
    _initNewView(id) {
        this.ViewManager.addNewView(id);

        //this.TransferFunctionManager.addTransferFunction(id);
        //console.log(this.TransferFunctionManager.tfs);
        // console.log(this.ViewManager.subviews);
    }

    _updateLocalControls() {
        for (let key in MODEL2LISTENERKEY) {
            this._notifyListeners(MODEL2LISTENERKEY[key], 'LOCAL');
        }
    }

    notifyViewmanagerInitialized() {
        this.SetViewType('Basic', 0);
        this.SelectSubview(0);
    }

    /**
     * (Ideally scoped as private)<br>
     * Called whenever a view is removed.
     * Cleans up and deletes all the stuff associated to that view from the
     * environment.
     *
     * @param {number} id the ID of the view
     */
    _removeView(id) {
        let selectedNeedsUpdate = this.ViewManager.removeView(id);
        if (selectedNeedsUpdate) {
            this._updateLocalControls();
        }

        console.log(this.ViewManager.subviews);
    }

    notifyGradientMagnitudeWeightingChanged(editorKey, newValue) {
        this.ViewManager.notifyGradientMagnitudeWeightingChanged(editorKey, newValue);
    }
    notifyOverallOpacityChanged(editorKey, newValue) {
        this.ViewManager.notifyOverallOpacityChanged(editorKey, newValue);
    }


    notifyClearRay(editorKey) {
        this.ViewManager.notifyClearRay(editorKey);
    }

    notifyClearPoints(editorKey) {
        this.ViewManager.notifyClearPoints(editorKey);
    }

    notifyRayRadiusDidChange(editorKey, newRadius) {
        this.ViewManager.notifyRayRadiusDidChange(editorKey, newRadius);
    }

    notifyPointRadiusDidChange(editorKey, newRadius) {
        this.ViewManager.notifyPointRadiusDidChange(editorKey, newRadius);
    }


    notifyRayDisplayModeDidChange(editorKey, mode) {
        this.ViewManager.notifyRayDisplayModeDidChange(editorKey, mode);
        this._notifyListeners('TFModelDidChange', 'LOCAL');
        this._notifyListeners('LightModelDidChange', 'LOCAL');
    }

    notifyPointDisplayModeDidChange(editorKey, mode) {
        this.ViewManager.notifyPointDisplayModeDidChange(editorKey, mode);
    }

    notifyDiscreteTFDidChange(tfEditorKey, textureBounds) {
        this.tfEditors[tfEditorKey].textureBounds = textureBounds;
    }

    notifyTransferFunctionDidChangeAtEditor(tfEditorKey) {
        this.ViewManager.notifyTransferFunctionDidChangeAtEditor(tfEditorKey);
    }

    notifyNonSelectedOpacityDidChange(editorKey, value01) {
        this.ViewManager.notifyNonSelectedOpacityDidChange(editorKey, value01);
    }

    notifyCameraSettingsDidChangeAtEditor(key, args) {
        this.ViewManager.notifyCameraSettingsDidChangeAtEditor(key, args);
    }

    notifyShowRayDidChange(showRay) {
        this.ViewManager.notifyShowRayDidChange(showRay);
    }

    notifyShowPointsDidChange(showPoints) {
        this.ViewManager.notifyShowPointsDidChange(showPoints);
    }

    notifyLightSettingsDidChangeAtEditor(key, args) {
        this.ViewManager.notifyLightSettingsDidChangeAtEditor(key, args);
    }

    /* Find the cell ID associated to the TF */
    getHistogramForTFEditor(tfEditorKey) {
        let masterCellID = this.ViewManager.getTransferFunctionSubviewIDForTFEditorKey(tfEditorKey);

        return this.DatasetManager.getHistogramForCellID(masterCellID);
    }

    getTFEditorInfo(tfEditorKey) {
        return this.tfEditors[tfEditorKey];
    }

    getHistogramSelectionsForTFEditor(tfEditorKey) {
        let masterCellID = this.ViewManager.getTransferFunctionSubviewIDForTFEditorKey(tfEditorKey);

        return this.DatasetManager.getHistogramSelectionForCellID(masterCellID);
    }

    get3DViewSelectionsHistogramForTFEditor(tfEditorKey) {
        let masterCellID = this.ViewManager.getTransferFunctionSubviewIDForTFEditorKey(tfEditorKey);

        return this.DatasetManager.getViewSelectionForCellID(cellID);
    }

    getTransferFunctionForTFEditor(tfEditorKey) {
        return this.ViewManager.getTransferFunctionForTFEditor(tfEditorKey);
    }

    getActiveDataset(cellID) {
        return this.DatasetManager.getDataset(cellID);
    }

    /**
     * Binds a handle to listen for events at a given channel
     *
     * @param {string} channel - Available channels:<br>
     * 'TFModelDidChange', 'DatasetDidChange' (ez to add more...)
     * @param {string} key - The key of the listener
     * @param {function} handle - callback to be called when appropriate
     * (depends on the nature of the event).
     */
    listen(channel, key, handle) {
        this.listeners[channel][key] = handle;
    }

    _notifyListeners(channel, key) {
        this.listeners[channel][key](this.modelGetters[channel](key));
    }


}

let env = new Environment();
window.TheEnvironment = env; // For debugging
module.exports = env; //new Environment();
