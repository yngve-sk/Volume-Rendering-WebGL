let d3 = require('d3');
/*let menuInfos = {
    Volume: require('../../core/views/context-menu-config-volume'),
    Slicer: require('../../core/views/context-menu-config-slicer')
}*/
let menuInfos = require('../../core/views/context-menu-configs');


let InteractionModeManager = require('../../core/interaction-modes-v2');

/**
 * Makes an overlay linked to a split view.
 *
 * @memberof module:Widgets/View
 */
class MiniatureSplitViewOverlay {



    /**
     *
     * @typedef {Object} MiniatureSplitViewOverlayConfiguration
     * @property {string} containerID - the HTML id attribute of the parent to attach this overlay to
     * @property {DOMElement} coverMe - HTML element to overlay this over. The overlay will be the same size as this
     * @property {function} miniatureSplitViewGetter - getter for the miniature split view to link this overlay to. Returns a {@link Widgets/View.MiniatureSplitView}
     * @property {Object} options - customizable options (TODO fill in options)
     * @property options.showIDs {bool} - true to show the cell ID in the upper left corner
     * @property options.bottomTopThresholdPercentage {number} - [0,1] Specifies the percentage at which the selection should snap to be seen as "between" two rows. Useful for resizing views etc. NOTE: The row spacing will be the same as the column spacing when it comes to resizing.
     * @property {module:Widgets/View.SubcellLayout} subcellLayout - the layouting of the subcells
     *
     * @property listener {function} The event listener to delegate mouse events etc to. Arguments: (cellID, subcellName, event)
     * @memberof module:Widgets/View
     *
     **/

    /**
     * Constructs a new miniature split view overlay.
     * This class will use the layout of a {@link Widgets/View.MiniatureSplitView} object
     * and be linked to it in some ways.
     * The purpose of this overlay is to record events
     * for each subview and pass them on to the according event handler,
     * and to render the layout in as simple as possible manner.
     * @param {module:Widgets/View.MiniatureSplitViewOverlayConfiguration} config Configuration of the overlay
     * @constructor
     */
    constructor(args) {
        this.options = {
            showIDs: args.options.showIDs,
            bottomTopThresholdPercentage: args.options.bottomTopThresholdPercentage
        }

        this.listener = args.listener;

        this.getMiniatureSplitView = args.miniatureSplitViewGetter;
        this.parent = document.getElementById(args.containerID);
        this.coverMe = args.coverMe;

        this.svg = d3.select(this.parent)
            .append('svg')
            .attr('class', 'webgl-master-canvas-overlay-svg');

        this.group = this.svg.append('g');

        this.subcellLayout = args.subcellLayout;
    }

    /**
     * Represents the viewport of a cell to be rendered.
     * It is laid out as conveniently as possibly to set the
     * viewport of a subview directly.
     * @typedef {Object} Viewport
     * @property {number} x0 Leftmost coord to render to
     * @property {number} y0 Top coord to render to
     * @property {number} width The cell width to render to
     * @property {number} height The cell height to render to
     * @memberof module:Core/View
     *
     **/

    /**
     * Renders the overlay and initializes event listeners
     * @returns {module:Core/View.Viewport[]}
     */
    render() {
        let self = this;
        // 1. Get size of parent
        let widthTotal = this.coverMe.clientWidth,
            heightTotal = this.coverMe.clientHeight;

        // Useful for later, can bind more stuff
        let splitView = this.getMiniatureSplitView();
        let cells = splitView.layout.getLayoutCells();

        this.group.selectAll('*').remove();

        // And append event listeners
        let rects = this.group
            .selectAll('.cell')
            .data(cells)
            .enter()
            .append('rect')
            .attr('x', (cellInfo) => {
                return cellInfo.x0 * widthTotal;
            })
            .attr('y', (cellInfo) => {
                return cellInfo.y0 * heightTotal;
            })
            .attr('width', (cellInfo) => {
                return cellInfo.width * widthTotal;
            })
            .attr('height', (cellInfo) => {
                return cellInfo.height * heightTotal;
            })
            .attr('cellID', (cellInfo) => {
                return cellInfo.id;
            })
            .attr('class', 'subview-cell');

        let scaleAndNormalize = (mouse, subcellX0, subcellY0, subcellWidth, subcellHeight) => {


            return {
                x: mouse[0] / subcellWidth,
                y: mouse[1] / subcellHeight
            };
        }

        let rendererCells = {};

        rects.each(function (d) {
            let cell = d3.select(this);
            cell.selectAll('*').remove(); // Clean up old views

            // Now add the subviews
            let cellX0 = cell.attr('x'),
                cellY0 = cell.attr('y'),
                cellWidth = cell.attr('width'),
                cellHeight = cell.attr('height'),
                cellID = cell.attr('cellID');

            //let shortest = Math.min(cellWidth, cellHeight),
            //    longest = Math.max(cellWidth, cellHeight);

            // Add the group to hold the subcells
            let group = self.group.append('g')
                .attr('transform',
                    'translate(' + cellX0 + ',' + cellY0 + ')');

            let subcells = self.subcellLayout.calculateLayout({
                cellWidth: cellWidth,
                cellHeight: cellHeight
            });


            // Create a copy of the subcells array transformed into
            // direct viewport coordinates.
            rendererCells[cellID] = subcells.map(
                (subcell) => { // To HTML viewport coords
                    return subcell.toViewportCoordinates({
                        x: parseFloat(cellX0),
                        y: parseFloat(cellY0)
                    });
                }).map( // To normalized [0,1] coords
                (subcell) => {
                    return subcell.normalize(widthTotal, heightTotal);
                });

            group.selectAll('.subview-subcell').data(subcells).enter()
                .append('g') // Enclose in group for d3.mouse(this) to work
                .attr('transform', (subcell) => {
                    return 'translate(' + subcell.x0 + ',' + subcell.y0 + ')';
                })
                .append('rect')
                .attr('width', (subcell) => {
                    return subcell.width
                })
                .attr('height', (subcell) => {
                    return subcell.height
                })
                .attr('class', (subcell) => {
                    return 'subview-subcell-' + subcell.name
                })
                /*.on('click', function (subcell) {
                    let pos = d3.mouse(this);

                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'click',
                        pos: xy,
                        button: d3.event.button
                    });
                })*/
                .on('mousemove', function (subcell) {
                    d3.event.stopPropagation();
                    let pos = d3.mouse(this.parentNode);
                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'mousemove',
                        pos: xy,
                        button: d3.event.button
                    });
                })
                .on('mousedown', function (subcell) {
                    let pos = d3.mouse(this);
                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'mousedown',
                        pos: xy,
                        button: d3.event.button
                    });
                })
                .on('mouseup', function (subcell) {
                    let pos = d3.mouse(this);
                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'mouseup',
                        pos: xy,
                        button: d3.event.button
                    });
                })
                .on('mouseenter', function (subcell) {
                    let pos = d3.mouse(this);
                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'mouseenter',
                        pos: xy,
                        button: d3.event.button
                    });
                })
                .on('mouseout', function (subcell) {
                    let pos = d3.mouse(this);
                    let xy = scaleAndNormalize(pos, subcell.x0, subcell.y0, subcell.width, subcell.height);
                    self._handleEvent(cellID, subcell.name, {
                        type: 'mouseout',
                        pos: xy,
                        button: d3.event.button
                    });
                });


        });

        rects.remove();

        let hasContextMenu = ['Volume', 'Slicer'];

        for (let ctxOwner of hasContextMenu) {
            // Append context menu
            $('.subview-subcell-' + ctxOwner).contextMenu(menuInfos[ctxOwner].menu, {
                triggerOn: 'click'
            });

            menuInfos[ctxOwner].listen((item) => {
                InteractionModeManager.setInteractionMode(ctxOwner, item);
            });
        }



        return rendererCells;
    }

    _handleEvent(cellID, subcellName, event) {
        //console.log("_handleEvent(" + cellID + ", " + subcellName + ", " + event + ")");
        this.listener(cellID, subcellName, event);
    }
}

module.exports = MiniatureSplitViewOverlay;
