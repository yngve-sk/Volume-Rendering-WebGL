let TransferFunction = require('./models/transfer-function');
//let Camera = require('./models/camera');
let Camera = require('./models/camera-orbiter-v2');
let Slicer = require('./models/slicer-model');
let Sphere = require('./models/sphere-model');
let Thresholds = require('./models/thresholds');
let LightModel = require('./models/light-model-v2');
let SelectionDisplayModel = require('./models/selection-display-model');

let Models = {
    TRANSFER_FUNCTION: {
        name: 'TRANSFER_FUNCTION',
        class: TransferFunction
    },
    CAMERA: {
        name: 'CAMERA',
        class: Camera
    },
    LIGHTS: {
        name: 'Lights',
        class: LightModel
    },
    SLICER: {
        name: 'Slicer',
        class: Slicer
    },
    THRESHOLDS: { 
        name: 'Thresholds',
        class: Thresholds
    },
    SELECTION_DISPLAY: {
        name: 'SelectionDisplayModel',
        class: SelectionDisplayModel
    }
    /*SPHERE: {
        name: 'Sphere',
        class: Sphere
    },*/
};

// Models that are actually used by linker views
let ActiveLinkableModels = {
    TRANSFER_FUNCTION: {
        name: 'TRANSFER_FUNCTION',
        class: TransferFunction
    },
    SLICER: {
        name: 'Slicer',
        class: Slicer
    },
    CAMERA: {
        name: 'CAMERA',
        class: Camera
    },
    LIGHTS: {
        name: 'Lights',
        class: LightModel
    },
    THRESHOLDS: {
        name: 'Thresholds',
        class: Thresholds
    }
};

let LocalOnly = {

}

let modelsList = [];
for (let key in Models)
    modelsList.push(Models[key].name);

module.exports = {
    ModelsList: modelsList,
    Models: Models,
    ActiveLinkableModels: ActiveLinkableModels
};
