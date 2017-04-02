let TransferFunction = require('./transfer-function');
/* Manages multiple transfer functions. It handles...
    - Linking and unlinking of TFs across views
    - Creating and destroying new TFs as views are created
    - Keeping track of multiple discrete TFs, serving them
      when needed
*/

/** @module Widgets/TransferFunction */


/**
 * Manages multiple transfer function objects.
 */
class TransferFunctionManager {


    /**
     * Constructs a new TF manager
     * @param {module:Environment~Environment} environment - A reference to the environment for 2-way communication
     * @constructor
     */
    constructor(environment) {
        this.env = environment;

        this.tfs = {
            GLOBAL: new TransferFunction(),
            0: new TransferFunction(), // Default inital settings
            1: null,
            2: null
        };

        this.needsUpdate = {
            'GLOBAL': false
        };

        this.textureBounds = {
            'GLOBAL': null
        };

        this.canvasPointers = {

        };

        this.activeEditorTFs = {
            'GLOBAL': 'GLOBAL',
            'LOCAL': 0 // default
        };

        this.globalOverrideLocal = false; // write from control panel
    }

    /**
     * Gets the cell ID referenced by the TF editor
     *
     * @param {string} tfEditorKey - 'GLOBAL' or 'LOCAL'
     * @returns {string|number} - if 'GLOBAL', will simply return 'GLOBAL'
     * since the global TF editor is always editing its own TF, otherwise
     * it'll return an actual cell
     */
    getReferencedCellIDForTFKey(tfEditorKey) {
        return this.activeEditorTFs[tfEditorKey];
    }


    /**
     * Check if a TF texture needs to be for given cell.
     * @param {number} cellID - the ID of the cell
     *
     * Note: Only functions being actively edited can trigger changes,
     * hence the cellID will only be updated if its TF was recently
     * edited in the TF editor.
     */
    checkNeedsUpdateCellID(cellID) {
        if (this.globalOverrideLocal)
            return this._checkNeedsUpdateEditorKey('GLOBAL');
        else if (this.activeEditorTFs['LOCAL'] === cellID)
            return this._checkNeedsUpdateEditorKey('LOCAL');
        return false;
    }

    _checkNeedsUpdateEditorKey(key) {
        if (this.needsUpdate[key]) {
            this.needsUpdate[key] = false;
            return true;
        }
        return false;
    }

    /**
     * Notify the TF manager that the transfer function did change.
     * Will be called from the TF editor any time the texture does change
     *
     * @param {string} key - the transfer function key, 'LOCAL' or 'GLOBAL'
     * @param {module:Widgets/TransferFunction.TextureBounds} textureBounds - The texture bounds, passed in as a convenience. Will be returned when views get the texture bound via {@link getCanvasForTFKey}
     */
    notifyDiscreteTFDidChange(key, textureBounds) {
        this.needsUpdate[key] = true;
        this.textureBounds[key] = textureBounds;
    }

    /**
     * Adds a transfer function
     *
     * @param {string|number} key - The cell ID, can be a number between [0, numCells - 1] OR 'GLOBAL' which is the global transfer function.
     *
     */
    addTransferFunction(id) {
        this.tfs[id] = new TransferFunction();
    }


    /**
    * Deletes the given TF from memory. PS do not ever delete the GLOBAL
    * one, shouldn't ever happen.
    *
    * @param {number} id - the cell ID
    */
    removeTransferFunction(id) {
        delete this.tfs[id];
    }

    test() {
        console.log("Hi!");
    }

    /**
     * Gets the transfer function given the key
     *
     * @param {string} key - the TF, 'LOCAL' or 'GLOBAL'
     * @param {d3.curve} (optional) Sets the d3 curve style
     */
    getTransferFunctionForTFEditorKey(tfEditorKey, splines) {
        let active = this.activeEditorTFs[tfEditorKey];

        let tf = this.tfs[active];

        if (splines)
            tf.splines = splines;

        return this.tfs[active];
    }


    /**
     * Gets the canvas and the texture bounds, used to fetch
     * the canvas and load it into the GPU as a texture.
     *
     * @param {Object} key - the TF key - 'LOCAL' or 'GLOBAL'
     */
    getCanvasForTFKey(key) {
        return {
            canvas: this.canvasPointers[key],
            textureBounds: this.textureBounds[key]
        };
    }


    /**
     * Called each time a TF editor is created. Called after
     * the TF editor is done compiling, will link the canvas
     * to the TF ID.
     *
     * @param {string} key - the TF key, 'LOCAL' or 'GLOBAL'
     * @param {number} ngid - the angular $scope$id of the view, used to identify it
     */
    notifyTFPointsToCanvasWithID(key, ngid) {
        console.log("Bind!");
        if (!this.canvasPointers[key])
            this.canvasPointers[key] = document.querySelector('.tf-editor-background-canvas.ng-id' + ngid);
    }

}

module.exports = TransferFunctionManager;
