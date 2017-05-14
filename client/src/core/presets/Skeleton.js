let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [[0.20086886146650887, 0], [0.3391177093927762, 0.46464646464646475], [0.5695324266378049, 0.5252525252525253], [0.73082274921845, 0.9393939393939394]],
        colorGradient: {
            gradient: [{
                color: "#050403",
                offset: 23.927132117705533
            }, {
                color: "#f9f8f8",
                offset: 33.14371963555668
            }]
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.5333333333333333,
        overallOpacity: 1
    },
    [Models.LIGHTS.name]: {

        ambient: 0.93,
        diffuse: 0.772,
        specular: 0,
        specularExponent: -0.38549999999999995,
        intensity: 0.027000000000000003,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0,
            max: 1.0000499999999999
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8
    },
    [Models.THRESHOLDS.name]: {
        minmax: [989, 4095]
    }
}
