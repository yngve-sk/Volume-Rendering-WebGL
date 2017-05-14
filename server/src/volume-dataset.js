let fs = require('fs');
let d3 = require('d3');
let ini = require('ini');
let bitwise = require('bitwise');

class VolumeDataset {
    constructor(filepath, samplingRate) { // 10, read every 10th, 1: read every 1st
        console.log("Loading dataset " + filepath);
        let bufferMain = fs.readFileSync(filepath + ".dat");
        let config = ini.parse(fs.readFileSync(filepath + '.ini', 'utf-8'));

        this.header = {
            cols: bufferMain.readUInt16LE(0), // Width
            rows: bufferMain.readUInt16LE(2), // height
            slices: bufferMain.readUInt16LE(4), // depth
            info: {},
            spacing: {
                x: parseInt(config.DatFile['oldDat Spacing X']),
                y: parseInt(config.DatFile['oldDat Spacing Y']),
                z: parseInt(config.DatFile['oldDat Spacing Z'])
            }
        };

        let size = Math.floor((this.header.rows * this.header.cols * this.header.slices) / samplingRate);
        let offset = 6;

        let isovalues = new Int16Array(size);
        for (let i = 0; i < size; i++) {
            isovalues[i] = (bufferMain.readInt16LE(offset) >> 2 << 2) * 8;
            if (isovalues[i] < 0)
                console.log("ERROR NEGATIVE VALUEE");
            offset += 2 * samplingRate;
        }

        this.header.info.bufferDataSizeBytes = bufferMain.toString().length - 6; // 6 bytes because this.header
        this.header.info.datasetSizeBytes = size * 2; // * 2 because each dataset item is 2 bytes
        this.header.info.datasetLength = size;

        let BBWidth = this.header.cols,
            BBHeight = this.header.rows,
            BBDepth = this.header.slices;

        // Take into account the cell spacing
        let BBWidthCells = this.header.cols * this.header.spacing.x,
            BBHeightCells = this.header.rows * this.header.spacing.y,
            BBDepthCells = this.header.slices * this.header.spacing.z;

        let longest = Math.max(BBWidthCells, Math.max(BBHeightCells, BBDepthCells));
        let BBWidthN = BBWidthCells / longest,
            BBHeightN = BBHeightCells / longest,
            BBDepthN = BBDepthCells / longest;

        let centerX = BBWidthN / 2,
            centerY = BBHeightN / 2,
            centerZ = BBDepthN / 2;

        this.header.normalizedBB = { // rows x cols x slices
            width: BBWidthN,
            height: BBHeightN,
            depth: BBDepthN,
            center: {
                x: centerX,
                y: centerY,
                z: centerZ
            }
        };

        console.log(this.header);

        this.isovalues = isovalues;
        this.isovaluesAndGradientMagnitudes = [];
        this.histogram = [];

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

        this.calculateHistogram();
        this.header.histogram = this.histogram;

        this.calculateGradient();
        console.log("Done calculating gradient");
        console.log("Done merging isos and gradient mags");

        this.gradientMax = d3.max(this.gradient);
        this.isovalueMax = d3.max(this.isovalues.map((d) => {
            return d;
        }));

        console.log("max isovalue = " + this.isovalueMax);
        console.log("max gradient = " + this.gradientMax);
        this.generateMerged();
        console.log("generated merged");
    }

    calculateHistogram() {
        this.histogram = new Uint8Array(4096);
        let histogramCounter = new Int32Array(4096);
        for (let val of this.isovalues) {
            histogramCounter[(val/8)]++;
        }

        let maxC = parseFloat(d3.max(histogramCounter));

        let transformAndRoundToUI8 = (val) => {
            return parseInt(Math.ceil(parseFloat(255*val) / maxC));
        }

        for(let i = 0; i < histogramCounter.length; i++)
            this.histogram[i] = transformAndRoundToUI8(histogramCounter[i]);
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
        // For now, forward differences

        // MOVE X = MOVE IN IN ROW-DIRECTION, JUMP COLUMN
        // MOVE Y = MOVE IN SLICE-DIRECTION, JUMP SLICE
        // MOVE Z = MOVE IN COL-DIRECTION, JUMP ROW
        let size = this.sizes.total * 3;
        this.gradient = new Uint16Array(size);
        this.gradientMagnitude = new Int16Array(this.sizes.total);

        for (let slice = 0; slice < this.header.slices - 1; slice++) {
            for (let row = 0; row < this.header.cols - 1; row++) {
                for (let col = 0; col < this.header.rows - 1; col++) {

                    let localIsoValue = this.getIsoValueAt(row, col, slice);

                    let x1IsoValue = this.getIsoValueAt(row, col + 1, slice);
                    let z1IsoValue = this.getIsoValueAt(row + 1, col, slice);
                    let y1IsoValue = this.getIsoValueAt(row, col, slice + 1);

                    let dx = x1IsoValue - localIsoValue,
                        dy = y1IsoValue - localIsoValue,
                        dz = z1IsoValue - localIsoValue;

                    let isoValueIndex = this._getIndex(row, col, slice);

                    let gradientMagnitude = Math.floor(Math.sqrt(dx * dx + dy * dy + dz * dz));
                    this.gradientMagnitude[isoValueIndex] = gradientMagnitude;

                    let offset = 3 * isoValueIndex;

                    this.gradient[offset++] = dx;
                    this.gradient[offset++] = dy;
                    this.gradient[offset] = dz;
                    // console.log("calculating gradient for index " + isoValueIndex);
                }
            }
        }

        //        console.log(this.gradient);
        //
        //        console.log(this.gradient.length);
        //        console.log(this.isovalues.length);
    }

    generateMerged() {
        let size = this.sizes.total * 2;
        this.isovaluesAndGradientMagnitudes = new Int16Array(size);

        let scaleGradient = (g) => {
            return (g / this.gradientMax) * 32767;
        }

        for (let i = 0; i < size; i += 2) {
            let index = Math.floor(i/2);

            this.isovaluesAndGradientMagnitudes[i] = this.isovalues[index];
            this.isovaluesAndGradientMagnitudes[i + 1] = scaleGradient(this.gradientMagnitude[index]);
        }

        // DEBUG, verify that it is correct...
        for(let i = 0; i < parseInt(Math.floor(this.sizes.total/10)); i++) {
            let combinedIsoIndex = i * 2;
            let combinedGMagIndex = combinedIsoIndex + 1;

            let isoOK = this.isovalues[i] === this.isovaluesAndGradientMagnitudes[combinedIsoIndex];
            let gradientOK = Math.floor(scaleGradient(this.gradientMagnitude[i])) === this.isovaluesAndGradientMagnitudes[combinedGMagIndex];

            if(!isoOK)
                console.error("Isovalue not ok");

            if(!gradientOK)
                console.error("Gradient mag not oK!, this.gradientMagnitude[i] = " + scaleGradient(this.gradientMagnitude[i]) + ", this.isovaluesAndGradientMagnitudes[combinedGMagIndex] = " + this.isovaluesAndGradientMagnitudes[combinedGMagIndex]);

        }
    }
}

module.exports = VolumeDataset;
