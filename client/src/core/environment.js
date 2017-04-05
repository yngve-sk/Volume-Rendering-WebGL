let ViewManager = require('../core/views/view-manager');
let DatasetManager = require('../datasets&selections/dataset-manager');
let LinksAndLayout = require('../widgets/split-view/view-splitter-master-controller');

let modes = require('./interaction-modes'),
    Interactions = modes.Interactions,
    CameraModes = modes.CameraModes;

let TransferFunctionManager = require('../widgets/transfer-function/transfer-function-manager');
let TransferFunction = require('../widgets/transfer-function/transfer-function');

let WSClient = require('../client2server/websocket-client');

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

        this.ViewManager = new ViewManager(this, LinksAndLayout.getAddRemoveView);
        this.TransferFunctionManager = new TransferFunctionManager(this);

        this.GlobalOverrideLocals = {
            'TransferFunction': false,
            'Selection': false,

        }

        this.listeners = {
            TFModelDidChange: { // channel
                'GLOBAL': null, // handle
                'LOCAL': null
            },
            DatasetDidChange: {
                'GLOBAL': null,
                'LOCAL': null
            }
        }

        // Using arrow func to always have this. be the this. of __THIS CONTEXT__
        // Same as passing this.func.bind(this) as a callback but less verbose

        // called when a link group for the given property changes
        this.notifyLinkChanged = (propertyKey) => {
            console.log("ENV, link changed @ propertyKey " + propertyKey);
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

        this.notifyDatasetWasLoaded = (name, header, isovalues) => {
            console.log("notifyDatasetWasLoaded!");
            this.DatasetManager.addDataset({
                name: name,
                header: header,
                isovalues: isovalues
            });

            // For now pretend only one dataset will be loaded at a time.
            this._notifyListeners('DatasetDidChange', 'LOCAL');
            this._notifyListeners('DatasetDidChange', 'GLOBAL');
        }

        this.readyElements = []; // Expect call from:
        // LinksAndViewsController, TransferFunctionController
    }

    ready(from) {
        console.log("READY from " + from);
        this.readyElements.push(from);

        if (this.readyElements.length === 2) {
            this.ViewManager.syncWithLayout();
        }
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
        this.TransferFunctionManager.addTransferFunction(id);
        console.log(this.TransferFunctionManager.tfs);
        console.log(this.ViewManager.subviews);
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
        this.ViewManager.removeView(id);
        this.TransferFunctionManager.removeTransferFunction(id);
        console.log(this.TransferFunctionManager.tfs);
        console.log(this.ViewManager.subviews);
    }



    /**
     * Gets the transfer function object given the cell ID.
     * Called when a 3D view is selected, the local TF view will be
     * linked to the given TF.
     *
     * @param {number} cellID - the ID of the cell
     * @returns {module:Widgets/TransferFunction~TransferFunction} The transfer function object belonging to the master cell ID.
     */
    getTransferFunctionForViewWithCellID(cellID) {
        if (this.GlobalOverrideLocals['TransferFunction'])
            return this.TransferFunctionManager.getTransferFunction('GLOBAL');

        let masterID = this.links.getMasterCellIDForProperty('TransferFunction', cellID);

        return this.TransferFunctionManager.getTransferFunction(masterID);
    }

    /* Find the cell ID associated to the TF */
    getHistogramForTFEditor(tfEditorKey) {
        // 1. Find out which cell ID the TF editor is pointing to
        let cellID = this.TransferFunctionManager.getReferencedCellIDForTFKey(tfEditorKey);

        return this.DatasetManager.getHistogramForCellID(cellID);
    }

    getHistogramSelectionsForTFEditor(tfEditorKey) {
        let cellID = this.TransferFunctionManager.getReferencedCellIDForTFKey(tfEditorKey);

        return this.DatasetManager.getHistogramSelectionForCellID(cellID);
    }

    get3DViewSelectionsHistogramForTFEditor(tfEditorKey) {
        let cellID = this.TransferFunctionManager.getReferencedCellIDForTFKey(tfEditorKey);

        return this.DatasetManager.getViewSelectionForCellID(cellID);
    }

    getTransferFunctionForTFEditor(tfEditorKey) {
        this.TransferFunctionManager.test();
        return this.TransferFunctionManager.getTransferFunctionForTFEditorKey(tfEditorKey);
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
        this.listeners[channel][key]();
    }


}

let env = new Environment();
window.TheEnvironment = env; // For debugging
module.exports = env; //new Environment();
