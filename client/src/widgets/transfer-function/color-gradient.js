let tinycolor = require('tinycolor2');
/** Represents a color gradient consisting of control points
 * @class
 * @memberof module:Widgets/TransferFunction
 */
class ColorGradient {


    /**
     * Constructs a new color gradient with given initial control points.
     *
     *
     * @param {module:Widgets/TransferFunction.CGControlPoint[]} Array of control points, may be empty
     * @constructor
     * @memberof module:Widgets/TransferFunction

     */
    constructor(controlPoints) {
        //this.gradient = []; // Format: [{offset: n, color: color}], offset is between 0 and 100
        this.gradient = [];
    }




    /**
     * Represents one control point.
     * @typedef {Object} CGControlPoint
     * @property {string} color - Color of the control points, as HEX
     * @property {number} offset - offset of the control point, must be in range [0,100].
     * @memberof module:Widgets/TransferFunction
     */


    /**
     * Adds a control point and returns the array index
     *
     * @param {module:Widgets/TransferFunction.CGControlPoint} Point - The control point
     * @returns {number} The index of the control point
     *
     */
    addControlPoint(point) {
        let index = this._findInsertionIndexForOffset(point.offset);
        this.gradient.splice(index, 0, {
            color: point.color,
            offset: point.offset
        });

        return index;
    }

    /**
     * Removes a control point, given offset
     *
     * @param {number} offset - the offset, must be [0,100] and existing
     * @returns {bool} true if offset was deleted
     */
    removeControlPoint(offset) {
        let deletionPoint = this._findInsertionIndexForOffset(offset);

        if (deletionPoint !== -1) {
            this.removeControlPointAtIndex(deletionPoint);
            return true;
        }

        return false;
    }


    /**
     *
     * @param {number} index - Index of the control point
     */
    removeControlPointAtIndex(index) {
        this.gradient.splice(index, 1);
    }

    /**
     * Changes the color for control point at given index
     *
     * @param {number} index
     * @param {string} newColor - the color
     */
    setColorAt(index, newColor) {
        if (index < 0)
            return;
        this.gradient[index].color = newColor;
    }

    /**
     * Moves the control point at given index to the
     * new offset
     *
     * @param {number} index - the current index of the control point
     * @param {number} newOffset - the offset to move it to
     * @returns {number} the new index of this control point
     */
    moveControlPoint(index, newOffset) {
        if (index < 0)
            return;

        let elem = this.gradient[index];
        this.gradient.splice(index, 1);

        return this.addControlPoint({
            color: elem.color,
            offset: newOffset
        });
    }

    _findFirstIndexBiggerThan(offset) {
        let index = -1;
        for (let i = 0; i < this.gradient.length; i++) {
            if (this.gradient[i].offset >= offset) {
                index = i;
                break;
            }
        }

        return index;
    }

    _findInsertionIndexForOffset(offset) {
        if (this.gradient.length === 0)
            return 0;

        for (let i = 0; i < this.gradient.length; i++) {
            if (this.gradient[i].offset > offset)
                return i;
        }
        return this.gradient.length;
    }
}

module.exports = ColorGradient;
