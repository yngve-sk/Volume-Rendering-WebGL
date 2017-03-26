// EVENT TYPES:
// 'get', get a resource
// 'do', perform an operation
var toBuffer = require('blob-to-buffer');
let Environment = require('../environment/environment');
console.log('L4 main.js, Environment.VolumeDataset.isovalues = ' + Environment.VolumeDataset.isoValues);

let Main = require('../main');

let socket = new WebSocket("ws://localhost:8081");

let expect = null;
let cache = null;

const _send = (json) => {
    expect = json;
    socket.send(JSON.stringify(json));
    time = Date.now();
}

let time = -1;

socket.onopen = (open) => {
    console.log(open);
    //_send({
    //    type: 'get',
    //    resource: 'isovalues'
    //});
};

socket.onclose = (close) => {
    console.log("closed!");
    console.log(close);
}

let printTime = (size) => {
    console.log("Request took " + time + " millis! Object size: " + size + " MB, speed: " + (size / (time / 1000)) + "  MB / s");
}

let reader = new FileReader();

let expectedType = 'blob'; // 'blob' or 'stringifiedjson'
socket.onmessage = (message) => {
    console.log("RECEIVED MESSAGE...");
    console.log(message);
    switch (expectedType) {
        case 'blob':
            reader.onloadend = (event) => {
                console.log("done loading");
                console.log(event);

                let buf = event.target.result;
                cache = buf;
                messageReceived();
            }
            reader.readAsArrayBuffer(message.data);
            //let buf = toBuffer(message.data, function (err, buffer) {
            //    if (err) throw err
            //    //console.log(cache);
            //    cache = buffer;
            //    time = Date.now() - time;
            //    printTime(message.data.size / 1000000);
            //    messageReceived(); // Notify message received
            //    //Environment.VolumeDataset.setIsoValues(cache);
            //    //delete cache;
//
//                //console.log(require('../environment/environment'));
//            });
            break;
        case 'stringjson':
            console.log("parsing string to json...");
            cache = JSON.parse(message.data);
            messageReceived();
            break;
        default:
            break;
    }
};




let messageReceived = null;
let get = (resource, doStringify, maxWait) => {
    expectedType = doStringify ? 'stringjson' : 'blob';
    return new Promise(function (resolve, reject) {
        _send({
            type: 'get',
            resource: resource,
            doStringify: doStringify
        });
        setTimeout(() => {
            reject('Timed out')
        }, maxWait);

        messageReceived = () => {
            resolve(cache); // Call the resolve function and return the cache
        }
    });
}

module.exports = {
    GET: get
};
