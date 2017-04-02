let twgl = require('twgl.js');
let m4 = twgl.m4,
    v3 = twgl.v3;

class Transformations {
    constructor() {
        this.rotation = m4.identity();
        this.translation = m4.identity();
        this.scale = m4.identity();

        this.transformation = m4.identity();
    }

    getTransformation() {
        m4.multiply(this.scale, this.rotation, this.transformation);
        m4.multiply(this.translation, this.transformation, this.transformation);
        return this.transformation;
    }

    rotateFromEye(rx, ry, eyePos, up) {
        // TODO something is wrong here, fix.
        let yAxis = up; // Already normalized

        // Center is assumed to be (0,0,0)
        let eyeToCenter = v3.mulScalar(v3.normalize(eyePos), -1);

        let xAxis = v3.normalize(v3.cross(yAxis, eyeToCenter));

        m4.axisRotate(this.rotation, yAxis, rx, this.rotation);
        m4.axisRotate(this.rotation, xAxis, ry, this.rotation);
    }

    rotateX(radians) {
        m4.rotateX(this.rotation, radians, this.rotation);
    }

    rotateY(radians) {
        m4.rotateY(this.rotation, radians, this.rotation);
    }

    rotateZ(radians) {
        m4.rotateZ(this.rotation, radians, this.rotation);
    }

    translate(dx, dy, dz) {
        console.log("translating...");
        m4.translate(this.translation, [dx, dy, dz], this.translation);
    }

    scale(sxy) {
        m4.scale(this.scale, [sxy, sxy, 0], this.scale);
    }
}

module.exports = Transformations;
