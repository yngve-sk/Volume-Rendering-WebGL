let Environment = require('../../core/environment');

let controller = function ($scope, $timeout) {

    $scope.cameraMode = 'perspective';
    $scope.zoom = '100%';

    $scope.setCameraMode = (mode) => {
        $scope.cameraMode = mode;
        Environment.notifyCameraSettingsDidChangeAtEditor($scope.name, {
            mode: mode
        });
    }

    $scope.alignCamera = (align) => {
        console.log("align " + align);
        Environment.notifyCameraSettingsDidChangeAtEditor($scope.name, {
            align: align
        });
    }

    $scope.resetZoom = () => {
        console.log("Reset zoom!");
        Environment.notifyCameraSettingsDidChangeAtEditor($scope.name, {
            zoomFactor: 1
        });
        $scope.zoom = ('100%');
    }

    let zoomListener = (newZoom) => {
        $scope.zoom = (Math.round(100 * newZoom) + '%');
        $scope.$apply();
    }

    let syncWithModel = (newModel) => {
        //alert("Resyncing camera view @ " + $scope.name);
        //console.log(newModel);
        $scope.cameraMode = newModel.mode;
        $scope.zoom = (Math.round(100 * newModel.zoomFactor) + '%');
        $scope.$apply();

        newModel.setZoomListener(zoomListener);
    }

    $scope.DOMReady = () => {
        Environment.listen('CameraModelDidChange', $scope.name, syncWithModel);
        Environment.ready('CameraController', $scope.name);
    }
}

module.exports = controller;
