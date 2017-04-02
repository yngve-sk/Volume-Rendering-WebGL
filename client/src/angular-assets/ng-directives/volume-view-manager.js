let theController = require('../ng-controllers/volume-view-manager-controller');
//let sui = require('./sui-path');
let Environment = require('../../core/environment');

let directive = function ($timeout) {
    return {
        scope: { // Name, global or local!
            id: '@'
        },
        link: function (scope, element, attrs) {
            $timeout(function () {
                // Called AFTER Directive DOM is done loading.
                console.log(attrs);
                scope.divID = attrs.id;
                scope.print();
                console.log("L15");
            }, 0);
        },
        transclude: true,
        replace: true,
        controller: theController,
        templateUrl: 'src/angular-assets/ng-templates/volume-view-manager-template.html'
    }
};

module.exports = directive;
