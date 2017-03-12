class ControlPointFunction {
    constructor() {
        this.controlPoints = []; // format: [{x: _, y: _}], sorted by x
    }

    addControlPoint(x, y) {
        let index = _findIndexOfFirstPointWithXGreaterThan(x);
        this.controlPoints.splice(index, 0, {
            x: x,
            y: y
        });
    }

    _interpolate() {

    }

    _findIndexOfFirstPointWithXGreaterThan(x) {
        let index = 0;
        for (let i = 0; i < this.controlPoints.length; i++) {
            if (this.controlPoints[i].x > x) {
                index = i;
                break;
            }
        }

        return index;
    }
}

module.exports = ControlPointFunction;
