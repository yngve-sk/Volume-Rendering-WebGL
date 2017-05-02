let TransferFunction = require('../widgets/transfer-function/transfer-function');
//let Camera = require('./models/camera');
let Camera = require('./models/camera-orbiter-v2');
let Slicer = require('./models/slicer-model');
let Sphere = require('./models/sphere-model');
let Thresholds = require('./models/thresholds');

let LinkableModels = {
    TRANSFER_FUNCTION: {
        name: 'TRANSFER_FUNCTION',
        class: TransferFunction
    },
    CAMERA: {
        name: 'CAMERA',
        class: Camera
    },
    SLICER: {
        name: 'Slicer',
        class: Slicer
    },
    THRESHOLDS: {
        name: 'Thresholds',
        class: Thresholds
    }
    /*SPHERE: {
        name: 'Sphere',
        class: Sphere
    },*/
};

let modelsList = [];
for (let key in LinkableModels)
    modelsList.push(LinkableModels[key].name);

module.exports = {
    ModelsList: modelsList,
    Models: LinkableModels
};
