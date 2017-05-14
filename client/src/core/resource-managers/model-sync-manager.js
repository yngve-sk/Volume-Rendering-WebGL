let _ = require('underscore');
let ReadViewSplitter = require('../../widgets/split-view/view-splitter-master-controller').read();

let getMasterCellIDForModel = ReadViewSplitter.links.getMasterCellIDForModel;
let getAllCellIDs = ReadViewSplitter.layout.getAllCellIDs;
let AllModels = require('../all-models').Models;

/**
 * @module Core/ResourceManagers
 **/

/**
 * Keeps track of all models for all views, including one pointer per view,
 * pointing to a model, this allows for linking / unlinking views.
 * This is what binds the models to the subviews, while still allowing for
 * simple linking/unlinking operations.
 * @memberof module:Core/ResourceManagers
 */
class ModelSyncManager {

    /**
     * Description for undefined
     * @class undefined
     * @constructor
     */
    constructor(viewManager) {
        this.gl = viewManager.masterContext; // Some models need the GL context / canvas to initialize properly
        this.viewManager = viewManager;
        this.classes = {};

        this.defaultModels = {};

        this.linkedModels = {};

        this.pointsToGlobal = { // initially FALSE for all models

        };

        this.virtuals = [];

        for (let key in AllModels) {
            let model = AllModels[key];
            this.addModel(model.name, model.class);
        }
    }

    /**
     * Adds a model to the sync manager
     *
     * @param {string} modelName must be a valid model name representing Sphere, Slicer, Camera etc.
     * @param {Class} ObjConstructor Class with blank constructor to construct new objects
     */
    addModel(modelName, Class) {
        let subviewIDs = getAllCellIDs();
        this.classes[modelName] = Class;

        this.defaultModels[modelName] = {}; // Init empty obj
        this.linkedModels[modelName] = {}; // Init empty obj

        this.pointsToGlobal[modelName] = false;

        this.defaultModels[modelName]['GLOBAL'] = new Class(this.gl, this.viewManager, 'GLOBAL');

        for (let subviewID of subviewIDs) {

            // Initialize a new object
            this.defaultModels[modelName][subviewID] = new Class(this.gl, this.viewManager, subviewID);

            // Initially point a subview to itself.
            this.linkedModels[modelName][subviewID] = subviewID;
        }
    }

    /**
     * Gets a JSON of all the models.
     * It answers the question: "Which models is the subview with this ID
     * pointing to right now?"
     *
     * @param {number} subviewID
     * @returns {Object} models - A dictionary, key: the model name -> value: the model object
     */
    getActiveModels(subviewID) {
        let models = {};

        for (let modelName in this.defaultModels) {
            models[modelName] = null;
            //let activeModelSubviewID = this.linkedModels[modelName][subviewID];
            //models[modelName] = this.defaultModels[modelName][activeModelSubviewID];
            models[modelName] = this.getActiveModel(modelName, subviewID);
        }

        return models;
    }

    applyPresetsToSubview(presets, subviewID) {
        this.syncWithLinkGroup(); // Unlinking is already done at this point
        for(let modelName in presets) {
            this.defaultModels[modelName][subviewID].applyPresetFromJSON(presets[modelName]);
            this.pointsToGlobal[modelName] = false;
        }

    }

    getSubviewIDsLinkedWith(subviewID, modelName) {
        let activeModelID = this.getActiveModelSubviewID(modelName, subviewID);
        return this.getSubviewIDsLinkedWithMaster(activeModelID, modelName);
    }

    getSubviewIDsLinkedWithMaster(masterSubviewID, modelName) {
        let subviewIDs = [];

        let allIDs = getAllCellIDs();
        for (let cellID of allIDs) {
            if (this.getActiveModelSubviewID(modelName, cellID) === masterSubviewID)
                subviewIDs.push(cellID);
        }

        return subviewIDs;
    }

    getActiveModelSubviewID(modelName, subviewID) {
        return (this.pointsToGlobal[modelName]  || subviewID === 'GLOBAL') ?
            'GLOBAL' : this.linkedModels[modelName][subviewID];
    }

    getActiveModel(modelName, subviewID) {
        let activeModelSubviewID = this.getActiveModelSubviewID(modelName, subviewID);
        return this.defaultModels[modelName][activeModelSubviewID];
    }


    /**
     * Removes a subview with given ID. Deletes all models & pointers
     * associated with this subview ID.
     *
     * @param {number} subviewID
     */
    removeSubview(subviewID) {

        for (let modelName in this.defaultModels) {
            delete this.defaultModels[modelName][subviewID];
            delete this.linkedModels[modelName][subviewID];
        }

        //Reset any subviews that was pointing to this subview
        let subviewIDs = getAllCellIDs();
        for (let theSubviewID of subviewIDs) {
            for (let modelName in this.linkedModels) {
                if (this.linkedModels[modelName][theSubviewID] === subviewID) {
                    this.linkedModels[modelName][theSubviewID] = theSubviewID;
                }
            }
        }


        this.syncWithLinkGroup();
    }

    /**
     * Adds a subview and constructs a new instance of each model,
     * and points it to its own instance.
     *
     * @param {number} subviewID
     */
    addSubview(subviewID) {
        for (let modelName in this.defaultModels) {
            // Construct a new object for the subview
            this.defaultModels[modelName][subviewID] = new this.classes[modelName](this.gl, this.viewManager, subviewID);

            // link to itself initially
            /*if (modelName === 'TRANSFER_FUNCTION')
                this.linkedModels[modelName][subviewID] = 'GLOBAL';
            else*/
            this.linkedModels[modelName][subviewID] = subviewID;
        }
    }

    /**
     * Adds a virtual subview, only difference is it has
     * no models of its own - useful for offscreen
     * renderers
     *
     * @param {string|number} virtualSubviewID
     * @param {string|number} pointsTo
     */
    addVirtualSubview(virtualSubviewID, pointsTo) {
        for (let modelName in this.defaultModels) {
            // DO NOT Construct a new object for the subview
            // because virtual
            // used for offscreen views only

            // link to itself initially
            this.linkedModels[modelName][virtualSubviewID] = pointsTo  ||  0;
        }

        // Flag as virtual
        this.virtuals.push(virtualSubviewID);
    }

    /**
     * Points a virtual subview ID to a new subview ID
     * @param {string|number} virtualSubviewID
     * @param {string|number} subviewID
     */
    linkVirtualSubviewTo(virtualSubviewID, subviewID) {
        if (this.isVirtual(virtualSubviewID))
            throw new Error("Expected virtual subview ID");

        if (this.isVirtual(subviewID))
            throw new Error("Expected non-virtual subview ID");

        for (let modelName in this.defaultModels)
            this.linkedModels[modelName][virtualSubviewID] = subviewID;

    }

    isVirtual(subviewID) {
        return _.contains(this.virtuals, subviewID);
    }

    /**
     * Synchronizes the model manager, should be called every time the
     * link groups change. The class is automatically connected to the
     * {@link module:ViewSplitterMasterController} module, this will simply
     * re-sync the model pointers.
     **/
    syncWithLinkGroup() {
        let subviewIDs = getAllCellIDs();

        for (let modelKey in this.defaultModels)
            for (let subviewID of subviewIDs)
                    this.linkedModels[modelKey][subviewID] = getMasterCellIDForModel(modelKey, subviewID);

    }

    call(model, fun, args) {
        let allSubviewIDs = getAllCellIDs();

        for (let subviewID of allSubviewIDs) {
            let theModel = this.defaultModels[model][subviewID];

            let theFunc = theModel[fun].bind(theModel);
            theFunc(args); // invoke
        }
    }

    updateSyncForModelKey(modelKey) {
        let subviewIDs = getAllCellIDs();

        for (let subviewID of subviewIDs) {
            this.linkedModels[modelKey][subviewID] = getMasterCellIDForModel(modelKey, subviewID);
        }
    }

    getModel(modelName, subviewID) {
        return this.defaultModels[modelName][subviewID];
    }

    getAllDefaultModels(modelName) {
        return this.defaultModels[modelName];
    }

    _getModels(subviewID) {
        let models = {};
        for (let modelKey in this.defaultModels) {
            modelKey[modelKey] = this.defaultModels[modelKey][subviewID];
        }

        return models;
    }

    setModelPointsToGlobal(modelName, doesPointToGlobal) {
        this.pointsToGlobal[modelName] = doesPointToGlobal;
    }
}

module.exports = ModelSyncManager;
