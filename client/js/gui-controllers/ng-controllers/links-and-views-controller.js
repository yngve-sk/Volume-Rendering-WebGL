let InitMiniatureSplitviewManager = require('../object-controllers/viewport-splitter-master-controller');
let shared = require('../../widget-templates/split-view/controller-view-shared-variables');

let controller = function ($scope) {

    let callbacks = {
        linkChanged: function (viewKey, newLinkGrouping) {
            console.log("Links changed @ view " + viewKey);
        },
        layoutChanged: function (newLayout) {
            console.log("Layout changed");
        }
    };

    // Require in here because it's not needed outside, pass in callbacks
    let objController = InitMiniatureSplitviewManager(callbacks);

    let adding = "Adding...";
    let removeViewTextAndIcon = "Deleting...";

    $scope.addViewText = adding;

    $scope.addView = () => {
        objController.changeAddRemoveState('ADD');
        $scope.addViewText = adding;
    };

    $scope.removeView = () => {
        objController.changeAddRemoveState('REMOVE');
        $scope.addViewText = removeViewTextAndIcon;
    };


    // ADD or REMOVE
    let linkStates = {
        [shared.linkers.SLICER_SPHERE]: 'LINK-ADD',
        [shared.linkers.CAMERA]: 'LINK-ADD',
        [shared.linkers.LIGHTS]: 'LINK-ADD',
        [shared.linkers.TRANSFER_FUNCTION]: 'LINK-ADD'
    };

    $scope.getLinkerState = (key) => {
        return linkStates[key] === 'LINK-ADD' ? 'Adding...' : 'Deleting...';
    }

    // state: 'add' or 'delete'
    $scope.setLinkerState = (key, state) => {
        objController.changeLinkerState(key, state);
        linkStates[key] = state;
    }

}

module.exports = controller;
