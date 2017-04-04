let _ = require('underscore');
let MiniatureSplitView = require('./miniature-split-view');
let shared = require('./controller-view-shared-variables');
let BaseSettings = require('../../core/settings').Widgets.LinkerAndSplitterView;

window.addEventListener('resize', () => {
    dispatch("refresh");
}, false);


let views = {
    ADD: null,
    linkers: {

    }
};


let getLinkGroupingsForProperty = (key) => {
    return views.linkers[key].linkGroup.getLinks();
}

let getLayout = function () {
    return views.ADD.layout.bind(this);
}

let getAddRemoveView = () => {
    return views.ADD;
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
    splitbox.setChangeListener(callbacks.layoutChanged);

    for (let key in shared.linkers) {
        let divID = shared.divIDs.linkers[key];
        views.linkers[key] = genLinkingView(divID, viewSettings);
        delete views.linkers[key].layout;
        views.linkers[key].layout = splitbox; // make them all point to the same layout obj
        views.linkers[key].setLinkChangedCallback(key, callbacks.linkChanged);
        views.linkers[key].render();
    }

    console.log("Dispatch refresh");
    setTimeout(() => {
        dispatch('refresh')
    }, 300);

    return {
        getLinkGroupingsForProperty: getLinkGroupingsForProperty,
        getAllLinkGroupings: getAllLinkGroupings,
        getLayout: getLayout,
        getNumberOfSubviews: getNumberOfSubviews,
        changeLinkerState: changeLinkerState,
        changeAddRemoveState: changeAddRemoveState
    }
}

let getMasterCellIDForProperty = (key, cellID) => {
    return views.linkers[key].linkGroup.getMasterCellID(cellID);
}

let read = () => {
    return {
        links: {
            getMasterCellIDForProperty: getMasterCellIDForProperty,
        },
        layout: {
            getLayout: getLayout,
            getNumberOfSubviews: getNumberOfSubviews
        }
    }
}

let dispatch = (event, args) => { // only dispatch to linkers, ADD/REMOVE, otherwise they are autonomous.
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
    maxRows: BaseSettings.maxRows,
    maxColumns: BaseSettings.maxColumns,
    aspectRatio: {
        width: 8,
        height: 3
    },
    showIDs: BaseSettings.showIDs,
    state: 'ADD',
    canLink: true,
    canAddRemove: false,
    bottomTopThresholdPercentage: BaseSettings.bottomTopThresholdPercentage,
    colors: BaseSettings.colors
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
    read: read,
    getAddRemoveView: getAddRemoveView
};
// Environment needs READ ACCESS only, the ng-controller needs write access to bind
// DOM events to change the state of the object.
