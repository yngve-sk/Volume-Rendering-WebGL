let d3 = require('d3');
let glm = require('gl-matrix');

class VolumeDataset {
    constructor() {
        this.header = {
            rows: -1,
            cols: -1,
            slices: -1
        };

        this.isovalues = [];
        this.histogram = [];

        this.gradient = [];
        this.gradientMagnitudes = [];
        this.isovaluesAndGradientMagnitudes = [];

        this.boundingBox = {
            min: null,
            max: null
        };
    }

    setIsoValues(isovalues) {
        this.isovalues = isovalues;
        this.calculateHistogram();
    }

    setHeader(header) {
        this.header = header;
    }

    /* Returns bounding box as 2 glm vec3's*/
    getBoundingBox() {
        let minGLM = glm.vec3.fromValues(
            this.boundingBox.min.x,
            this.boundingBox.min.y,
            this.boundingBox.min.z);

        let maxGLM = glm.vec3.fromValues(
            this.boundingBox.max.x,
            this.boundingBox.max.y,
            this.boundingBox.max.z);
        return {
            min: minGLM,
            max: maxGLM
        };
    }

    setGradient(gradient) {
        this.gradient = gradient;
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
