let glm = require('gl-matrix');

let DEFAULTS = {
    fovy: 40,
    aspect: 1,
    near: 5,
    far: 500
};

class Camera {
    constructor(mode) {
        console.log(glm);
        this.matrix = new glm.mat4.create();

        this.mode = 'perspective'; // TODO make dynamic

        //perspective(out, fovy, aspect, near, far)
        this.perspective = glm.mat4.perspective(
            this.matrix,
            DEFAULTS.fovy,
            DEFAULTS.aspect,
            DEFAULTS.near,
            DEFAULTS.far
        );
    }

    rotateX() {

    }

    getProjectionMatrix() {
        return this.matrix;
    }
}

module.exports = Camera;
