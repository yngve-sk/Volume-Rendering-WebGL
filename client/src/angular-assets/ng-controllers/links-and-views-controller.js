let InitMiniatureSplitviewManager = require('../../widgets/split-view/view-splitter-master-controller').init;
let shared = require('../../widgets/split-view/controller-view-shared-variables');
let Environment = require('../../core/environment');

let controller = function ($scope) {

    let viewID2LinkerKey = {
        1: shared.linkers.TRANSFER_FUNCTION,
        2: shared.linkers.CAMERA,
        3: shared.linkers.SLICER,
        4: shared.linkers.SPHERE_AND_LIGHTS,
    }

    let callbacks = {
        linkChanged: Environment.notifyLinkChanged,
        layoutChanged: Environment.notifyLayoutChanged
    };

    // Require in here because it's not needed outside, pass in callbacks
    let objController = null;

    let adding = "Adding...";
    let removeViewTextAndIcon = "Deleting...";

    $scope.addViewText = adding;

    let isAddMode = true;

    $scope.addView = () => {
        isAddMode = true;
        objController.changeAddRemoveState('ADD');
        $scope.addViewText = adding;
    };

    $scope.removeView = () => {
        isAddMode = false;
        objController.changeAddRemoveState('REMOVE');
        $scope.addViewText = removeViewTextAndIcon;
    };

    $scope.DOMReady = () => {
        objController = InitMiniatureSplitviewManager(callbacks);
        Environment.ready('LinksAndViewsController');
    }

    // ADD or REMOVE
    let linkStates = {
        [shared.linkers.TRANSFER_FUNCTION]: 'LINK-ADD',
        [shared.linkers.CAMERA]: 'LINK-ADD',
        [shared.linkers.SLICER]: 'LINK-ADD',
        [shared.linkers.SPHERE_AND_LIGHTS]: 'LINK-ADD'
    };

    $scope.isActiveLinker = (id, on) => {
        return linkStates[viewID2LinkerKey[id]] === 'LINK-ADD';
    }

    $scope.idActiveAddRemove = () => {
        return isAddMode;
    }

    $scope.getLinkerState = (id) => {
        let key = viewID2LinkerKey[id];
        return linkStates[key] === 'LINK-ADD' ? 'Adding...' : 'Deleting...';
    }

    // state: 'add' or 'delete'
    $scope.setLinkerState = (id, state) => {
        let key = viewID2LinkerKey[id];
        console.log("setLinkerState(" + id + "->" + key + ", " + state + ")");
        objController.changeLinkerState(key, state);
        linkStates[key] = state;
    }

    let colorButtons = () => {
        for (let id in viewID2LinkerKey) {
            let key = viewID2LinkerKey[id];

            // Highlight selected button
            let state = linkStates[key];
            if (state === 'LINK-ADD') {
                $('.view-splitter-button.id-' + id + '-on').addClass('linkbtn-highlight')
            }


        }
    }



}

module.exports = controller;
