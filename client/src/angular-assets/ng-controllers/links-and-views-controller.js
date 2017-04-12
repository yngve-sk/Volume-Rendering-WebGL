let InitMiniatureSplitviewManager = require('../../widgets/split-view/view-splitter-master-controller').init;
let LinkableModels = require('../../core/linkable-models').Models;
//let shared = require('../../widgets/split-view/controller-view-shared-variables');
let Environment = require('../../core/environment');

let controller = function ($scope) {

    let viewID2LinkerKey = {
        1: [LinkableModels.TRANSFER_FUNCTION.name],
        2: [LinkableModels.CAMERA.name],
        3: [LinkableModels.SLICER.name],
        4: [LinkableModels.SPHERE.name],
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
        [LinkableModels.TRANSFER_FUNCTION.name]: 'LINK-ADD',
        [LinkableModels.CAMERA.name]: 'LINK-ADD',
        [LinkableModels.SLICER.name]: 'LINK-ADD',
        [LinkableModels.SPHERE.name]: 'LINK-ADD'
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
