let m4 = require('twgl.js').m4;
let Transformations = require('./transformations');
let InitialProjectionSettings = null; // TODO define in ext file, possibly settings!

/**
 * Simple wrapper around twgl.js m4 functionality,
 * camera that can toggle between ortho and perspective.
 * @memberof module:Core/Models
 */
class Camera {
    constructor(gl) {
        this.eye = [1, 4, -6];
        this.target = [0, 0, 0];
        this.up = [0, 1, 0];

        // {
        //      fieldOfViewRadians
        //      aspectRatio
        //      zNear
        //      zFar
        // }
        this.projectionSettings = {
            fieldOfViewRadians: Math.PI / 6,
            aspectRatio: gl.canvas.clientWidth / gl.canvas.clientHeight,
            zNear: 0.5,
            zFar: 10
        };

        this.projection = null; // Must be set so it takes into account width/height
        //this.setPerspective();
        this.modelTransformation = new Transformations();
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

    getViewInverseMatrix() {
        return this.getLookAt();
    }

    getWorldMatrix() {
        return this.modelTransformation.getTransformation();
    }

    getViewProjectionMatrix() {
        return m4.multiply(this.getPerspectiveMatrix(), this.getViewMatrix());
    }

    getWorldInverseTranspose() {
        return m4.transpose(m4.inverse(this.getWorldMatrix()));
    }

    getWorldViewProjectionMatrix() {
        let modelToWorld = this.modelTransformation.getTransformation();
        let worldToProjection = this.getViewProjectionMatrix();
        return m4.multiply(worldToProjection, modelToWorld);

    }

    getModelTransformation() {
        return this.modelTransformation;
    }
}

module.exports = Camera;
