class Thresholds {
    constructor() {
        this.minmax = [0, 4095];
    }

    setMin(min) {
        this.minmax[0] = min;
    }

    setMax(max) {
        this.max[1] = max;
    }

    setMinMax(min, max) {
        this.minmax[0] = min;
        this.minmax[1] = max;
    }

    getMinMaxInt16() {
        return [
            this.minmax[0] * 8,
            this.minmax[1] * 8
        ];
    }
}

module.exports = Thresholds;
