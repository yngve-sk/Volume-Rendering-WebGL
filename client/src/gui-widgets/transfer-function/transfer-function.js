let d3 = require('d3');

let TransferFunctionOptions = require('./transfer-function-options');
let TFSO = require('./transfer-function-selection-options'),
    TransferFunctionSelectionOptions = TFSO.Constructor,
    TFSOVisibility = TFSO.Visibility;

let ColorGradient = require('./color-gradient');

class TransferFunction {
    constructor() {
        //        this.options = new TransferFunctionOptions();
        // 1D color gradient axis
        this.controlPoints = [];
        this.colorGradient = new ColorGradient();

        this.opacityAxis = null;

        // REMEMBER TO BIND THIS WHEN ACCESSING IT FROM A TF-EDITOR.
        this.splines = null; // d3.line with curve, used for interpolation

        // 1D opacity axis

        // Gradient x opacity control points

        this.selectionOptions = new TransferFunctionSelectionOptions();
        this.histogramValues = null; // Will be a reference to the dataset from server.
        this.selection = null; // Will also be a reference

        this.curve = d3.curveLinear();
    }

    get2DTexture32FPrecision() {
        let isoToColor = new Float32Array(255),
            isoToOpacity = new Float32Array(255);

        // for now no need for splines, cause 1D!
        for (let i = 0; i < isoToColor.length; i++) {

        }
    }

    get2DTextureMaxPrecision() {
        let isoToColor = new Array(255),
            isoToOpacity = new Array(255);

        for (let i = 0; i < isoToColor.length; i++) {
            // Sample from the css color gradient
        }
    }
}

module.exports = TransferFunction;
