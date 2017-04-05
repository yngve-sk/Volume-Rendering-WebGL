let TransferFunction = require('../widgets/transfer-function/transfer-function');
let Camera = require('./models/camera');
let Slicer = require('./models/slicer-model');
let Sphere = require('./models/sphere-model');

let LinkableModels = {
    'TRANSFER_FUNCTION': {
        name: 'TRANSFER_FUNCTION',
        class: TransferFunction
    },
    'CAMERA': {
        name: 'CAMERA',
        class: Camera
    },
    'SLICER': {
        name: 'SLICER',
        class: Slicer
    },
    'SPHERE_AND_LIGHTS': {
        name: 'SPHERE_AND_LIGHTS',
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
