let InitMiniatureSplitviewManager = require('../../gui-widgets/split-view/view-splitter-master-controller').init;
let shared = require('../../gui-widgets/split-view/controller-view-shared-variables');
let Environment = require('../../environment/environment');

let controller = function ($scope) {

    let callbacks = {
        linkChanged: Environment.notifyLinkChanged,
        layoutChanged: Environment.notifyLayoutChanged
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
