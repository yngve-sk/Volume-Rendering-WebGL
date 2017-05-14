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

        // sorts is in ascending order, and returns the new index of
        // the input index

        this.colorGradient = new ColorGradient([{
            color: '#ffffff',
            offset: 10.0
        }, {
            color: '#000000',
            offset: 20.0
        }]);

        this.opacityAxis = null;

        // REMEMBER TO BIND THIS WHEN ACCESSING IT FROM A TF-EDITOR.
        this.splines = null; // d3.line with curve, used for interpolation

        this.curve = d3.curveLinear();

        this.gradientMagnitudeWeighting = 0;
        this.overallOpacity = 0;
        this._applyCustomFuncs();
    }

    _applyCustomFuncs() {
        this.controlPoints.sortPreserve = (preserveIndex) => {
            let preserveValue = this.controlPoints[preserveIndex];
            this.controlPoints.splice(preserveIndex, 1);

            this.controlPoints.sort((a, b) => {
                return a[0] - b[0];
            });

            // Insert old value

            let didInsert = false;
            let newIndex = -1;

            for (let i = 0; i < this.controlPoints.length; i++) {
                if (this.controlPoints[i][0] >= preserveValue[0]) {
                    // Insert!
                    this.controlPoints.splice(i, 0, preserveValue);
                    didInsert = true;
                    newIndex = i;
                    break;
                }
            }

            if (!didInsert) {
                this.controlPoints.push(preserveValue);
                newIndex = this.controlPoints.length - 1;
            }

            return newIndex;
        }

        this.controlPoints.insert = (elem) => {
            this.controlPoints.push(elem);
            this.controlPoints.sortPreserve(this.controlPoints.length - 1);
        }

        this.controlPoints.toBottom = function (i) {
            this[i][1] = 0;
        }
    }

    applyPresetFromJSON(preset) {
        for (let attrib in preset) {
            this[attrib] = preset[attrib];
        }

        // re-apply custom funcs (quick fix, should do smt more "proper" than this shitty design)
        this._applyCustomFuncs();
    }
}

module.exports = TransferFunction;
