// EVENT TYPES:
// 'get', get a resource
// 'do', perform an operation
var toBuffer = require('blob-to-buffer');
let Environment = require('../environment/environment');
console.log('L4 main.js, Environment.VolumeDataset.isovalues = ' + Environment.VolumeDataset.isoValues);

let Main = require('../main');

let socket = new WebSocket("ws://localhost:8081");

const _send = (json) => {
    socket.send(JSON.stringify(json));
}

let time = -1;

socket.onopen = (open) => {
    console.log(open);
    //    socket.send("FREEEDOMMM!!!");
    time = Date.now();
    _send({
        type: 'get',
        resource: 'isovalues'
    });
};

socket.onclose = (close) => {
    console.log("closed!");
    console.log(close);
}

let printTime = (size) => {
    console.log("Request took " + time + " millis! Object size: " + size + " MB, speed: " + (size / (time / 1000)) + "  MB / s");
}

let cache = null;

socket.onmessage = (message) => {
    console.log(message);
    let buf = toBuffer(message.data, function (err, buffer) {
        if (err) throw err
        cache = buffer;
        console.log(cache);
        time = Date.now() - time;
        printTime(message.data.size / 1000000);
        Environment.VolumeDataset.setIsoValues(cache);
        delete cache;

        console.log(require('../environment/environment'));
    });
};

// Setup:
// 1. Client sends request, awaits a response
//



module.exports = socket;
