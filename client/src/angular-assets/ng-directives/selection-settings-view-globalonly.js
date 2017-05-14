let selectionSettingsViewController = require('../ng-controllers/selection-settings-view-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: { // Name, global or local!
            name: '@'
        },
        replace: true,
        transclude: true,
        controller: selectionSettingsViewController,
        link: function (scope, element, attrs) {
            $timeout(function () {

                scope.DOMReady();
            }, 0);
        },
        templateUrl: 'src/angular-assets/ng-templates/selection-settings-view-globalonly-template.html'
    }
};

module.exports = directive;
