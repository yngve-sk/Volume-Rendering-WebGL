let _ = require('underscore');
let UniqueIndexBag = require('./unique-index-bag');


/**
 * Represents a split view layout in normalized [0, 1] coordinates
 * @memberof module:Widgets/DataStructures
 */
class SplitBox {
    /**
     * Constructs a new SplitBox layout
     *
     * @param {number} maxRows Max amount of rows in this layout
     * @param {number} maxColumns Max amount of columns in this layout
     * @param {number} aspectRatio Width / Height ratio
     * @constructor
     */
    constructor(maxRows, maxColumns, aspectRatio) {
        this.maxRows = maxRows;
        this.maxColumns = maxColumns;
        this.aspectRatio = aspectRatio;

        this.rows = [[]]; // int depicts the cell#

        this.cellIDs = new UniqueIndexBag(maxRows * maxColumns);

        this.rows[0][0] = this.cellIDs.getIndex();

        this.numCells = 1;

        this.layoutPercentages = null;
        this.flattenedLayoutPercentages = null;
        this.calculateLayoutPercentages();

        this.changeListener = null;

        //console.log("SplitBox L27");
        //console.log(this.flattenedLayoutPercentages);
    }

    /**
     *
     * @typedef {Object} LayoutChange
     * @property {string} action - 'CELL_ADDED' or 'CELL_REMOVED'
     * @property id - which cell was added/removed
     *
     * @memberof module:Widgets/View/DataStructures
     **/

    /**
     * Attach a callback that'll be notified every time the layout changes.
     * Gives more detailed info than the standard callback.
     * TODO maybe make the standard callback obsolete but keep now
     * for debugging.
     *
     * @param {function} listener - arguments: (event). {@link Widgets/View/DataStructures:LayoutChange}
     */
    setChangeListener(listener) {
        this.changeListener = listener;
    }

    _notifyEvent(event) {
        if (this.changeListener)
            this.changeListener(event);
    }

    /**
     * Represents the layout of one cell in normalized [0, 1] coordinates
     * @typedef CellInfo
     * @property {number} id - the ID of the cell
     * @property {number} x0 - Leftmost point of the cell
     * @property {number} y0 - Upper point of the cell
     * @property {number} width - Width of the cell
     * @property {number} height - Height of the cell
     * @memberof module:Widgets/View
     *
     **/

    /**
     * Gets the layout for the box.
     *
     * @returns {module:Widgets/View.CellInfo[]} The bounds of all the cells
     */
    getLayoutCells() {
        let cells = [];

        let cellHeight = 1.0 / this.rows.length;

        for (let r = 0; r < this.rows.length; r++) {
            let row = this.rows[r];
            let cellWidth = 1 / row.length;
            for (let c = 0; c < row.length; c++) {
                let x0 = c * cellWidth;
                let y0 = r * cellHeight;

                let cellID = row[c];

                cells.push({
                    id: cellID,
                    x0: x0,
                    y0: y0,
                    width: cellWidth,
                    height: cellHeight
                });
            }
        }

        return cells;
    }

    /* Add cell to row.*/
    addCellToRow(row, cell, isLeft) {
        if (this.rows[row].length >= this.maxColumns)
            return;

        let insertionPoint = isLeft ? cell : cell + 1;
        let id = this.cellIDs.getIndex();
        //console.log("addCellToRow(" + row + ", " + cell + ", " + isLeft + ")");
        //console.log(this.rows);

        this.rows[row].splice(insertionPoint, 0, id);

        this.calculateLayoutPercentages();
        this.layoutDidChange();
        this._notifyEvent({
            action: 'CELL_ADDED',
            id: id
        });
    }

    getCellID(row, col) {
        return this.rows[row][col];
    }

    getLocationOfCellWithID(id) {
        for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++)
            for (let colIndex = 0; colIndex < row.length; colIndex++)
                if (row[colIndex] == id) {
                    return {
                        row: rowIndex,
                        col: colIndex
                    };
                }

        return null;
    }

    removeCellWithID(id) {
        let loc = this.getLocationOfCellWithID(id);
        this.removeCellAt(loc.row, loc.col);
        this._notifyEvent({
            action: 'CELL_REMOVED',
            id: id
        });
    }

    getNumberOfActiveCells() {
        let numCells = 0;
        for (let row of this.rows)
            for (let cell of row)
                numCells++;

        return numCells;
    }

    getActiveCellIDs() {
        return this.cellIDs.getIndicesInUse();
    }

    getNumberOfNonEmptyRows() {
        let numRows = 0;
        for (let row of this.rows)
            if (row.length > 0)
                numRows++;

        return numRows;
    }

    removeCellAt(row, cell) {
        if (this.getNumberOfActiveCells() === 1) // must have at least 1 at all times.
            return -1;

        let id = this.rows[row][cell];

        if (this.rows[row].length === 1)
            this.rows.splice(row, 1);
        else
            this.rows[row].splice(cell, 1);

        this.calculateLayoutPercentages();
        this.layoutDidChange();
        this.cellIDs.returnIndex(id);

        this._notifyEvent({
            action: 'CELL_REMOVED',
            id: id
        });

        return id;
    }

    addRowAt(fromRow, isOnTop) {
        if (this.rows.length >= this.maxRows)
            return;

        let insertionPoint = isOnTop ? fromRow : fromRow + 1;
        let id = this.cellIDs.getIndex();

        if (this.rows[insertionPoint])
            this.rows.splice(insertionPoint, 0, [id]);
        else
            this.rows[insertionPoint] = [id];

        this.calculateLayoutPercentages();
        this.layoutDidChange();
        this._notifyEvent({
            action: 'CELL_ADDED',
            id: id
        });
    }

    /* Returns the cell index (important to get right in the environment */
    /*removeCellFromRow(row, index) {
        let cell = this.rows[row][index];
        this.rows[row].splice(index, 1);
        this.calculateLayoutPercentages();
        this.layoutDidChange();
        return cell;
    }*/

    // NAIVE, likely needs fixing up
    calculateLayoutPercentages() {
        // First pass: Count # non-empty rows
        let theRows = [];
        for (let i = 0; i < this.rows.length; i++) {
            let row = this.rows[i];
            if (row.length !== 0)
                theRows.push({
                    rowIndex: i,
                    row: row
                });
        }

        // 2. Sort rows by #columns
        _.sortBy(theRows, (rowInfo) => {
            return -(rowInfo.row.length); // -means sort descending
        });

        let allSameLength = true;
        let len = theRows[0].length;
        for (let rowInfo of theRows)
            if (rowInfo.length !== len)
                allSameLength = false;

        // 3. Set the width of smallest rows and columns
        let totalWidth = this.aspectRatio.width;
        let totalHeight = this.aspectRatio.height;
        let remainingHeight = this.aspectRatio.height;

        let aspect = totalWidth / remainingHeight;

        let results = [];

        for (let rowInfo of theRows) {
            //console.log(rowInfo);
            let row = rowInfo.row;
            let index = rowInfo.rowIndex;
            let length = row.length;

            let width = totalWidth / length; // This is the cell width, and height of cells @ this row.

            let height = 0;
            if (allSameLength)
                height = totalHeight / theRows.length;
            else
                height = (width / aspect);

            remainingHeight -= height;

            results[index] = {
                rowIndex: index,
                offsetY: totalHeight - remainingHeight - height,
                cellWidth: width,
                cellHeight: height,
                numCells: length
            };
        }

        this.layoutPercentages = results;
        this.calculateFlattenedLayoutPercentages();
    }

    calculateFlattenedLayoutPercentages() {
        let toRender = [];
        for (let row of this.layoutPercentages) {
            for (let cellIndex = 0; cellIndex < row.numCells; cellIndex++) {
                toRender.push({
                    cellID: this.rows[row.rowIndex][cellIndex],
                    rowIndex: row.rowIndex,
                    cellIndex: cellIndex,
                    x0: this.normalizeX(row.cellWidth * cellIndex),
                    y0: this.normalizeY(row.offsetY),
                    widthN: this.normalizeX(row.cellWidth),
                    heightN: this.normalizeY(row.cellHeight)
                });
            }
        }

        this.flattenedLayoutPercentages = toRender;
    }

    normalizeX(x) {
        return x / this.aspectRatio.width;
    }

    normalizeY(y) {
        return y / this.aspectRatio.height;
    }

    getRowAndCellAtNormalizedPosition(normalizedX, normalizedY) {
        let rowIndex = _getRowFromNormalizedYPosition(normalizedY);
        let cellIndex = _getCellFromNormalizedXPosition(normalizedX, rowIndex);

        return {
            row: rowIndex,
            cell: cellIndex
        };
    }

    _getRowFromNormalizedYPosition(normalizedY) {
        for (let i = 0; i < this.layoutPercentages.length; i++) {
            let rowLayout = this.layoutPercentages[i];

            if (rowLayout === undfined)
                continue;

            let normalizedY0 = rowLayout.offsetY / this.aspectRatio.height;
            let normalizedHeight = rowLayout.cellHeight / this.aspectRatio.height;
            let normalizedY1 = normalizedY0 + normalizedHeight;

            if (normalizedY0 <= normalizedY && normalizedY < normalizedY1)
                return i;
        }
    }

    _getCellFromNormalizedXPosition(normalizedX, rowIndex) {
        let rowLayout = this.layoutPercentages[rowIndex];
        let cellWidth = rowLayout.cellWidth;

        for (let cellIndex = 0; cellIndex < rowLayout.numCells; cellIndex++) {
            let normalizedX0 = cellIndex * cellWidth;
            let normalizedX1 = (cellIndex + 1) * cellWidth;

            if (normalizedX0 <= normalizedX && normalizedX < normalizedX1)
                return cellIndex;
        }
    }

    layoutDidChange() {
        if (this.callback)
            this.callback(this);
    }

    setLayoutDidChangeCallback(callback) {
        this.callback = callback;
    }
}

module.exports = SplitBox;
