let tinycolor = require('tinycolor2');
// Only represents an array of colors, does not do any rendering whatsoever.
// Will provide interpolation and datapoints only.

class ColorGradient {
    constructor() {
        //this.gradient = []; // Format: [{offset: n, color: color}], offset is between 0 and 100
        this.gradient = [{
            color: "#ffffff",
            offset: 0
        }, {
            color: "#ffffff",
            offset: 5.737657728707146
        }, {
            color: "#cb4f4f",
            offset: 16.334571271668626
        }, {
            color: "#000000",
            offset: 30.85626910550536
        }, {
            color: "#1500e4",
            offset: 46.5554002802631
        }, {
            color: "#84cb4f",
            offset: 59.899661778807186
        }, {
            color: "#cb4f4f",
            offset: 87.76561961400219
        }, {
            color: "#cb4f4f",
            offset: 100
        }];
    }

    toGLSLGradientPaletteFormat() {
        let result = [];

        for (let obj of this.gradient) {
            let tiny = tinycolor(obj.color);
            let rgb = tiny.toRgb();
            result.push([obj.offset / 100, [rgb.r / 255, rgb.g / 255, rgb.b / 255]]);
        }

        return result;
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
