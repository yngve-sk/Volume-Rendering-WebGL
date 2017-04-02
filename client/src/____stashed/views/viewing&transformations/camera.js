let m4 = require('twgl.js').m4;

// Very simple wrapper around m4 camera functionality
class Camera {
    constructor(initialProjectionSettings) {
        this.eye = [1, 4, -6];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];

        this.projectionSettings = initialProjectionSettings;

        this.projection = null; // Must be set so it takes into account width/height
        this.setPerspective(
            this.projectionSettings.fieldOfViewRadians,
            this.projectionSettings.aspectRatio,
            this.projectionSettings.zNear,
            this.projectionSettings.zFar
        );
    }

    setPerspective(fieldOfViewRadians, aspectRatio, zNear, zFar) {
        this.projection = m4.perspective(fieldOfViewRadians, aspectRatio, zNear, zFar);
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
