let VolumeDataset = require('./src/vr-dataset');

let datasets = {
    hand: new VolumeDataset('./datasets/hand/hand.dat', 1)
};

let WebSocketServer = require('./src/websocket-server');

let server = WebSocketServer(datasets);
