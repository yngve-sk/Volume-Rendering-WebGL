console.log("L1");

let MiniatureSplitView = require('../widget-templates/split-view/miniature-split-view');

let ViewSplitter = new MiniatureSplitView({
    divID: 'viewport-splitter-container',
    maxRows: 3,
    maxColumns: 4,
    aspectRatio: {
        width: 4,
        height: 3
    },
    showIDs: true,
    state: 'ADD',
    canLink: true,
    canAddRemove: true,
    bottomTopThresholdPercentage: 0.20,
    colors: {
        'LINKS' : ['red', 'green', 'blue', 'purple', 'brown'],
        'REMOVE': 'red',
        'ADD': 'green'
    }
});

ViewSplitter.render();

window.ChangeState = (state) => {
    ViewSplitter.changeState(state);
}
