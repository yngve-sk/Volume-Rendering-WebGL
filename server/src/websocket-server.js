const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: 8081
});

let theDatasets = {};

let tooBig1M = [];
for (let i = 0; i < 10000000; i++)
    tooBig1M.push = 5;

const smaller = new Uint8Array(10000000);
for (let i = 0; i < 10000000; i++)
    smaller[i] = 5;

wss.on('connection', function connection(ws) {
    let requests = [];

    ws.on('message', (message) => {
        const json = JSON.parse(message);
        const type = json.type;
        const doStringify = json.doStringify; // 'json' or 'buffer'

        const resource = json.resource; // JSON object
        // {type, dataset, field}

        const resourceType = resource.type;

        switch (type) {
            case 'get':
                let toSend = null;
                if (resource.type === 'dataset-list') {
                    toSend = Object.keys(theDatasets);
                } else if (resource.type === 'dataset') {
                    let dataset = resource.dataset;
                    let field = resource.field;

                    let datasett = theDatasets[dataset];
                    let fieldd = theDatasets[field];


                    console.log("Datasett = " + datasett);
                    /*console.log("fieldd = " + fieldd);
                    console.log("field = " + field);*/

                    toSend = theDatasets[dataset][field];
                }

                console.log("GET: " + JSON.stringify(resource));
                console.log("TYPE: " + json.type);
                console.log("do stringify? " + doStringify);
                console.log("Sending object...");

                //let toSend = theDatasets.manix[resource];


                if (doStringify)
                    toSend = JSON.stringify(toSend);

                //console.log(toSend);
                ws.send(toSend);
                console.log("Sent object!");
                break;
        }

    });
});

let requestQueue = [];

function init(datasets) {
    theDatasets = datasets;
    return wss;
}

module.exports = init;
