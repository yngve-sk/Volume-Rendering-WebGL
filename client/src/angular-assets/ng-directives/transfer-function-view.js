let localController = require('../ng-controllers/transfer-function-view-controller');
//let sui = require('./sui-path');
let Environment = require('../../core/environment');

let directive = function ($timeout) {
    return {
        scope: { // Name, global or local!
            name: '@'
        },
        link: function (scope, element, attrs) {
            $timeout(function () {
                console.log("attrs");
                console.log(attrs);
                scope.DOMReady(); // Call code AFTER shit is loaded
                // avoid executing code on DOM before it is initialized!
            }, 0); //Calling a scoped method
        },
        transclude: true,
        replace: true,
        controller: localController,
        templateUrl: 'src/angular-assets/ng-templates/transfer-function-view-template.html'
    }
};

module.exports = directive;
