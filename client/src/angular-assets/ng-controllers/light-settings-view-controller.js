let Environment = require('../../core/environment');
let LightSettings = require('../../core/settings').Lights;


let controller = function ($scope, $timeout) {

    let MAX = LightSettings.MaxValues;
    let Defaults = LightSettings.Defaults;

    let transform = (val) => {
        let theValueItself = $scope[val].value;

        theValueItself *= MAX[val];
        theValueItself /= 100;

        return theValueItself;
    }

    let transformMinMax = (val) => {
        let theMinValue = $scope[val].minValue;

        theMinValue *= MAX[val];
        theMinValue /= 100;

        let theMaxValue = $scope[val].maxValue;
        theMaxValue *= MAX[val];
        theMaxValue /= 100;

        return {
            min: theMinValue,
            max: theMaxValue
        };
    }

    let reverseTransformInitial = (val) => {
        let theValueItself = Defaults[val];

        theValueItself /= MAX[val];
        theValueItself *= 100;

        return theValueItself;
    }

    let reverseTransformArb = (name, val) => {
        val /= MAX[name];
        val *= 100;

        return val;
    }

    let update = (val) => {
        let args = {
            [val]: transform(val)
        };
        Environment.notifyLightSettingsDidChangeAtEditor($scope.name, args);
    }

    let updateMinMax = (val) => {
        let args = {
            [val]: transformMinMax(val)
        }

        //console.log(args);
        Environment.notifyLightSettingsDidChangeAtEditor($scope.name, args);
    }

    let updateInverse = (val) => {
        let args = {
            [val]: -transform(val)
        };
        Environment.notifyLightSettingsDidChangeAtEditor($scope.name, args);
    }


    $scope.ambient = {
        value: reverseTransformInitial('ambient'),
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                update('ambient');
            }
        }
    };

    $scope.diffuse = {
        value: reverseTransformInitial('diffuse'),
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                update('diffuse');
            }
        }
    };

    $scope.specular = {
        value: reverseTransformInitial('specular'),
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                update('specular');
            }
        }
    };
    $scope.intensity = {
        value: reverseTransformInitial('intensity'),
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                update('intensity');
            }
        }
    };
    $scope.specularExponent = {
        value: reverseTransformInitial('specularExponent'),
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                updateInverse('specularExponent');
            }
        }
    };

    $scope.isovalueThreshold = {
        minValue: 0.0,
        maxValue: 100.0,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            draggableRange: true,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                updateMinMax('isovalueThreshold');
            }
        }
    };

/*    $scope.gradientMagBelowThresholdOpacityMultiplier = {
        value: reverseTransform('gradientMagBelowThresholdOpacityMultiplier'),
        minValue: 0,
        options: {
            floor: 0,
            ceil: 100,
            step: 0.1,
            precision: 1,
            translate: (d) => {
                return d + "%";
            },
            onChange: () => {
                update('gradientMagBelowThresholdOpacityMultiplier');
            }
        }
    };*/

    let syncWithModel = (newModel) => {
        //alert("Resyncing light view @ " + $scope.name);
        //console.log(newModel);
        $scope.ambient.value = reverseTransformArb('ambient', newModel.ambient);
        $scope.diffuse.value = reverseTransformArb('diffuse', newModel.diffuse);
        $scope.specular.value = reverseTransformArb('specular', newModel.specular);
        $scope.specularExponent.value = reverseTransformArb('specularExponent', newModel.specularExponent);
        $scope.intensity.value = reverseTransformArb('intensity', newModel.intensity);
        $scope.isovalueThreshold.minValue = reverseTransformArb('isovalueThreshold', newModel.isovalueThreshold.min);
        $scope.isovalueThreshold.maxValue = reverseTransformArb('isovalueThreshold', newModel.isovalueThreshold.max);
    }

    $scope.DOMReady = () => {
        Environment.listen('LightModelDidChange', $scope.name, syncWithModel);
        Environment.ready('LightController');
    }
}

module.exports = controller;
