let _ = require('underscore');
let MiniatureSplitView = require('./miniature-split-view');
let shared = require('./controller-view-shared-variables');

window.addEventListener('resize', () => {
    dispatch("refresh");
}, false);


let views = {
    ADD: null,
    linkers: {

    }
};

/* Callbacks:

{
    linkChanged(allLinkGroupings),
    layoutChanged(newLayout) /// POSSIBLY NOT NEEDED.
}

functions for modifying:

{
    getLinkGroupingsForProperty(key),
    getAllLinkGroupings(),
    getLayout(),
    getNumberOfSubviews(),
    changeLinkerState(key, newState),
    changeAddRemoveState(newState)
}

*/

let getLinkGroupingsForProperty = (key) => {
    return views.linkers[key].linkGroup.getLinks();
}

let getLayout = () => {
    return views.ADD.layout;
}

let getNumberOfSubviews = () => {
    return views.ADD.layout.getNumberOfActiveCells();
}

let changeLinkerState = (key, newState) => {
    views.linkers[key].changeState(newState);
}

let changeAddRemoveState = (newState) => {
    views.ADD.changeState(newState);
}

let getAllLinkGroupings = () => {
    let groupings = {};

    for (key in shared.linkers) {
        groupings[key] = getLinkGroupingsForProperty(key);
    }

    return groupings;
}

let init = (callbacks) => {
    views.ADD = genAddRemoveView(shared.divIDs.ADD, viewSettings);
    views.ADD.render();

    let splitbox = views.ADD.layout;
    splitbox.setLayoutDidChangeCallback(callbacks.layoutChanged);

    for (let key in shared.linkers) {
        let divID = shared.divIDs.linkers[key];
        views.linkers[key] = genLinkingView(divID, viewSettings);
        delete views.linkers[key].layout;
        views.linkers[key].layout = splitbox; // make them all point to the same layout obj
        views.linkers[key].setLinkChangedCallback(key, callbacks.linkChanged);
        views.linkers[key].render();
    }


    return {
        getLinkGroupingsForProperty: getLinkGroupingsForProperty,
        getAllLinkGroupings: getAllLinkGroupings,
        getLayout: getLayout,
        getNumberOfSubviews: getNumberOfSubviews,
        changeLinkerState: changeLinkerState,
        changeAddRemoveState: changeAddRemoveState
    }
}

let read = () => {
    return {
        links: {
            getLinkGroupingsForProperty: getLinkGroupingsForProperty,
            getAllLinkGroupings: getAllLinkGroupings,
        },
        layout: {
            getLayout: getLayout,
            getNumberOfSubviews: getNumberOfSubviews
        }
    }
}

let dispatch = (event, args) => {
    // only dispatch to linkers, ADD/REMOVE, otherwise they are autonomous.
    views.ADD[event].apply(views.ADD, args);
    for (let view in views.linkers) {
        let theView = views.linkers[view];
        //        console.log(theView);
        let fn = theView[event];
        fn.apply(theView, args);
    }
};


/*

    states:

    ----------------

    LINK-REMOVE
    LINK-IN-PROGRESS
    LINK-ADD

    ----------------

    ADD
    REMOVE


*/

let viewSettings = {
    divID: '',
    maxRows: 3,
    maxColumns: 4,
    aspectRatio: {
        width: 4,
        height: 3
    },
    showIDs: true,
    state: 'ADD',
    canLink: true,
    canAddRemove: false,
    bottomTopThresholdPercentage: 0.20,
    colors: {
        'LINKS': ['red', 'green', 'white', 'purple', 'brown'],
        'REMOVE': 'red',
        'ADD': 'green'
    }
};

let genLinkingView = (divID, settings) => {
    let customSettings = _.clone(settings);
    customSettings.divID = divID;
    customSettings.canLink = true;
    customSettings.canAddRemove = false;
    customSettings.state = 'LINK-ADD';
    customSettings.receiveLayoutChanges = true;
    return new MiniatureSplitView(customSettings);
}

let genAddRemoveView = (divID, settings) => {
    let customSettings = _.clone(settings);
    customSettings.divID = divID;
    customSettings.canLink = false;
    customSettings.canAddRemove = true;
    customSettings.dispatcher = dispatch;
    return new MiniatureSplitView(customSettings);
}

module.exports = {
    init: init,
    read: read
};
// Environment needs READ ACCESS only, the ng-controller needs write access to bind
// DOM events to change the state of the object.
