


require('./angular-assets/main-controller');
require('./client2server/websocket-client');

let Environment = require('./core/environment');

function printEnvironment() {
    console.log(Environment);
}

module.exports = {
    printEnvironment: printEnvironment,
};

// TODO move elsewhere, semantic ui init stuff.
