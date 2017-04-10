/** @module:Core/Models/Lights */

/**
 * Models a set of lights to render
 * @memberof module:Core/Models/Lights
 */
class LightModel {
    constructor(initialState) {
        this.directionalLights = {};
        this.rayLights = {};
    }

    addDirectionalLight(id, pos, style) {
        this.directionalLights[id] = new DirectionalLight(pos, style);
    }

    removeDirectionalLight(id) {
        delete this.directionalLights[id];
    }

    addRayLight(id, pos, direction, style) {
        this.rayLights[id] = new RayLight(pos, direction, style);
    }

    removeRayLight(id) {
        delete this.directionalLights;
    }

    count() {
        return {
            directionalLights: this.directionalLights.keys().length,
            rayLights: this.directionalLights.keys().length
        }
    }
}

module.exports = LightModel;

class DirectionalLight {
    constructor(pos, style) {
        this.worldPos = pos;

        this.color = style.color; //[1, 1, 1, 1];

        this.ambient = style.ambient; // [0, 0, 0, 1];
        this.diffuse = style.diffuse; // [1, 1, 1];
        this.specular = style.specular; // [1, 1, 1, 1];
        this.specularFactor = style.specularFactor; // 1;
    }
}

class RayLight {
    constructor(pos, direction, style) {
        this.worldPos = pos;
        this.worldDirection = direction;

        this.color = style.color; //[1, 1, 1, 1];

        this.ambient = style.ambient; // [0, 0, 0, 1];
        this.diffuse = style.diffuse; // [1, 1, 1];
        this.specular = style.specular; // [1, 1, 1, 1];
        this.specularFactor = style.specularFactor; // 1;
    }
}
