let TransferFunctionOptions = require('./transfer-function-options');
let TFSO = require('./transfer-function-selection-options'),
    TransferFunctionSelectionOptions = TFSO.Constructor,
    TFSOVisibility = TFSO.Visibility;

class TransferFunction {
    constructor() {
//        this.options = new TransferFunctionOptions();
        // 1D color gradient axis

        // 1D opacity axis

        // Gradient x opacity control points

        this.selectionOptions = new TransferFunctionSelectionOptions();
        this.histogramValues = null; // Will be a reference to the dataset from server.
        this.selection = null; // Will also be a reference
    }
}

module.exports = TransferFunction;
