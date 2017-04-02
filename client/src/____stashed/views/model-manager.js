/**
 * Container for all the models which affect how the final
 * rendering outcome looks. Cameras, lights, spheres and slicers.
 * @memberof module:View
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

    initModelsForCellID(cellID) {
        this.cameras[cellID] = new Camera();
        this.lights[cellID] = new Light
    }
}
