/**@module WebsocketClient */
// EVENT TYPES:
// 'get', get a resource
// 'do', perform an operation
var toBuffer = require('blob-to-buffer');
//let Environment = require('../core/environment');

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

/**
 * Gets the resource from the server
 *
 * @method get
 * @param {Object} resource the resource to request
 * @param {string} resource.type - resource type
 * @param {string} resource.dataset
 * @param {string} resource.field
 * @param {bool} doStringify
 * @param {number} maxWait max wait millis
 * @return {Promise} Promise that'll either resolve or reject
 */
function get(resource, doStringify, maxWait) {
    console.log("GET... ");
    console.log(resource);
    console.log(doStringify);
    console.log(maxWait);
    expectedType = doStringify ? 'stringjson' : 'blob';
    return new Promise(function (resolve, reject) {
        _send({
            type: 'get',
            resource: resource,
            doStringify: doStringify
        });
        let fail = setTimeout(() => {
            reject('Timed out')
        }, maxWait);

        messageReceived = () => {
            clearTimeout(fail);
            return resolve(cache); // Call the resolve function and return the cache
        }
    });
}

module.exports = {
    GET: get
};
