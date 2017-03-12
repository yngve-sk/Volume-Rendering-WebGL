let d3 = require('d3');

class VolumeDataset {
    constructor() {
        this.header = {
            rows: -1,
            cols: -1,
            slices: -1
        };

        this.isovalues = [];
        this.histogram = [];
    }

    setIsoValues(isovalues) {
        this.isovalues = isovalues;
        this.calculateHistogram();
    }

    calculateHistogram() {

        let max = d3.max(this.isovalues);
        this.histogram = new Uint8Array(max + 1);
        let iso = -1;
        let i = -1;
        for (i = 0; i < this.isovalues.length; i++) {
            let isoValue = this.isovalues[i];
            ++this.histogram[isoValue];
        }
    }
}

module.exports = VolumeDataset;
