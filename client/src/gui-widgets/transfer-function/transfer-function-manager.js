let TransferFunction = require('./transfer-function');
/* Manages multiple transfer functions. It handles...
    - Linking and unlinking of TFs across views
    - Creating and destroying new TFs as views are created
    - Keeping track of multiple discrete TFs, serving them
      when needed

*/
class TransferFunctionManager {
    constructor(environment) {
        this.env = environment;

        this.tfs = {

        };

        this.needsUpdate = {
            'GLOBAL': false
        }

        this.textureBounds = {
            'GLOBAL': null
        }

        this.canvasPointers = {

        }
    }

    /**
     * Check if the transfer function given key has updated.
     * If it has, the renderer must re-upload the texture
     * from the canvas to the GPU.
     *
     * @param {string} key - the transfer function key
     * @returns {bool}
     */
    checkNeedsUpdate(key) {
        if (this.needsUpdate[key]) {
            this.needsUpdate[key] = false;
            return true;
        }
        return false;
    }

    /**
     * Notify the TF manager that the transfer function did change.
     *
     * @param {string} key
     */
    notifyDiscreteTFDidChange(key, textureBounds) {
        this.needsUpdate[key] = true;
        this.textureBounds[key] = textureBounds;
    }

    addTransferFunction(key) {
        this.tfs[key] = new TransferFunction();
    }

    getTransferFunction(key, splines) {
        let tf = this.tfs[key];

        if (splines)
            tf.splines = splines;

        return this.tfs[key];
    }

    getCanvasForTFKey(key) {
        return {
            canvas: this.canvasPointers[key],
            textureBounds: this.textureBounds[key]
        };
    }


    notifyTFPointsToCanvasWithID(key, ngid) {
        console.log("Bind!");
        if (!this.canvasPointers[key])
            this.canvasPointers[key] = document.querySelector('.tf-editor-background-canvas.ng-id' + ngid);
    }

}

module.exports = TransferFunctionManager;
