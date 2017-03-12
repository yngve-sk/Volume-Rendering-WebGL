let localController = require('../ng-controllers/transfer-function-view-controller');
//let sui = require('./sui-path');

let directive = function ($timeout) {
    return {
        scope: { // Name, global or local!
            name: '@'
        },
        link: function (scope, element, attrs) {
            $timeout(function () {
                scope.DOMReady(); // Call code AFTER shit is loaded
                // avoid executing code on DOM before it is initialized!!1
            }, 0); //Calling a scoped method
        },
        transclude: true,
        controller: localController,
        templateUrl: 'src/gui-controllers/ng-directives/transfer-function-view-template.html'
    }
};

module.exports = directive;
