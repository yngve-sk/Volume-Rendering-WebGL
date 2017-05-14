let TF_INTERACTION_MODES = {
    1: 'Select',
    2: 'TF'
};
let $ = require('jquery');
require('spectrum-colorpicker');
let TransferFunctionEditor = require('../../widgets/transfer-function/transfer-function-editor-v2');
let Environment = require('../../core/environment');
let Settings = require('../../core/settings');

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
                tfEditor.updateIsoThreshold($scope.thresholdSlider.minValue,
                    $scope.thresholdSlider.maxValue);
            }
        }
    }

    $scope.displayOptions = {
        showHistogram: true,
        showHistogramSelection: true,
        showTransferFunction: true,
        show3DSelectionHistogram: false,
        applyThreshold: false
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
            showTicksValues: false,
            onChange: () => {
                Environment.notifyGradientMagnitudeWeightingChanged(
                    $scope.name,
                    Math.max(0.1, ($scope.gradientMagSlider.weighting / 90.0))
                );
            }
        },
    };

    $scope.overallOpacitySlider = {
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
            showTicksValues: false,
            onChange: () => {
                Environment.notifyOverallOpacityChanged(
                    $scope.name,
                    Math.max(0.1, ($scope.overallOpacitySlider.weighting / 100.0))
                );
            }
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

        let canvas = document.querySelector('.tf-editor-background-canvas.ng-id' + $scope.$id);

        Environment.ready('TransferFunctionController', {
            name: $scope.name,
            editor: tfEditor,
            canvas: canvas
        });

        tfEditor.notifyModelDidChange();
        tfEditor.render();

        $scope.$watch('displayOptions', (newV, oldV) => {
            tfEditor.render();
        }, true);

        //Environment.TransferFunctionManager.notifyTFPointsToCanvasWithID($scope.name, $scope.$id)

    }

    Environment.listen('TFModelDidChange', $scope.name, (detail) => {
        let tf = detail.TRANSFER_FUNCTION,
            threshold = detail.THRESHOLDS;

        tfEditor.setTFModel(tf);

        $scope.thresholdSlider.minValue = threshold.minmax[0];
        $scope.thresholdSlider.maxValue = threshold.minmax[1];

        $scope.gradientMagSlider.value = tf.gradientMagnitudeWeighting * 90.0;
        $scope.overallOpacitySlider.value = tf.overallOpacity * 100.0;
    });

    Environment.listen('DatasetDidChange', $scope.name, (detail) => {
        let dataset = detail.dataset;
    });

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
