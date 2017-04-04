let app = angular.module('WebGLVolumeRendererClient', ['semantic-ui', 'rzModule']);

/* format for controllers:

    app.controller('NAME', require('PATH_TO_CONTROLLER_FUNC'));
*/

//app.service('GLEnvironment', require('../renderer/gl-environment'));

//--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--//
//-----    --   --  --  --  - - - - - DEPENDENCIES -----   --   --  --  --  - - - - -//
//_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_-//
//require('../../node_modules/semantic-ui-angular-jquery/angular-semantic-ui.min');



//--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--//
//-----    --   --  --  --  - - - - - CONTROLLERS -----    --   --  --  --  - - - - -//
//_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_-//
console.log("L20");
app.controller('master-controller', require('./ng-controllers/master-controller'));




//--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--//
//-----    --   --  --  --  - - - - - DIRECTIVES  -----    --   --  --  --  - - - - -//
//_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_-//
//          (Directives can contain controllers of their own...)
app.directive('tfWidget', require('./ng-directives/transfer-function-view'));
app.directive('linksAndViewsView', require('./ng-directives/links-and-views-view'));
app.directive('datasetManagerView', require('./ng-directives/dataset-view'));
app.directive('globalControlPanel', require('./ng-directives/global-control-panel-view'));
app.directive('localControlPanel', require('./ng-directives/local-control-panel-view'));
//app.directive('volumeViewManager', require('./ng-directives/volume-view-manager'));

//require('./angular-semantic-ui.min');

setTimeout(() => {
    window.dispatchEvent(new Event('resize'));

}, 1000);

// TODO move this to directives or whatnot... Semantic UI init stuff
module.exports = app;
