/**
 * Represents an underlying discrete model of a sphere.
 * @memberof module:Core/Models
 */
class SphereModel {
    constructor() {

    }


    mouse(event) {
        console.log("Sphere mouse event");
        console.log(event);
    }
}

module.exports = SphereModel;
