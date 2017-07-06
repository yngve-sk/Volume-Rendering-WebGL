let VolumeDataset = require('./src/volume-dataset');

let datasets = {
  'Hand(15.6MB)': new VolumeDataset('./datasets/hand/hand', 1),
  //'Manix(30MB)': new VolumeDataset('./datasets/manix/manix-256x256x230', 1),
  //'Sinus Veins (21.8MB)': new VolumeDataset('./datasets/sinusveins/sinusveins-256x256x166', 1),
  //'Sinus Veins (174.6MB)': new VolumeDataset('./datasets/sinusveins/sinusveins', 1),
  //'Whole Body (12.7MB)': new VolumeDataset('./datasets/wholebody/wholebody-128x128x389', 1),
  //'Whole Body (30MB)': new VolumeDataset('./datasets/wholebody/wholebody-170x170x519', 1),
  //'Whole Body (102MB)': new VolumeDataset('./datasets/wholebody/wholebody-256x256x779', 1),
  //'Manix(241MB)': new VolumeDataset('./datasets/manix/manix', 1)
};

let WebSocketServer = require('./src/websocket-server');

let server = WebSocketServer(datasets);
