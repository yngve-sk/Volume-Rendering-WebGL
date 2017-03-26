let VolumeDataset = require('./src/vr-dataset');

let datasets = {
    hand: new VolumeDataset('./datasets/hand/hand', 1),
    manix: new VolumeDataset('./datasets/manix/manix-256x256x230', 1)
};

let WebSocketServer = require('./src/websocket-server');

let server = WebSocketServer(datasets);
