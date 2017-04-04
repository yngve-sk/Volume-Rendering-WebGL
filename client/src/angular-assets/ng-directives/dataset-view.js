let datasetViewController = require('../ng-controllers/dataset-view-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        controller: datasetViewController,
        link: function (scope, element, attrs) {
            $timeout(function () {

                scope.DOMReady();
            }, 0);
        },
        templateUrl: 'src/angular-assets/ng-templates/dataset-view-template.html'
    }
};

module.exports = directive;
