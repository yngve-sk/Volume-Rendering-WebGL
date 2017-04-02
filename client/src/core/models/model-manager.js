let SlicerModel = require('./slicer-model');
let SphereModel = require('./sphere-model');
let Camera = require('./camera');
let LightModel = require('./light-model');

/** @module Core/Models */

/**
 * Container for all the models which affect how the final
 * rendering outcome looks. Cameras, lights, spheres and slicers.
 * @memberof module:Core/Models
 */
class ModelManager {

    /**
     * Constructs a new model manager, will initiate models for
     * 'GLOBAL' and cell 0 by default.
     *
     * @constructor
     */
    constructor() {
        this.cameras = {
            GLOBAL: null,
            0: null,
            1: null
        };
        this.lights = {
            GLOBAL: null,
            0: null,
            1: null
        };
        this.spheres = {
            GLOBAL: null,
            0: null,
            1: null
        };
        this.slicers = {
            GLOBAL: null,
            0: null,
            1: null
        };
    }

    /**
     * A set of model pointers, each subview must maintain
     * such a set.
     * @typedef {Object} ModelSet
     * @property {module:Core/Models.SlicerModel} slicer
     * @property {module:Core/Models.SphereModel} sphere
     * @property {module:Core/Models.Camera} camera
     * @memberof module:Core/Models
     **/


    /**
     * Initiates models for a new view
     *
     * @param {number} cellID the ID of the view
     * @returns {module:Core/Models.ModelSet}
     */
    initModelsForCellID(cellID) {
        this.cameras[cellID] = new Camera({
            fieldOfViewRadians: Math.PI / 6,
            aspectRatio: 1,
            zNear: 0.2,
            zFar: 20
        });
    }

    deleteModelsForCellID(cellID) {
        delete this.cameras[cellID];
        //delete this.lights[cellID];
        //delete this.spheres[cellID];
        //delete this.slicers[cellID];
    }

}

module.exports = ModelManager;
