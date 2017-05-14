let Environment = require('../../core/environment');

let controller = function ($scope, $timeout) {

    let RayMode = 'Hide';
    let PointMode = 'Hide';

    $scope.clearRay = () => {
        Environment.notifyClearRay($scope.name);
        $scope.showRay = false;
    }

    $scope.clearPoints = () => {
        Environment.notifyClearPoints($scope.name);
        $scope.showPoints = false;
    }

    $scope.setRayMode = (mode) => {
        RayMode = mode;
        console.log("Set ray mode to " + mode);
        Environment.notifyRayDisplayModeDidChange($scope.name, mode);
    }

    $scope.setPointMode = (mode) => {
        PointMode = mode;
        console.log("Set point mode to " + mode);
        Environment.notifyPointDisplayModeDidChange($scope.name, mode);
    }

    $scope.nonSelectedOpacitySlider = {
        value: 100,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                // Radius is in millimeters, transform this to
                Environment.notifyNonSelectedOpacityDidChange($scope.name, $scope.nonSelectedOpacitySlider.value / 100)
            }
        }
    }
    angular.element(document).ready(function () {
        $scope.$broadcast('rzSliderForceRender');
    });

    $scope.rayRadiusSlider = {
        value: 10,
        options: {
            floor: 1.0,
            ceil: 50,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "mm.";
            },
            onChange: () => {
                // Radius is in millimeters, transform this to
                Environment.notifyRayRadiusDidChange($scope.name, $scope.rayRadiusSlider.value)
            }
        }
    };

    $scope.pointRadiusSlider = {
        value: 10,
        options: {
            floor: 1.0,
            ceil: 15,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "mm.";
            },
            onChange: () => {
                Environment.notifyPointRadiusDidChange($scope.name, $scope.pointRadiusSlider.value)
            }
        }
    };

    $scope.showRay = false;
    $scope.showPoints = false;

    $scope.$watch('showRay', () => {
        console.log("Show ray is now " + $scope.showRay);
        Environment.notifyShowRayDidChange($scope.showRay);
    });

    $scope.$watch('showPoints', () => {
        console.log("Show pts is now " + $scope.showPoints);
        Environment.notifyShowPointsDidChange($scope.showPoints);
    });


    let syncWithModel = (newModel) => {
//        alert("Resyncing selection display model view @ " + $scope.name);
//        console.log(newModel);
        $scope.showRay = newModel.displayRay;
        $scope.displayPoints = newModel.displayPoints;
        $scope.$apply();
    }

    $scope.DOMReady = () => {
        Environment.listen('SelectionDisplayModelDidChange', $scope.name, syncWithModel);
        Environment.ready('SelectionController', $scope.name);
    }
}

module.exports = controller;
