let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [[0.0811969068494073, 0], [0.2181244861929768, 0], [0.23933820421950946, 0], [0.25274585662673676, 0.09090909090909105], [0.26146868458151623, 0.21212121212121227], [0.28763716844585463, 0.1010101010101011], [0.28782670256586984, 0], [0.3272236074722876, 0], [0.3484373254988203, 0.010101010101010277], [0.37268157467200047, 0], [0.4120784795784183, 0.010101010101010277], [0.5211776008577291, 0], [0.8424138561601311, 0]],
        colorGradient: {
            gradient: [{
                color: "#f62100",
                offset: 24.402303934951835
            }, {
                color: "#ca7c13",
                offset: 25.44908421013945
            }, {
                color: "#ffffff",
                offset: 26.146867540147564
            }, {
                color: "#d6d6d6",
                offset: 28.479616445452514
            }, {
                color: "#f7f7f7",
                offset: 44.541430729691704
            }]
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.1,
        overallOpacity: 1
    },
    [Models.LIGHTS.name]: {
        ambient: 0.75,
        diffuse: 0.418,
        specular: 0.015,
        specularExponent: -0.5309999999999999,
        intensity: 0.7680000000000001,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0.11504999999999999,
            max: 0.38232
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8
    },
    [Models.THRESHOLDS.name]: {
        minmax: [809, 1875]
    }
}
