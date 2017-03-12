let visibility = {
    HIGHLIGHT_SELECTION: 'Highlight Selection',
    HIDE_SELECTION: 'Hide Selection',
    SHOW_SELECTION_ONLY: 'Show Selection Only'
};

class TransferFunctionSelectionOptions {
    constructor() {
        this.intensity = 0; // [0, 100]

        this.visibility = visibility.HIGHLIGHT_SELECTION;
    }
}


module.exports = {
    Options: TransferFunctionSelectionOptions,
    visibility: visibility
}
