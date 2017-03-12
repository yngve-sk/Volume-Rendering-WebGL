let ColorGradient = require('./color-gradient');
let ControlPointFunction = require('./control-point-function');


class TransferFunctionOptions {
    constructor() {
        this.colorGradient = new ColorGradient();
        this.controlPoints = new ControlPointFunction();

        // stored as 0 to 1 for fastest lookup
        this.curvatureScale = 0;
        this.gradientMagnitudeScale = 0;
    }
}

module.exports = TransferFunctionOptions;
