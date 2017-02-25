let fs = require('fs')
let Dissolve = require('dissolve');

class VolumeDataset {
    constructor(filepath, samplingRate) { // 10, read every 10th, 1: read every 1st
        let buffer = fs.readFileSync(filepath);

        let header = {
            rows: buffer.readUInt16LE(0),
            cols: buffer.readUInt16LE(2),
            slices: buffer.readUInt16LE(4),
            info: {}
        };


        let size = Math.floor((header.rows * header.cols * header.slices) / samplingRate);
        let offset = 6;

        let isovalues = [];
        for (let i = 0; i < samplingRate; i++) {
            isovalues[i] = buffer.readUInt16LE(offset);
            offset += 2 * samplingRate;
        }

        header.info.bufferDataSizeBytes = buffer.toString().length - 6; // 6 bytes because header
        header.info.datasetSizeBytes = size * 2; // * 2 because each dataset item is 2 bytes
        header.info.datasetLength = size;

        console.log(header);

        this.isovalues = isovalues;

        this.gradient = [];
        this.gradientMagnitude = [];

        this.curvature = [];
        this.curvatureMagnitude = [];

        this.sizes = {
            slice: header.rows * header.cols,
            row: header.cols,
            col: header.rows
        };

        //this.calculateGradient();
    }

    getIsoValueAt(row, col, slice) {
        return this.isovalues[this._getIndex(row, col, slice)];
    }

    _getIndex(row, col, slice) {
        return slice * this.sizes.slice + row * this.sizes.row + col;
    }

    _jumpY(fromIndex, steps) { // Jump up/down N rows
        return fromIndex + steps * this.sizes.row;
    }

    _jumpZ(fromIndex, steps) { // Jump up/down N slices
        return fromIndex + steps * this.sizes.slice;
    }

    calculateGradient() {
        let dx = [],
            dy = [],
            dz = [];

        for (let slice = 0; slice < this.sizes.slice - 1; slice++) {
            for (let row = 0; row < this.sizes.row - 1; row++) {
                for (let col = 0; col < this.sizes.col - 1; col++) {
                    let index = this._getIndex(row, col, slice);
                    dx[index] = this.isovalues[index + 1] - this.isovalues[index];
                }
                dx[this.sizes.col - 1] = -1; // No value, just a filling value to make indices match up
            }
        }

        for (let slice = 0; slice < this.sizes.slice - 1; slice++) {
            for (let col = 0; col < this.sizes.col - 1; col++) {
                for (let row = 0; row < this.sizes.row - 1; row++) {
                    let index = this._getIndex(row, col, slice);
                    let index2 = this._jumpY(index, 1);
                    dy[index] = this.isovalues[index2] - this.isovalues[index];
                }
                dy[this.sizes.row - 1] = -1; // No value, just a filling value to make indices match up
            }
            dy[this.sizes.col - 1] = -1;
        }

        for (let slice = 0; slice < this.sizes.slice - 1; slice++) {
            for (let row = 0; row < this.sizes.row - 1; row++) {
                for (let col = 0; col < this.sizes.col - 1; col++) {
                    let index = this._getIndex(row, col, slice);
                    let index2 = this._jumpZ(index, 1);
                    dz[index] = this.isovalues[index2] - this.isovalues[index];
                }
                dz[this.sizes.col - 1] = -1;
            }
            dz[this.slice.row - 1] = -1;
        }

        this.gradient = [];

        console.log(dx.length);
        console.log(dy.length);
        console.log(dz.length);

    }

    calculateCurvature() {

    }
}

module.exports = VolumeDataset;
