let glm = require('gl-matrix');
let mat4 = glm.mat4;

// Represents a world to view matrix, i.e a scale, rotation and translation
class TransformationMatrix {
    constructor() {
        this.scaleMatrix = null;
        this.rotationMatrix = null;
        this.translationMatrix = null;
    }

    getTransformation() {
        let transformation = mat.create();

        // Order: Translation * Rotation * Scale
        let rotation_X_scale = mat4.multiply(null, this.rotationMatrix, this.scaleMatrix);
        mat4.multiply(transformation, this.translationMatrix, rotation_X_scale);

        return transformation;
    }
}

module.exports = TransformationMatrix;
