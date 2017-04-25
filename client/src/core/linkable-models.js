let TransferFunction = require('../widgets/transfer-function/transfer-function');
//let Camera = require('./models/camera');
let Camera = require('./models/camera-orbiter');
let Slicer = require('./models/slicer-model');
let Sphere = require('./models/sphere-model');

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
        name: 'SLICER',
        class: Slicer
    },
    SPHERE: {
        name: 'SPHERE',
        class: Sphere
    }
};

let modelsList = [];
for (let key in LinkableModels)
    modelsList.push(LinkableModels[key].name);

module.exports = {
    ModelsList: modelsList,
    Models: LinkableModels
};
