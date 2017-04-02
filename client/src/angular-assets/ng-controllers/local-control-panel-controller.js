let Environment = require('../../core/environment');
let GET = require('../../client2server/websocket-client').GET;

let controller = function ($scope) {
    $scope.DOMReady = () => {
        console.log("Local control panel DOM ready.");
    }

}

module.exports = controller;
