let TransferFunctionOptions = require('./transfer-function-options');
let TransferFunctionSelectionOptions = require('./transfer-function-selection-options');

class TransferFunction {
    constructor() {
        this.options = new TransferFunctionOptions();

        this.selectionOptions = new TransferFunctionSelectionOptions();
        this.selection = []; // [x0, x1], possibly fetch values from server
        this.histogramValues = []; // {[x, y]}, sampling rate set @ server
    }
}
