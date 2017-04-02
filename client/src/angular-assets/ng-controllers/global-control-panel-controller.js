let Environment = require('../../core/environment');
let GET = require('../../client2server/websocket-client').GET;

let controller = function ($scope) {
    $scope.DOMReady = () => {
        console.log("Global control panel DOM ready.");
    }

    $scope.getIsoValues = () => {
        console.log("Getting isovalues...");
        GET('isovalues', false, 30000).then((isovalues) => {
            Environment.VolumeDataset.setIsoValues(new Int16Array(isovalues));
            console.log("RECEIVED ISOVALUES!!");
            console.log(Environment);
            GET('header', true, 30000).then((header) => {
                console.log("GOT HEADER,,");
                console.log(header);
                Environment.VolumeDataset.setHeader(header);
                GET('histogram', false, 30000).then((histogram) => {
                    Environment.VolumeDataset.histogram = new Int16Array(histogram);
                    console.log("Received histogram");
                }).catch((err) => {
                    alert("err getting histogram");
                });
            }).catch((err) => {
                alert(err + " ERROR GETTING HEADER");
            });

        }).catch((err) => {
            alert("TIMED OUT GETTING ISOVALUES: " + err);
        })
    };

    $scope.getGradient = () => {
        GET('isovaluesAndGradientMagnitudes', false, 60000).then((isovaluesAndGradientMagnitudes) => {
            Environment.VolumeDataset.isovaluesAndGradientMagnitudes = isovaluesAndGradientMagnitudes;
            console.log("RECEIVED GRADIENT+ISOs!");
            console.log(Environment);
            GET('header', true, 30000).then((header) => {
                console.log("GOT HEADER,,");
                console.log(header);
                Environment.VolumeDataset.setHeader(header);
            }).catch((err) => {
                alert(err + " ERROR GETTING HEADER");
            })
        }).catch((err) => {
            alert("ERROR: " + err);
        })
    };

    $scope.render3D = () => {
        console.log("render3D()");
        Environment.ViewManager.__DEBUGRefreshView0();
    };

    $scope.initTextures = () => {
        Environment.ViewManager.views[0].volumeRenderer._initTextures();
    };

    $scope.initBuffers = () => {
        Environment.ViewManager.views[0].volumeRenderer._initBuffers();
    };
}

module.exports = controller;
