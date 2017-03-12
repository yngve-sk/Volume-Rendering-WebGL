// Only represents an array of colors, does not do any rendering whatsoever.
// Will provide interpolation and datapoints only.

class ColorGradient {
    constructor() {
        this.gradient = []; // Format: [{offset: n, color: color}], offset is between 0 and 100
    }


    /* Return the index */
    addControlPoint(color, offset) {
        let index = this._findInsertionIndexForOffset(offset);
        this.gradient.splice(index, 0, {
            color: color,
            offset: offset
        });

        return index;
    }

    /* Return true if success */
    removeControlPoint(offset) {
        let deletionPoint = this._findInsertionIndexForOffset(offset);

        if (deletionPoint !== -1) {
            this.gradient.splice(deletionPoint, 1);
            return true;
        }

        return false;
    }

    setColorAt(index, newColor) {
        if (index < 0)
            return;
        this.gradient[index].color = newColor;
    }

    /* Returns the new index */
    moveControlPoint(index, newOffset) {
        if (index < 0)
            return;

        let elem = this.gradient[index];
        this.gradient.splice(index, 1);

        return this.addControlPoint(elem.color, elem.offset);
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
        for (let i = 0; i < this.gradient.length; i++) {
            if (this.gradient[i].offset > offset)
                return i;
        }
        return this.gradient.length;
    }
}

module.exports = ColorGradient;
