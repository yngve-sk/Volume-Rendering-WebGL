let d3 = require('d3');

let ColorGradient = require('./color-gradient');


/**
 * Represents a transfer function, holding a color gradient
 * and an opacity gradient. Note: Interpolation happens in the editor
 * and WebGL reads the texture directly from the canvas.
 * @class TransferFunction
 * @memberof module:Widgets/TransferFunction
 */
class TransferFunction {
    constructor() {
        //        this.options = new TransferFunctionOptions();
        // 1D color gradient axis
        this.controlPoints = [];
        this.colorGradient = new ColorGradient();

        this.opacityAxis = null;

        // REMEMBER TO BIND THIS WHEN ACCESSING IT FROM A TF-EDITOR.
        this.splines = null; // d3.line with curve, used for interpolation

        this.curve = d3.curveLinear();
    }
}

module.exports = TransferFunction;
