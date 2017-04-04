let Environment = require('../../core/environment');
let GET = require('../../client2server/websocket-client').GET;

let controller = function ($scope) {
    $scope.DOMReady = () => {
        console.log("Global control panel DOM ready.");
    }


    $scope.onOpenTFEditorPane = () => {
        setTimeout(function () {
            window.dispatchEvent(new Event('resizeTFEditor'));
        }, 200);
    }
}

module.exports = controller;
