/**
 * Represents a subcell, only reason this is a class is for
 * having a method to convert offset it by the parent coordinates conveniently.
 * @memberof module:Widgets/View
 */
class Subcell {
    /**
     * Constructs a new subcell.
     *
     * @param {module:Widgets/View.SubcellInfo} info
     * @constructor
     */
    constructor(info) {
        this.name = info.name;
        this.x0 = info.x0;
        this.y0 = info.y0;
        this.width = info.width;
        this.height = info.height;
        this.z = info.z;
    }

    /**
     * Offsets the coordinates of this subcell by the parent coordinates,
     * thus converting it to viewport coordinates ready for rendering.
     *
     * @param {Object} parentOffset The upper left point of the parent cell
     * @param {number} parentOffset.x
     * @param {number} parentOffset.y
     */
    toViewportCoordinates(parentOffset) {
        return new Subcell({
            name: this.name,
            x0: this.x0 + parentOffset.x,
            y0: this.y0 + parentOffset.y,
            width: this.width,
            height: this.height,
            z: this.z // May be redundant
        });
    }

    /**
     * Normalizes the subcell layout to [0,1] coords within parents coordinate system
     *
     * @param {number} parentWidth
     * @param {number} parentHeight
     *
     */
    normalize(parentWidth, parentHeight) {
        let x = this.x0 / parentWidth,
            y = this.y0 / parentHeight,
            h = this.height / parentHeight,
            w = this.width / parentWidth;

        return new Subcell({
            name: this.name,
            x0: x,
            y0: 1.0 - y - h, // Flip Y axis but keep locations
            width: w,
            height: h,
            z: this.z // May be redundant
        });
    }

    /**
     * Denormalizes the subcell layout from [0,1] coords to new parent coords.
     * NOTE: Assumes the current state is [0,1] coords.
     *
     * @param {number} parentWidth
     * @param {number} parentHeight
     */
    denormalize(parentWidth, parentHeight) {
        return new Subcell({
            name: this.name,
            x0: this.x0 * parentWidth,
            y0: this.y0 * parentHeight,
            width: this.width * parentWidth,
            height: this.height * parentHeight,
            z: this.z // May be redundant
        });
    }
}

/**
 * Layout of a subcell, hardcoded to 3 subviews (main, sphere and slicer) for now
 * @memberof module:Widgets/View
 */
class SubcellLayout {
    /**
     *
     * @typedef {Object} SubcellLayoutConfig Multipliers to scale the inner layout. The inner layout has 2 multipliers: SnapThreshold, and standardSize. (NOTE: Maybe make it more dynamic to add more widgets, for now only 2 subcells are hardcoded in here.)
     * @property {number} snapThresholdMultiplier - The threshold to snap the layout to a different scheme. Decides WHEN one of the following conditions arise:
     <br>
     (1) : width > snapThreshold * height:
     <br>
     will put the subviews on the right and have them use all the available height, hence the side length of the views will be height/2.
     <br>
     <br>
     (2): height > snapThreshold * width <br>will put the subviews on the bottom and have them use all available width. Side length of subcells will be width/2
     <br>
     <br>
     If none of the snap thresholds are met, the standardSize multiplier will decide the layouting
     @property {number} standardSizeMultiplier - Scales the size of the two subcells, which will be put in the lower right corner and have a side length of standardSize*(shortest cell side)/2
     * @memberof module:Widgets/View
     **/

    /**
     * Constructs a new subcell layout
     * @param {module:Widgets/View.SubcellLayoutConfig} config
     * @constructor
     **/
    constructor(config) {
        this.changeLayoutThresholdMultiplier = config.changeLayoutThresholdMultiplier;
        this.standardSizeMultiplier = config.standardSizeMultiplier;
    }

    /**
     * All the necessary info to draw a subcell.
     * @typedef {Object} SubcellInfo
     * @property {string} name - name of the subcell, i.e 'Sphere', 'Slicer' etc
     * @property {number} x0 - leftmost coord
     * @property {number} y0 - top coord (0 is upper)
     * @property {number} width - width of the cell
     * @property {number} height - height of the cell
     * @property {number} z - z-index of the cell, highest z-index will be on top
     *
     * @memberof module:Widgets/View
     **/

    /**
     * Calculates the layout given the supercell width and height
     *
     * @property {Object} cellInfo Necessary info about the cell
     * @property cellInfo.cellWidth Width of the cell
     * @property cellInfo.cellHeight Height of the cell
     * @returns {module:Widgets/View.SubcellInfo[]} subcells - the info necessary to draw the subcells. <br>NOTE1: The size of the subcells is not normalized to [0,1] range.<br>
     * this is intended because they are also used by the renderer to set the viewport.<br> NOTE2: The subcells will be sorted by Z-index so the array is already in correct order.
     **/
    calculateLayout(cellInfo) {
        let cellWidth = cellInfo.cellWidth,
            cellHeight = cellInfo.cellHeight;

        let subcells = [
            new Subcell({ // The entire volume view
                name: 'Volume',
                x0: 0,
                y0: 0,
                width: cellWidth,
                height: cellHeight,
                z: 0
            })
        ];


        if (cellWidth > cellHeight * this.changeLayoutThresholdMultiplier) {
            // Snap to right side, cover height completely
            let subcellHeight = cellHeight / 2;
            let offsetX = cellWidth - subcellHeight;

            /*subcells.push(new Subcell({
                name: 'Sphere',
                x0: offsetX,
                y0: 0,
                width: subcellHeight,
                height: subcellHeight,
                z: 2
            }));*/

            subcells.push(new Subcell({
                name: 'Slicer',
                x0: offsetX,
                y0: subcellHeight,
                width: subcellHeight,
                height: subcellHeight,
                z: 2
            }));


        } else if (cellHeight > cellWidth * this.changeLayoutThresholdMultiplier) {
            // Snap to bottom left & right
            let subcellWidth = cellWidth / 2;
            let offsetY = cellHeight - subcellWidth;

            /*subcells.push(new Subcell({
                name: 'Sphere',
                x0: 0,
                y0: offsetY,
                width: subcellWidth,
                height: subcellWidth,
                z: 2
            }));*/

            subcells.push(new Subcell({
                name: 'Slicer',
                x0: subcellWidth,
                y0: offsetY,
                width: subcellWidth,
                height: subcellWidth,
                z: 2
            }));


        } else { // Snap to right side
            let widthHeight = Math.min(cellWidth, cellHeight);
            let subcellWH = this.standardSizeMultiplier * widthHeight / 2;

            let offsetX = cellWidth - subcellWH;
            let offsetY = cellHeight - 2 * subcellWH;

            /*subcells.push(new Subcell({
                name: 'Sphere',
                x0: offsetX,
                y0: offsetY,
                width: subcellWH,
                height: subcellWH,
                z: 2
            }));*/

            subcells.push(new Subcell({
                name: 'Slicer',
                x0: offsetX,
                y0: offsetY + subcellWH,
                width: subcellWH,
                height: subcellWH,
                z: 2
            }));
        }

        subcells = subcells.sort((a, b) => {
            return a.z - b.z; // Sort by z-index
        });

        return subcells;
    }
}

module.exports = SubcellLayout;
