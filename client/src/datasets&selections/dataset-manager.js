let VolumeDataset = require('./volume-dataset');
let SelectionManager = require('./selection');

/** @module Data */

/**
 * Manages the datasets as well as selections on the datasets per view.
 * @class
 */
class DatasetManager {
    constructor() {
        this.cellID2Dataset = {
            'GLOBAL': null // Latest...
        }; // {cellID: datasetName}
        this.datasets = {};

        this.histogramSelections = new SelectionManager();
        this.viewSelections_POINTS = new SelectionManager();
        //this.viewSelections_CELLS = new SelectionManager();
    }

    /**
     * Gets the histogram for the cell ID
     *
     *
     * @param {number} cellID
     * @returns {Int16Array} - The histogram values
     */
    getHistogramForCellID(cellID) {
        if (this.cellID2Dataset[cellID])
            return this.datasets[this.cellID2Dataset[cellID]].histogram;
        return null;
    }

    clearDataset() {
        for(let key in this.datasets) {
            this.datasets[key].clear();
        }
    }

    /**
     * Gets the histogram selection for the cell ID (if any)
     *
     *
     * @param {number} cellID
     * @returns {null | Int16Array}
     */
    getHistogramSelectionForCellID(cellID) {
        if (this.cellID2Dataset[cellID])
            return this.histogramSelections.getSelections(cellID);
        return null;
    }

    getViewSelectionForCellID(cellID, type) {
        if (this.cellID2Dataset[cellID])
            switch (type) {
                case 'Points':
                    return this.viewSelections_POINTS.getSelections(cellID);
                    break;
                default:
                    return null;
            }
        return null;
    }

    /**
     * Adds a dataset
     *
     * @param {Object} args
     * @param {string} args.name the name of the dataset, Ex: 'Manix', 'Hand' etc
     * @param {Object} args.header The header of the dataset
     * @param {Int16Array} args.isovalues The isovalues scaled up to a range of [0, 2^15]
     */
    addDataset(args) {
        this.cellID2Dataset['GLOBAL'] = args.name;
        this.datasets[args.name] = new VolumeDataset(args);
        console.log("Added dataset to dataset manager");
        console.log(this.datasets[args.name]);
        console.log(this.datasets);
    }

    getDataset(cellID) {
        return this.datasets[this.cellID2Dataset[cellID]];
    }

    /**
     * Removes the dataset
     *
     * @param {string} key the name of the dataset. Ex 'Manix', 'Hand' etc
     */
    removeDataset(key) {
        delete this.datasets[key];
    }


    /**
     * Adds a histogram selection range for the given view
     *
     * @param {number} cellID the cell id of the view the selection was done from.
     * @param {number} min the min value of the range [0, 4095]
     * @param {number} max the max value of the range [0, 4095]
     */
    addHistogramSelection(cellID, min, max) {
        if (this.cellID2Dataset[cellID])
            this.histogramSelections.select(cellID, [min, max]);
    }


    /**
     * Adds a point selection and returns the selection index
     *
     * @param {number} cellID The cell ID the selection was done from
     * @param {Object} point The selected point in [0,1] coordinates
     * @param {number} point.x the x coordinate of the selection [0, 1]
     * @param {number} point.y the y coordinate of the selection [0, 1]
     * @param {number} point.z the z coordinate of the selection [0, 1]
     * @return {number} The index of the selection
     */
    addViewSelectionPoint(cellID, point) {
        if (this.cellID2Dataset[cellID])
            this.viewSelections_POINTS.select(cellID, {
                x: x,
                y: y,
                z: z
            });
    }
}

module.exports = DatasetManager;
