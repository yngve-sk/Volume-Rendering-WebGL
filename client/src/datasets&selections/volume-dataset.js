let d3 = require('d3');

/**
 * Represents one volume dataset, holds the isovalues, gradient, curvature etc.
 * Most of the heavy CPU calculations should be done @ server side even though
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
  constructor(args) {
    this.header = args.header;


    this.isovalues = args.isovalues ||  [];
    this.histogram = args.histogram ||  [];

    this.gradient = args.gradient ||[];
    this.gradientMagnitudes = args.gradientMagnitudes ||  [];
    this.isovaluesAndGradientMagnitudes = args.isovaluesAndGradientMagnitudes ||[];

    this.mode = args.mode; // ['Iso', 'IsoGMag']

    this.calculateHistogram();
  }

  /**
   * @param {Int16Array} isovalues - scaled to the range [0, 2^15]
   */
  setIsoValues(isovalues) {
    this.isovalues = isovalues;
    this.calculateHistogram();
  }

  clear() {
    delete this.isovalues;
    delete this.gradient;
    delete this.gradientMagnitudes;
    delete this.isovaluesAndGradientMagnitudes;
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
    this.histogram = new Uint16Array(4096);
    let iso = -1;
    let i = -1;

    switch (this.mode) {
      case 'Iso':
        for (i = 0; i < this.isovalues.length; i++) {
          let isoValue = this.isovalues[i] / 8;
          ++this.histogram[isoValue];
        }
        break;
      case 'IsoGMag':
        for (i = 0; i < this.isovaluesAndGradientMagnitudes.length; i+=2) {
          let isoValue = this.isovaluesAndGradientMagnitudes[i] / 8;
          ++this.histogram[isoValue];
        }
        break;
      default:
        break;
    }
    //    let max = d3.max(this.isovalues);
  }
}

module.exports = VolumeDataset;
