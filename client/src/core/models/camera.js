let m4 = require('twgl.js').m4;


/**
 * Simple wrapper around twgl.js m4 functionality,
 * camera that can toggle between ortho and perspective.
 * @memberof module:Core/Models
 */
class Camera {
    constructor(initialProjectionSettings) {
        this.eye = [1, 4, -6];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];

        // {
        //      fieldOfViewRadians
        //      aspectRatio
        //      zNear
        //      zFar
        // }
        this.projectionSettings = initialProjectionSettings;

        this.projection = null; // Must be set so it takes into account width/height
        this.setPerspective();
    }

    setPerspective() {
        this.projection = m4.perspective(
            this.projectionSettings.fieldOfViewRadians,
            this.projectionSettings.aspectRatio,
            this.projectionSettings.zNear,
            this.projectionSettings.zFar
        );
    }

    getPerspectiveMatrix() {
        return this.projection;
    }

    getLookAt() {
        return m4.lookAt(this.eye, this.target, this.up);
    }

    getViewMatrix() {
        return m4.inverse(this.getLookAt());
    }

    getViewProjectionMatrix() {
        return m4.multiply(this.getPerspectiveMatrix(), this.getViewMatrix());
    }
}

module.exports = Camera;
