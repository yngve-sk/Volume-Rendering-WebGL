let $ = require('jquery');
let angular = require('angular');

let app = angular.module('WebGLVolumeRendererClient', []);

/* format for controllers:

    app.controller('NAME', require('PATH_TO_CONTROLLER_FUNC'));
*/

//app.service('GLEnvironment', require('../renderer/gl-environment'));
app.controller('master-controller', require('./ng-controllers/master-controller'));
app.controller('links-and-views', require('./ng-controllers/links-and-views-controller'));


module.exports = app;
