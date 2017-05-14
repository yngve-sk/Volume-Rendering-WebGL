let lightSettingsViewController = require('../ng-controllers/light-settings-view-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: { // Name, global or local!
            name: '@'
        },
        replace: true,
        controller: lightSettingsViewController,
        link: function (scope, element, attrs) {
            $timeout(function () {

                scope.DOMReady();
            }, 0);
        },
        templateUrl: 'src/angular-assets/ng-templates/light-settings-view-template.html'
    }
};

module.exports = directive;
