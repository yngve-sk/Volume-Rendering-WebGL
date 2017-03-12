let TransferFunction = require('./transfer-function');
/* Manages multiple transfer functions. It handles...
    - Linking and unlinking of TFs across views
    - Creating and destroying new TFs as views are created
    - Keeping track of multiple discrete TFs, serving them
      when needed

*/
class TransferFunctionManager {
    constructor(environment) {
        this.env = environment;

        this.tfs = {

        };
    }

    addTransferFunction(key) {
        this.tfs[key] = new TransferFunction();
    }

    getTransferFunction(key) {
        return this.tfs[key];
    }
}

module.exports = TransferFunctionManager;
