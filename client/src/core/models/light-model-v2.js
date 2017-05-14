let v3 = require('twgl.js').v3;
let Defaults = require('../settings').Lights.Defaults;

let gmagMIN = 0.005;

let clampgMagMin = (min) => {
    return min > gmagMIN ? min : gmagMIN;
}

class LightModel {
    constructor(initialSetup) {

        let sqrt3 = Math.sqrt(3);

        this.ambient = initialSetup.ambient || Defaults.ambient;
        this.diffuse = initialSetup.diffuse || Defaults.diffuse;
        this.specular = initialSetup.specular || Defaults.specular;
        this.specularExponent = initialSetup.specularExponent || Defaults.specularExponent;
        this.intensity = initialSetup.intensity || Defaults.intensity;
        this.direction = initialSetup.direction || Defaults.direction;

        this.isovalueThreshold = {
            min: 0,
            max: 1.0
        };
        this.gradientMagBelowThresholdOpacityMultiplier = initialSetup.gradientMagBelowThresholdOpacityMultiplier || Defaults.gradientMagBelowThresholdOpacityMultiplier;
    }

    update(args) {
        for (let key in args)
            this[key] = args[key];
    }

    getGradientMagnitudeLightingRange() {
        return new Float32Array([clampgMagMin(this.isovalueThreshold.min), this.isovalueThreshold.max]);
    }

    applyPresetFromJSON(preset) {
        for(let attrib in preset) {
            this[attrib] = preset[attrib];
        }
    }
}


module.exports = LightModel;
