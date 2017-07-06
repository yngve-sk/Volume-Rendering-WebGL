let InitMiniatureSplitviewManager = require('../../widgets/split-view/view-splitter-master-controller').init;
let LinkableModels = require('../../core/all-models').Models;
//let shared = require('../../widgets/split-view/controller-view-shared-variables');
let Environment = require('../../core/environment');

let controller = function ($scope) {

    let viewID2LinkerKey = {
        1: LinkableModels.TRANSFER_FUNCTION.name,
        2: LinkableModels.SLICER.name,
        3: LinkableModels.CAMERA.name,
        4: LinkableModels.LIGHTS.name,
        5: LinkableModels.THRESHOLDS.name
    }

    let callbacks = {
        linkChanged: Environment.notifyLinkChanged,
        layoutChanged: Environment.notifyLayoutChanged,
        viewTypeChanged: Environment.notifyViewTypeChanged,
        subviewSelectionChanged: Environment.notifyLocalControllerTargetSubviewIDDidChange
    };

    // Require in here because it's not needed outside, pass in callbacks
    let objController = null;

    let adding = "Adding...";
    let removeViewTextAndIcon = "Deleting...";

    $scope.addViewText = adding;

    $scope.MainViewMode = "ADD";

    $scope.addView = () => {
        $scope.MainViewMode = "ADD";
        objController.changeAddRemoveState('ADD');
        $scope.addViewText = adding;
    };

    $scope.removeView = () => {
        $scope.MainViewMode = "REMOVE";
        objController.changeAddRemoveState('REMOVE');
        $scope.addViewText = removeViewTextAndIcon;
    };

    $scope.changeView = () => {
        objController.changeAddRemoveState('EDIT');
        $scope.MainViewMode = "EDIT";
    }

    $scope.isGlobal = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false
    };

    $scope.toggleGlobal = (id) => {
        $scope.isGlobal[id] = !$scope.isGlobal[id];
        Environment.notifyModelPointsToGlobalChanged(viewID2LinkerKey[id], $scope.isGlobal[id]);

    }

    $scope.DOMReady = () => {
        objController = InitMiniatureSplitviewManager(callbacks);
        Environment.ready('LinksAndViewsController');
    }

    // ADD or REMOVE
    let linkStates = {
        [LinkableModels.TRANSFER_FUNCTION.name]: 'LINK-ADD',
        [LinkableModels.SLICER.name]: 'LINK-ADD',
        [LinkableModels.CAMERA.name]: 'LINK-ADD',
        [LinkableModels.LIGHTS.name]: 'LINK-ADD',
        [LinkableModels.THRESHOLDS.name]: 'LINK-ADD'
    };
    $scope.linkStates = linkStates;

    $scope.isActiveLinker = false;
/*
    $scope.isActiveLinker = (id, on) => {
        return linkStates[viewID2LinkerKey[id]] === 'LINK-ADD';
    }*/

    $scope.isAddMode = () => {
        return isAddMode;
    }


    $scope.isChangeViewMode = () => {
        return isChangeViewMode;
    }



    $scope.getLinkerState = (id) => {
        let key = viewID2LinkerKey[id];
        return linkStates[key] === 'LINK-ADD' ? 'Adding...' : 'Deleting...';
    }

    $scope.getAddLinkerColor = (id) => {
        let key = viewID2LinkerKey[id];
        return linkStates[key] === 'LINK-ADD' ? 'green' : 'red';
    }
    
    $scope.getRemoveLinkerColor = (id) => {
        let key = viewID2LinkerKey[id];
        return linkStates[key] === 'LINK-ADD' ? 'red' : 'green';
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
