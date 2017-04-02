let d3 = require('d3');

class VolumeDataset {
    constructor(isovalues) {
        this.header = {
            rows: -1,
            cols: -1,
            slices: -1
        };

        this.isovalues = isovalues
        this.histogram = [];

        this.gradient = [];
        this.gradientMagnitudes = [];
        this.isovaluesAndGradientMagnitudes = [];

        this.boundingBox = {
            min: null,
            max: null
        };
        this.calculateHistogram();
    }

    setIsoValues(isovalues) {
        this.isovalues = isovalues;
        this.calculateHistogram();
    }

    setHeader(header) {
        this.header = header;
    }

    setGradient(gradient) {
        this.gradient = gradient;
    }

    calculateHistogram() {

        let max = d3.max(this.isovalues);
        this.histogram = new Uint16Array(max + 1);
        let iso = -1;
        let i = -1;
        for (i = 0; i < this.isovalues.length; i++) {
            let isoValue = this.isovalues[i];
            ++this.histogram[isoValue];
        }
    }
}

module.exports = VolumeDataset;
