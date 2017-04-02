

/**
* Manages selections, holds all selections + an index buffer for each cell ID.
* @class SelectionManager
* @memberof module:Data
*/
class SelectionManager {
    constructor() {
        this.indices = {}; // {cellID: selectionID}
        this.selections = []; // The selection itself
    }

    /**
     * Selects a selection, can be any object
     *
     * @param {number} cellID - the cell index of the view in which the selection was made.
     * @param {Object} selection
     */
    select(cellID, selection) {
        this.selections.push(selection);

        if (!this.indices[cellID])
            this.indices[cellID] = [];

        // Point the cell to the new selection
        this.indices[cellID].push(this.selections.length - 1);
    }

    /**
     * Information about a selection, contains an index buffer + all available selections.
     * @typedef {Object} SelectionInfo
     * @property {uint[]} indices - Indices of the selections for this cell ID.
     * @property {Object[]} selections - All selections made by all views (could
     *  possibly be useful for more advanced features).
     * @memberof module:Data
     */



    /**
     * Gets the selection as well as the selection indices
     * for this selection
     *
     * @param {number} cellID the cell id
     * @returns {module:Data.SelectionInfo} selectionInfo
     *
     */
    getSelections(cellID) {
        let indices = this.indices[cellID];

        return {
            indices: indices,
            selections: this.selections
        };
    }
}

module.exports = SelectionManager;
