let TF_INTERACTION_MODES = {
    1: 'Select',
    2: 'TF'
};
let $ = require('jquery');
require('spectrum-colorpicker');
let TransferFunctionEditor = require('../../widgets/transfer-function/transfer-function-editor-v2');
let Environment = require('../../core/environment');

let controller = function ($scope, $timeout) {
    let tfEditor = null; // Initialized when DOM is ready.

    $scope.thresholdSlider = {
        minValue: 0,
        maxValue: 4095,
        options: {
            floor: 0,
            ceil: 4095,
            step: 1,
            onChange: () => {
                Environment.notifyIsoThresholdChanged(
                    $scope.name,
                    $scope.thresholdSlider.minValue,
                    $scope.thresholdSlider.maxValue);
            }
        }
    }

    $scope.displayOptions = {
        showHistogram: true,
        showHistogramSelection: true,
        showTransferFunction: true,
        show3DSelectionHistogram: false
    };

    $scope.displayOptionsChanged = function () {
        tfEditor.render();
    }

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

    $scope.onChange = () => {
        alert("SCOPEchange");
    }

    this.onChange = () => {
        alert("THISchange");
    }

    // Debugging only
    window["MYSCOPE" + $scope.$id] = $scope;

    $scope.interactionMode = 2;
    $scope.getInteractionMode = function () {
        return TF_INTERACTION_MODES[$scope.interactionMode];
    };

    $scope.DOMReady = () => {

        tfEditor = new TransferFunctionEditor(
            $scope.displayOptions,
            $scope.getInteractionMode,
            $scope.$id,
            $scope.name);
        tfEditor.notifyModelDidChange();
        tfEditor.render();

        $scope.$watch('displayOptions', (newV, oldV) => {
            console.log("DISP OPTIONS CHANGE!");
            tfEditor.render();
        }, true);

        Environment.TransferFunctionManager.notifyTFPointsToCanvasWithID($scope.name, $scope.$id)

        console.log("L93 TF Ctrlr");
        Environment.ready('TransferFunctionController');
    }

    $scope.renderTFEditor = () => {
        console.log("$scope.renderTFEditor");
        tfEditor.render();
    }

    $scope.clearTFEditor = () => {
        console.log("$scope.clearTFEditor");
        tfEditor._clear();
    }
}

module.exports = controller;
