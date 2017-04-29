let toolbarController = require('../ng-controllers/toolbar-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: {},
        controller: toolbarController,
        link: function (scope, element, attrs) {
            $timeout(function () {
                console.log("attrs");

                scope.DOMReady(); // Call code AFTER shit is loaded
                // avoid executing code on DOM before it is initialized!
            }, 0); //Calling a scoped method
        },
        templateUrl: 'src/angular-assets/ng-templates/toolbar-view-template.html'
    }
};

module.exports = directive;
