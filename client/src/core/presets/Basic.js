let Models = require('../all-models').Models;

module.exports = {
        [Models.TRANSFER_FUNCTION.name]: {
        controlPoints: [
                [0.0026962931608551953, 0],
                [0.09040704260048096, 0],
                [0.10340122770264774, 0],
                [0.12614105782754992, 0.484848484848485],
                [0.17811779823621704, 0.7878787878787878],
                [0.23659163119596754, 0.7272727272727273],
                [0.24633727002259265, 0.5252525252525253],
                [0.29831401043125977, 0.5151515151515151],
                [0.3243023806355933, 0.12121212121212133],
                [0.42825586145292754, 0.080808080808081],
                [0.5776889901278456, 0.14141414141414155],
                [0.6524055544653046, 0]
            ],
        colorGradient: {
            gradient: [
                {
                    color: "#000000",
                    offset: 9.36555896608633
                    }, {
                    color: "#b49068",
                    offset: 16.18750514095402
                    }, {
                    color: "#b91f1f",
                    offset: 25.933143314922155
                    }, {
                    color: "#ffffff",
                    offset: 45.424422397408435
                    }]
        },
        opacityAxis: null,
        splines: null,
        curve: {},
        gradientMagnitudeWeighting: 0.6,
        overallOpacity: 0.68
    },
        [Models.LIGHTS.name]: {
        ambient: 0.794,
        diffuse: 1.1320000000000001,
        specular: 0.22,
        specularExponent: -0.33599999999999997,
        intensity: 0.231,
        direction: [0.5773502691896258, 0.5773502691896258, 0.5773502691896258],
        isovalueThreshold: {
            min: 0,
            max: 0.59
        },
        gradientMagBelowThresholdOpacityMultiplier: 0.8
    },
    [Models.THRESHOLDS.name]: {
        minmax: [0, 4027]
    }
}
