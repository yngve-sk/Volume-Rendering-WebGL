let globalControlPanelController = require('../ng-controllers/global-control-panel-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        controller: globalControlPanelController,
        link: function (scope, element, attrs) {
            $timeout(function () {
                console.log("attrs");

                scope.DOMReady(); // Call code AFTER shit is loaded
                // avoid executing code on DOM before it is initialized!
            }, 0); //Calling a scoped method
        },
        templateUrl: 'src/angular-assets/ng-templates/global-control-panel-template.html'
    }
};

module.exports = directive;
