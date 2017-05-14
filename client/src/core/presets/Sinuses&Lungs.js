let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [[0.012048362440665775, 0], [0.05144526734708358, 0.5050505050505052], [0.13630014523349368, 0.8181818181818182], [0.15145280096673128, 0.8787878787878788], [0.19691076816644412, 0.8282828282828283], [0.4181395418717133, 0]],
        colorGradient: {
            gradient: [{
                color: "#f6f6f6",
                offset: 9.690323012704063
            }, {
                color: "#d42f16",
                offset: 11.811694620330703
            }, {
                color: "#0fca4f",
                offset: 12.720854564379621
            }, {
                color: "#a71f0b",
                offset: 24.23687186292423
            }, {
                color: "#f7f7f7",
                offset: 51.20860000665043
            }]
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.7333333333333333,
        overallOpacity: 0.3
    },
    [Models.LIGHTS.name]: {
        ambient: 1.392,
        diffuse: 0.5539999999999999,
        specular: 0.05,
        specularExponent: -0.9119999999999999,
        intensity: 0.27299999999999996,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0,
            max: 0.36875
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8
    },
    [Models.THRESHOLDS.name]: {
        minmax: [0, 1063]
    }
}
