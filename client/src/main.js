require('./gui-controllers/main-controller');
require('./client2server/websocket-client');

let Environment = require('./environment/environment');
console.log('L4 main.js, Environment.VolumeDataset.isovalues = ' + Environment.VolumeDataset.isoValues);

function printEnvironment() {
    console.log('printEnvironment() main.js, Environment.VolumeDataset.isovalues = ' + Environment.VolumeDataset.isoValues);
}

module.exports = {
    printEnvironment: printEnvironment,
    otherShit: 'hey'
};

let $ = require('jquery');

// TODO move elsewhere, semantic ui init stuff.
