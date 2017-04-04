let d3 = require('d3');

/**
 * Represents one volume dataset, holds the isovalues, gradient, curvature etc.
 * Most of the heavy CPU calculations should be done @ server side though
 * it is possible to do most of it in the browser.
 * @memberof module:Data
 */
class VolumeDataset {

    /**
     * Constructs a new volume dataset
     * @param {Object} header the header info of the dataset
     * @param {Int16Array} isovalues the isovalues, scaled from the range [0, 4095] to [0, 2^15]
     * @constructor
     */
    constructor(header, isovalues) {
        this.header = header;


        this.isovalues = isovalues
        this.histogram = [];

        this.gradient = [];
        this.gradientMagnitudes = [];
        this.isovaluesAndGradientMagnitudes = [];

        this.calculateHistogram();
    }

    /**
     * @param {Int16Array} isovalues - scaled to the range [0, 2^15]
     */
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
    /**
     * Represents a histogram of isovalue counts.
     * The length of this array will always be 4096.
     * The values will be in the range [0, 2^15].
     *
     * (Would need to use Int32Array is value-counts exceed 2^15)
     *
     * @typedef {Int16Array} IsovalueHistogram
     * @memberof module:Data
     */

    /**
     * Gets the histogram of the isovalue distribution for this dataset
     *
     * @returns {module:Data.IsovalueHistogram} the isovalue count, range from [0, isovalues.length] (theoretically)
     */
    getHistogram() {
        return this.histogram;
    }



    /**
     * Calculates the histogram, NOTE: Will scale values down from [0, 2^15]
     * to [0, 4095], length of the histogram will always be 4096, and the max
     * count value will be 2^15, so each value is divided by 8
     */
    calculateHistogram() {
        let max = d3.max(this.isovalues);
        this.histogram = new Uint16Array(4096);
        let iso = -1;
        let i = -1;
        for (i = 0; i < this.isovalues.length; i++) {
            let isoValue = this.isovalues[i]/8;
            ++this.histogram[isoValue];
        }
    }
}

module.exports = VolumeDataset;
