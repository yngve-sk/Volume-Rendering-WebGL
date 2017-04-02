let localController = require('../ng-controllers/links-and-views-controller');

let directive = function ($timeout) {
    return {
        restrict: 'E',
        scope: {},
        controller: localController,
        link: function (scope, element, attrs) {
            $timeout(function () {
                console.log("attrs");

                scope.DOMReady(); // Call code AFTER shit is loaded
                // avoid executing code on DOM before it is initialized!
            }, 0); //Calling a scoped method
        },
        templateUrl: 'src/angular-assets/ng-templates/links-and-views-view-template.html'
    }
};

module.exports = directive;
