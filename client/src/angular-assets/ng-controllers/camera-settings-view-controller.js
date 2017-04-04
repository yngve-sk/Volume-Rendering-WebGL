let Environment = require('../../core/environment');

let controller = function ($scope, $timeout) {

    $scope.cameraMode = 'perspective';

    $scope.setCameraMode = (mode) => {
        $scope.cameraMode = mode;
    }

    $scope.alignCamera = (align) => {
        console.log("align " + align);
    }

    $scope.resetZoom = () => {
        console.log("Reset zoom!");
    }

    $scope.DOMReady = () => {}
}

module.exports = controller;
