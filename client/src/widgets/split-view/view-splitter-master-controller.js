let _ = require('underscore');
let MiniatureSplitView = require('./miniature-split-view');
let LinkableModels = require('../../core/all-models').ActiveLinkableModels;
let BaseSettings = require('../../core/settings').Widgets.LinkerAndSplitterView;

let divIDs = {
    ADD: 'lvw-add-view',
    linkers: {
        [LinkableModels.TRANSFER_FUNCTION.name]: 'lvw-link-view-1',
        [LinkableModels.SLICER.name]: 'lvw-link-view-2',
        [LinkableModels.CAMERA.name]: 'lvw-link-view-3',
        [LinkableModels.LIGHTS.name]: 'lvw-link-view-4',
        [LinkableModels.THRESHOLDS.name]: 'lvw-link-view-5'
    },
    SELECT: 'lvw-select-view'
};

/** @module ViewSplitterMasterController
 * @description Bundles together all the {@link module:Widgets/View.MiniatureSplitView} widgets, is responsible
 * for the communication between the miniature split view widgets and the
 * environment. Provides an easy way for the environment to fetch the information
 * it needs from these widgets, such as link groupings and information about the
 * current layout. Will also notify listeners of certain events, such as
 * when the layout changes.
 **/

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

let getLayout = () => {
    return views.ADD.layout;
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



/**
 * Dictionary, mapping model name to a link grouper
 * @typedef {Object.<string, module:Widgets/DataStructures~LinkGrouper>} ModelLinks
 * @memberof module:ViewSplitterMasterController
 **/

/**
 * Gets all link groupings
 *
 * @method getAllLinkGroupings
 * @return {module:ViewSplitterMasterController.ModelLinks} modelLinks Link groupers per model
 */
let getAllLinkGroupings = () => {
    let groupings = {};

    for (let key in LinkableModels) {
        groupings[key] = views.linkers[LinkableModels[key].name];
    }

    return groupings;
}

let getAllLinkModels = () => {
    let propertyNames = [];

    for (let key in LinkableModels)
        propertyNames.push(LinkableModels[LinkableModels[key].name]);

    return propertyNames;
}



let init = (callbacks) => {
    views.ADD = genAddRemoveView(divIDs.ADD, viewSettings);
    views.ADD.setViewTypeChangedCallback(callbacks.viewTypeChanged);
    views.ADD.render();


    let splitbox = views.ADD.layout;
    splitbox.setChangeListener(callbacks.layoutChanged);

    for (let key in LinkableModels) {
        let model = LinkableModels[key];
        let divID = divIDs.linkers[model.name];
        views.linkers[model.name] = genLinkingView(divID, viewSettings);
        delete views.linkers[model.name].layout;

        // make them all point to the same layout obj
        views.linkers[model.name].layout = splitbox;
        views.linkers[model.name].setLinkChangedCallback(model.name, callbacks.linkChanged);
        views.linkers[model.name].render();
    }

    let isLocked = false;
    let isMinimized = true;

    let selectDIV = document.getElementById(divIDs.SELECT);
    let btnDIV = document.getElementById('lvw-select-view-btn');
    let btnDIVIcon = document.querySelector('#lvw-select-view-btn > i');
    let btnBaseClasslist = 'ui icon button ';

    let updateSelectDiv = () => {
        if (isLocked)
            return;

        selectDIV.classList = isMinimized ? 'minimized' : '';

        btnDIV.classList = btnBaseClasslist + (isMinimized ? 'minimized' : '');
        btnDIVIcon.classList = isMinimized ? 'expand icon' : 'compress icon';
        views.SELECT.refresh();
    }

    btnDIV.addEventListener('click', () => {
        isMinimized = !isMinimized;
        updateSelectDiv();
    });

    views.SELECT = genSelectView(divIDs.SELECT, viewSettings);
    views.SELECT.layout = splitbox;
    views.SELECT.setViewTypeChangedCallback(callbacks.viewTypeChanged);
    views.SELECT.setSubviewSelectionChangedCallback(callbacks.subviewSelectionChanged);
    views.SELECT.render();

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

let getAllCellIDs = () => {
    return getLayout().getActiveCellIDs();
}

let getMasterCellIDForModel = (key, cellID) => {
    if (views.linkers[key])
        return views.linkers[key].linkGrouper.getMasterCellID(cellID);
    else // It has no link group, so it links to itself
        return cellID;
}

let Select = (subviewID) => {
    //views.ADD.selectCellID(subviewID);
    views.SELECT.setSelected(subviewID);
}

let SetViewType = (viewType, subviewID) => {
    views.SELECT.notifyViewTypeChanged(viewType, subviewID);
}

let read = () => {
    return {
        links: {
            getMasterCellIDForModel: getMasterCellIDForModel,
            getAllModels: getAllLinkModels
        },
        layout: {
            getLayout: getLayout,
            getNumberOfSubviews: getNumberOfSubviews,
            getAllCellIDs: getAllCellIDs
        }
    }
}

let write = () => {
    return {
        Select: Select,
        SetViewType: SetViewType
    }
}

let dispatch = (event, args) => { // only dispatch to linkers, ADD/REMOVE, otherwise they are autonomous.
    if (event === 'selectCellID') { // Special, highlight it briefly in other cells

        // args = [cellID] -> Notify environment of this

        views.ADD[event].apply(views.ADD, args);
        for (let view in views.linkers) {
            let theView = views.linkers[view];
            //        console.log(theView);
            let fn = theView[event];
            fn.apply(theView, args);
        }

        views.SELECT.setSelected(args[0]);
    }
    /*else if (event === 'unlinkCellID') {
           for (let view in views.linkers) {
               let theView = views.linkers[view];
               //        console.log(theView);
               let fn = theView[event];
               fn.apply(theView, args);
           }
       }*/
    else {
        views.ADD[event].apply(views.ADD, args);
        views.SELECT[event].apply(views.SELECT, args);
        for (let view in views.linkers) {
            let theView = views.linkers[view];
            //        console.log(theView);
            let fn = theView[event];
            fn.apply(theView, args);
        }
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
    colors: BaseSettings.colors,
    icons: BaseSettings.icons
};

let genLinkingView = (divID, settings) => {
    let customSettings = _.clone(settings);
    customSettings.divID = divID;
    customSettings.canLink = true;
    customSettings.canAddRemove = false;
    customSettings.state = 'LINK-ADD';
    customSettings.receiveLayoutChanges = true;
    customSettings.showIcons = BaseSettings.showIconsOnLinkingViews;
    return new MiniatureSplitView(customSettings);
}

let genAddRemoveView = (divID, settings) => {
    let customSettings = _.clone(settings);
    customSettings.divID = divID;
    customSettings.canLink = false;
    customSettings.canAddRemove = true;
    customSettings.dispatcher = dispatch;
    customSettings.showIcons = BaseSettings.showIconsOnAddRemoveView;
    return new MiniatureSplitView(customSettings);
}

let genSelectView = (divID, settings) => {
    let customSettings = _.clone(settings);
    customSettings.divID = divID;
    customSettings.initiallySelected = 0;
    customSettings.canLink = false;
    customSettings.canAddRemove = false;
    customSettings.canSelect = true;
    customSettings.dispatcher = dispatch;
    customSettings.showIcons = BaseSettings.showIconsOnSelectView;
    return new MiniatureSplitView(customSettings);
}

module.exports = {
    init: init,
    read: read,
    write: write,
    getAddRemoveView: getAddRemoveView
};
