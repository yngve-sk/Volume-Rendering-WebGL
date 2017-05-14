let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [],
        colorGradient: {
            gradient: []
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.3,
        overallOpacity: 0.5
    },
    [Models.LIGHTS.name]: {

        ambient: 0.938,
        diffuse: 0.986,
        specular: 0.755,
        specularExponent: -0.5309999999999999,
        intensity: 0.27299999999999996,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0.01,
            max: 1.0000499999999999
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8

    },
    [Models.THRESHOLDS.name]: {
        minmax: [112, 4095]
    }
}
