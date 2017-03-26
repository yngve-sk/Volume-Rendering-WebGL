let localController = require('../ng-controllers/links-and-views-controller');

let directive = function () {
    return {
        restrict: 'E',
        scope: {},
        controller: localController,
        templateUrl: 'src/gui-controllers/ng-templates/links-and-views-view-template.html'
    }
};

module.exports = directive;
