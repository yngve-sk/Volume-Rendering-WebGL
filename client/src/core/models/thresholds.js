class Thresholds {
    constructor() {
        this.minmax = [-Infinity, Infinity];
    }

    setMin(min) {
        this.minmax[0] = min;
    }

    setMax(max) {
        this.max[1] = max;
    }
}

module.exports = Thresholds;
