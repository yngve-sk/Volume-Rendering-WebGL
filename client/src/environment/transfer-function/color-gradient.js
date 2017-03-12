// Only represents an array of colors, does not do any rendering whatsoever.
// Will provide interpolation and datapoints only.

class ColorGradient {
    constructor() {
        this.gradient = []; // Format: [{color, location}], location is between 0 and 100
        this.controlPoints = new ControlPointFunction();
    }

    /* Return false if fail */
    addControlPoint(color, location) {
        let insertionPoint = _findFirstIndexBiggerThan(location);

        if (insertionPoint !== -1) {
            this.gradient.splice(insertionPoint, 0, {
                color: color,
                location: location
            });
            return true;
        }

        return false;
    }

    /* Return true if success */
    removeControlPoint(location) {
        let deletionPoint = _findFirstIndexBiggerThan(location);

        if (i !== -1) {
            this.gradient.splice(deletionPoint, 1);
            return true;
        }

        return false;
    }

    _findFirstIndexBiggerThan(location) {
        let index = -1;
        for (let i = 0; i < this.gradient; i++) {
            if (this.gradient[i].location === location) {
                index = i;
                break;
            }
        }

        return index;
    }

    // Simple linear interpolation
    getColorAtLocation(location) {
        let i1 = _findFirstIndexBiggerThan(location);
        if (i1 === 0)
            return this.gradient[0].color;

        let i0 = i1 - 1;

        let i0Loc = this.gradient[i0].location,
            i1Loc = this.gradient[i1].location;

        let i0_i1 = i1Loc - i0Loc,
            i0_this = (location - i0Loc) / i0_i1,
            this_i1 = 1 - i0_this;

        // blend

        let i0Color = this.gradient[i0].color,
            i1Color = this.gradient[i1].color;

        return i0_this * i0Color + this_i1 * i1Color;
    }
}

module.exports = ColorGradient;
