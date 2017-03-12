let fs = require('fs');

class VolumeDataset {
    constructor(filepath, samplingRate) { // 10, read every 10th, 1: read every 1st
        let buffer = fs.readFileSync(filepath);

        this.header = {
            rows: buffer.readUInt16LE(0),
            cols: buffer.readUInt16LE(2),
            slices: buffer.readUInt16LE(4),
            info: {}
        };


        let size = Math.floor((this.header.rows * this.header.cols * this.header.slices) / samplingRate);
        let offset = 6;

        let isovalues = [];
        for (let i = 0; i < size; i++) {
            isovalues[i] = buffer.readUInt16LE(offset);
            offset += 2 * samplingRate;
        }

        this.header.info.bufferDataSizeBytes = buffer.toString().length - 6; // 6 bytes because this.header
        this.header.info.datasetSizeBytes = size * 2; // * 2 because each dataset item is 2 bytes
        this.header.info.datasetLength = size;

        console.log(this.header);

        this.isovalues = isovalues;

        this.gradient = [];
        this.gradientMagnitude = [];

        this.curvature = [];
        this.curvatureMagnitude = [];

        this.sizes = {
            slice: this.header.rows * this.header.cols,
            row: this.header.cols,
            col: this.header.rows,
            total: this.header.rows * this.header.cols * this.header.slices
        };

        this.calculateGradient();
        //this.calculateGradient();
    }

    getIsoValueAt(row, col, slice) {
        return this.isovalues[this._getIndex(row, col, slice)];
    }

    _getIndex(row, col, slice) {
        return slice * this.sizes.slice + row * this.sizes.col + col;
    }

    _jumpY(fromIndex, steps) { // Jump up/down N rows
        return fromIndex + steps * this.sizes.row;
    }

    _jumpZ(fromIndex, steps) { // Jump up/down N slices
        return fromIndex + steps * this.sizes.slice;
    }

    _getXYZ(index) {
        let slice = parseInt(index / this.sizes.slice);

        let indexOnSlice = parseInt(index - (this.sizes.slice * slice));

        let row = parseInt(indexOnSlice / this.sizes.col);
        let col = parseInt(indexOnSlice % this.sizes.col);

        return {
            x: col,
            y: slice,
            z: row
        };
    }

    _jump1(xyz) {
        let x = xyz.x + 1,
            y = this._jumpY(xyz.y, 1),
            z = this._jumpZ(xyz.z, 1);

        return {
            x: x,
            y: y,
            z: z
        }
    }

    calculateGradient() {

        // MOVE X = MOVE IN IN ROW-DIRECTION, JUMP COLUMN
        // MOVE Y = MOVE IN SLICE-DIRECTION, JUMP SLICE
        // MOVE Z = MOVE IN COL-DIRECTION, JUMP ROW
        let size = this.sizes.total * 3;
        this.gradient = new Uint8Array(size);

        for (let slice = 0; slice < this.header.slices - 1; slice++) {
            for (let row = 0; row < this.header.cols - 1; row++) {
                for (let col = 0; col < this.header.rows - 1; col++) {

                    let localIsoValue = this.getIsoValueAt(row, col, slice);

                    let x1IsoValue = this.getIsoValueAt(row, col + 1, slice);
                    let z1IsoValue = this.getIsoValueAt(row + 1, col, slice);
                    let y1IsoValue = this.getIsoValueAt(row, col, slice + 1);

                    let dx = x1IsoValue - localIsoValue,
                        dy = y1IsoValue - localIsoValue,
                        dz = y1IsoValue - localIsoValue;

                    let isoValueIndex = this._getIndex(row, col, slice);
                    let offset = 3 * isoValueIndex;

                    this.gradient[offset++] = dx;
                    this.gradient[offset++] = dy;
                    this.gradient[offset] = dz;
                   // console.log("calculating gradient for index " + isoValueIndex);
                }
            }
        }
        console.log("Done calculating gradient");

        //        console.log(this.gradient);
        //
        //        console.log(this.gradient.length);
        //        console.log(this.isovalues.length);
    }
}

module.exports = VolumeDataset;
