/**
 * Represents an underlying discrete model of a slicer.
 * @memberof module:Core/Models
 */
class SlicerModel {
    constructor() {

    }

    mouse(event) {
        console.log("Slicer mouse event");
        console.log(event);
    }
}

module.exports = SlicerModel;
