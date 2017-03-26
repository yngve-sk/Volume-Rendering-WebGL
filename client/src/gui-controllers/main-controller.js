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
app.controller('master-controller', require('./ng-controllers/master-controller'));
app.controller('global-control-panel', require('./ng-controllers/global-control-panel-controller'));




//--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--//
//-----    --   --  --  --  - - - - - DIRECTIVES  -----    --   --  --  --  - - - - -//
//_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_--_-//
//          (Directives can contain controllers of their own...)
app.directive('tfWidget', require('./ng-directives/transfer-function-view'));
app.directive('linksAndViewsView', require('./ng-directives/links-and-views-view'));
//app.directive('volumeViewManager', require('./ng-directives/volume-view-manager'));

//require('./angular-semantic-ui.min');


// TODO move this to directives or whatnot... Semantic UI init stuff
module.exports = app;
