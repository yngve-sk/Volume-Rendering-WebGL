let TF_INTERACTION_MODES = {
    1: 'Select',
    2: 'TF'
};
let $ = require('jquery');
require('spectrum-colorpicker');
let TransferFunctionEditor = require('../../gui-widgets/transfer-function/transfer-function-editor-v2');
let Environment = require('../../environment/environment');

let controller = function ($scope) {
    $scope.displayOptions = {
        showHistogram: true,
        showTransferFunction: true,
        showSelection: true,
        zoomInOnSelection: false
    };

    $scope.gradientMagSlider = {
        weighting: 100,
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 1,
            precision: 0,
            draggableRange: false,
            showSelectionBar: false,
            hideLimitLabels: false,
            readOnly: false,
            disabled: false,
            showTicks: false,
            showTicksValues: false
        }
    };

    $scope.curvatureSlider = {
        weighting: 100,
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 1,
            precision: 0,
            draggableRange: false,
            showSelectionBar: false,
            hideLimitLabels: false,
            readOnly: false,
            disabled: false,
            showTicks: false,
            showTicksValues: false
        }
    };



    $scope.interactionMode = 1;
    $scope.getInteractionMode = function () {
        return TF_INTERACTION_MODES[$scope.interactionMode];
    };

    let tfRenderer = null; // Initialized when DOM is ready.
    $scope.DOMReady = () => {

        tfRenderer = new TransferFunctionEditor(
            $scope.displayOptions,
            $scope.getInteractionMode,
            $scope.$id,
            getModel);
        tfRenderer.render();

    }

    // Returns the model currently attached to the TF with the given name,
    // GLOBAL / LOCAL. Ex GLOBAL will always point to the same, but
    // LOCAL can swap between different models.
    let getModel = () => {
        return Environment.TransferFunctions[$scope.name];
    };

    $scope.renderTFEditor = () => {
        console.log("$scope.renderTFEditor");
        tfRenderer.render();
    }

    $scope.clearTFEditor = () => {
        console.log("$scope.clearTFEditor");
        tfRenderer._clear();
    }
}

module.exports = controller;
