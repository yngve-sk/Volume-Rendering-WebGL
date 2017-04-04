let cameraSettingsViewController = require('../ng-controllers/camera-settings-view-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        transclude: true,
        controller: cameraSettingsViewController,
        link: function (scope, element, attrs) {
            $timeout(function () {

                scope.DOMReady();
            }, 0);
        },
        templateUrl: 'src/angular-assets/ng-templates/camera-settings-view-template.html'
    }
};

module.exports = directive;
