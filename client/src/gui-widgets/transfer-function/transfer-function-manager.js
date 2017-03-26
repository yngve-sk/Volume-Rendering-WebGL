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

        this.canvasPointers = {

        }
    }

    checkNeedsUpdate(key) {
        if (this.needsUpdate[key]) {
            this.needsUpdate[key] = false;
            return true;
        }
        return false;
    }

    notifyDiscreteTFDidChange(key) {
        this.needsUpdate[key] = true;
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
        return this.canvasPointers[key];
    }


    notifyTFPointsToCanvasWithID(key, ngid) {
        console.log("Bind!");
        if (!this.canvasPointers[key])
            this.canvasPointers[key] = document.querySelector('.tf-editor-background-canvas.ng-id' + ngid);
    }

}

module.exports = TransferFunctionManager;
