let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [[0.19691076816644412, 0.8282828282828283], [0.7787727020805331, 0]],
        colorGradient: {
            gradient: [{
                color: "#33c123",
                offset: 12.11474839077201
            }, {
                color: "#020302",
                offset: 27.57045513412859
            }, {
                color: "#ffffff",
                offset: 28.782667481343807
            }, {
                color: "#fafdfa",
                offset: 33.93457064064601
            }]
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.6888888888888889,
        overallOpacity: 0.22
    },
    [Models.LIGHTS.name]: {

        ambient: 0.938,
        diffuse: 0.986,
        specular: 0.755,
        specularExponent: -0.5309999999999999,
        intensity: 0.27299999999999996,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0.12330999999999998,
            max: 1.0000499999999999
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8

    },
    [Models.THRESHOLDS.name]: {
        minmax: [112, 4095]
    }
}
