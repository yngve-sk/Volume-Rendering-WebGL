const _ = require('underscore');
const SplitBox = require('./splitbox');
const $ = require('jquery');
const d3 = require('d3');
const LinkGrouper = require('./link-group');

d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};
/** @module Widgets/View */

/**
    Represents a miniature rep of a split view.
    This will be used as a widget to split and link views.
    <br><br>
    *PRIVATE for each view: LINKS<br><br>
    SHARED for all views: Layout - the splitbox. See {@link module:Widgets/DataStructures.SplitBox}, using a message broadcast pattern to a master controller.

    <br><br>
    *The LINK views will only have linking options available.
    <br><br>
    *The NEW/REMOVE states will be exclusively available in the view splitter.
    <br><br>
    *RESIZING will be done directly in a {@link Widgets/View.MiniatureSplitViewOverlay} (TODO)
    @memberof module:Widgets/View
*/
class MiniatureSplitView {

    /**
     * Configuration options for a miniature split view
     * @typedef {Object} MiniatureSplitViewConfiguration
     * @property divID {string} - the html ID of the div to insert the split view into
     * @property aspectRatio {number} - the width/height ratio of this split view
     * @property state {string} - the initial state, one of the following: 'ADD', 'REMOVE', 'LINK-ADD', 'LINK-IN-PROGRESS'.
     * @property canAddRemove {bool} - Whether or not the view can add or remove cells. (Must correspond with the state parameter)
     * @property showIDs {bool} - Whether or not to display cell IDs
     * @property bottomTopThresholdPercentage {number} - range [0, 1], The percentage threshold (of the row height) at which the view cursor position snaps to being seen as IN BETWEEN two rows instead of on one.
     * @property {string[]} colors - An array of colors to use for linking - to distinguish between multiple link groups. Only needed for linking. The length of this array will be the max amount of link groups.
     *
     * @memberof module:Widgets/View
     **/

    /**
    * Constructs a new miniature split view
    * @class
    * @param {module:Widgets/View.MiniatureSplitViewConfiguration} args configuration
    * @constructor
    */
    constructor(args) {
        this.properties = {
            divID: args.divID,
            aspectRatio: args.aspectRatio,

            state: args.state,
            canLink: args.canLink,
            canAddRemove: args.canAddRemove,

            showIDs: args.showIDs,

            bottomTopThresholdPercentage: args.bottomTopThresholdPercentage,

            colors: args.colors
        };

        if (args.dispatcher)
            this.dispatcher = args.dispatcher;

        this.parent = $('#' + this.properties.divID);
        this.layout = new SplitBox(args.maxRows, args.maxColumns, args.aspectRatio);

        this.linkCache = {
            start: {
                row: -1,
                col: -1
            },
            end: {
                row: -1,
                col: -1
            }
        };

        this.linkGrouper = new LinkGrouper(this.properties.colors['LINKS'].length);
        this.linkLineCache = {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 0,
            color: 'black'
        };

        this.cache = {

        };

        this.linkChangedCallback = {};
    }

    setSplitbox(splitbox) {
        this.layout = new SplitBox(this.properties.maxRows,
            this.properties.maxColumns,
            this.properties.aspectRatio);
    }

    clear() {
        this.parent.html("");
    }

    refresh() {
        this.clear();
        this.render();
    }


    /* Initialize */
    render() {
        //console.log(d3);
        let svg = d3.select('#' + this.properties.divID).append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
        //let g = svg.append('g');
        //console.log(this.layout.flattenedLayoutPercentages);

        let width = this.parent.width(),
            height = this.parent.height();

        if (width === undefined && height === undefined) {
            width = this.parent.parent.width();
            height = this.parent.parent.height();
        }

        let self = this;

        let cooldown = 5;
        let current = 5;



        svg.append('rect')
            .attr('x', width)
            .attr('y', height)
            .attr('width', 0)
            .attr('height', 0)
            .attr('opacity', 1)
            .attr('class', 'halfRect').on('mouseout', function () {
                self.hideHalfRect();
            });

        svg.selectAll('.splitview-rect')
            .data(this.layout.flattenedLayoutPercentages)
            .enter().append('rect')
            .attr('class', function (d) {
                return "id-" + d.cellID + ' miniature-splitview-rect'
            })
            .attr('x', function (d) {
                return (d.x0 * width);
            })
            .attr('y', function (d) {
                return (d.y0 * height);
            })
            .attr('width', function (d) {
                return d.widthN * width;
            })
            .attr('height', function (d) {
                return d.heightN * height;
            })
            .on('mousemove', function (d) {
                if (current-- > 0)
                    return;
                else
                    current = cooldown;

                let mouse = d3.mouse(this);
                let x = mouse[0],
                    y = mouse[1];

                let rectWidth = width * d.widthN;
                let halfRectWidth = rectWidth / 2,
                    rectHeight = height * d.heightN;

                let x0Whole = (d.x0 * width);
                let isLeft = x < (halfRectWidth + x0Whole);

                let x0H = d.x0 * width + (isLeft ? 0 : halfRectWidth),
                    y0 = d.y0 * height;


                switch (self.properties.state) {
                    case 'REMOVE':
                        self.showRectAt(x0Whole, y0, rectWidth, rectHeight);
                        break;
                    case 'ADD':
                        let vCutOff = self.properties.bottomTopThresholdPercentage * rectHeight;

                        let topCutoff = vCutOff + y0,
                            bottomCutoff = y0 + rectHeight - vCutOff;

                        let isTop = y < topCutoff,
                            isBottom = y > bottomCutoff;

                        let topOrBot = isTop ? 'top' : (isBottom ? 'bottom' : '');
                        let direction = topOrBot !== '' ? topOrBot : (isLeft ? 'left' : 'right');

                        //console.log("Direction = " + direction);

                        if (!topOrBot)
                            self.showRectAt(x0H, y0, halfRectWidth, rectHeight, d.cellID);
                        else
                            self.showRectAt(0, isTop ? y0 : bottomCutoff, width, vCutOff, d.cellID);

                        break;
                    case 'LINK-ADD':
                        self.showRectAt(x0Whole, y0, rectWidth, rectHeight, d.cellID);
                        break;
                    case 'LINK-IN-PROGRESS':
                        self.showRectAt(x0Whole, y0, rectWidth, rectHeight, self.linkCache.start.id);
                        self.anchorLinkLineEndTo(x, y);
                        break;
                    case 'LINK-REMOVE':
                        //self.showRectAt(x0Whole, y0, rectWidth, rectHeight, self.linkCache.start.id);
                        break;

                }
            })
            .on('mouseleave', function (d) {
                self.hideHalfRect();
            })
            .on('click', function (d) {
                let mouse = d3.mouse(this);
                let x = mouse[0],
                    y = mouse[1];

                let halfRectWidth = (width * d.widthN) / 2,
                    rectHeight = height * d.heightN;

                let x0Whole = (d.x0 * width);

                let isLeft = x < (halfRectWidth + x0Whole);

                let x0H = d.x0 * width + (isLeft ? 0 : halfRectWidth),
                    y0 = d.y0 * height;

                let vCutOff = self.properties.bottomTopThresholdPercentage * rectHeight;

                let topCutoff = vCutOff + y0,
                    bottomCutoff = y0 + rectHeight - vCutOff;

                let isTop = y < topCutoff,
                    isBottom = y > bottomCutoff;

                let topOrBot = isTop ? 'top' : (isBottom ? 'bottom' : '');
                let direction = topOrBot !== '' ? topOrBot : (isLeft ? 'left' : 'right');

                //console.log("Direction = " + direction);

                self.mouseClick(d.rowIndex, d.cellIndex, direction,
                    (x0Whole + (halfRectWidth)),
                    (y0 + (rectHeight / 2)),
                    x, y
                );
            });

        if (this.properties.showIDs) {
            svg.selectAll('.splitview-label')
                .data(this.layout.flattenedLayoutPercentages)
                .enter()
                .append('text')
                .text(function (d) {
                    return d.cellID;
                })
                .attr('x', function (d) {
                    return (d.x0 * width) + (width * d.widthN) / 2;
                })
                .attr('y', function (d) {
                    return (d.y0 * height) + (height * d.heightN) / 2;
                });
        }

        if (this.properties.canLink) {
            let line = svg.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 0)
                .attr('class', 'linker-line')
                .moveToBack();
            this.drawLinkLineFromCache();
            this.applyLinkageColors();
        }
    }

    showRectAt(x0, y0, rectWidth, rectHeight, cellID) {
        //console.log("showRectAt(" + x0 + ", " + y0 + ", " + rectWidth + ", " + rectHeight + ")");
        let path = "#" + this.properties.divID + ">svg>rect.halfRect";
        //console.log(path);

        d3.select(path)
            .attr('x', x0)
            .attr('y', y0)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', this.getColor(cellID));
    }

    getLinkageColor(cellID) { // horrible design but we/e
        let prevState = this.properties.state;
        this.properties.state = 'LINK-ADD';

        let linkedColor = this.getColor(cellID);
        this.properties.state = prevState;
        return linkedColor;
    }

    getColor(cellID) {
        //this.linkGrouper.printMe();
        if (!_.contains(['LINK-ADD', 'LINK-IN-PROGRESS'], this.properties.state)) {
            return this.properties.colors[this.properties.state];
        } else {
            // 1. Get link group index
            //console.log("Links.length = " + this.linkGrouper.links.length);
            //let numLinks = this.linkGrouper.links.length;

            /*if (numLinks == 0)
                return this.properties.colors['LINKS'][0];
*/
            let index = this.linkGrouper.getLinkGroupIndexOfMember(cellID);
            if (index === -1)
                return this.properties.colors['LINKS'][this.linkGrouper.getNextGroupIndex()];
            else
                return this.properties.colors['LINKS'][index];
        }
    }


    hideHalfRect() {
        // console.log("hide half rect");
        d3.select("#" + this.properties.divID + ">svg>rect.halfRect")
            .attr('width', 0)
            .attr('height', 0);
    }

    anchorLinkLineStartTo(x, y) {
        //console.log("anchorLinkLineStartTo(" + x + ", " + y + ")")
        d3.select("#" + this.properties.divID + ">svg>line.linker-line")
            .attr('x1', x)
            .attr('y1', y);
    }

    anchorLinkLineEndTo(x, y) {
        //console.log("anchorLinkLineTo(" + x + ", " + y + ")")
        d3.select("#" + this.properties.divID + ">svg>line.linker-line")
            .attr('x2', x)
            .attr('y2', y);
    }


    drawLinkLineFromCache() {
        d3.select("#" + this.properties.divID + ">svg>line.linker-line")
            .attr('x1', this.linkLineCache.x1)
            .attr('y1', this.linkLineCache.y1)
            .attr('x2', this.linkLineCache.x2)
            .attr('y2', this.linkLineCache.y2)
            .attr('stroke', 'black')
    }

    applyLinkageColors() {
        for (let linkGroup of this.linkGrouper.links) {
            for (let cellID of linkGroup) {
                let color = this.getLinkageColor(cellID);
                d3.select('#' + this.properties.divID + '>svg>rect.id-' + cellID + ".miniature-splitview-rect")
                    .attr('fill', color);
            }
        }
    }

    updateLinkLineCache(x1, y1, x2, y2, id) {
        this.linkLineCache = {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        }
    }

    unlinkCellID(id) {
        this.linkGrouper.ungroupMember(id);
    }

    mouseClick(row, col, direction, centerX, centerY, mouseX, mouseY) {
        let id = -1;
        switch (this.properties.state) {
            case 'ADD':
                if (direction === 'left' || direction === 'right')
                    this.layout.addCellToRow(row, col, direction === 'left');
                else
                    this.layout.addRowAt(row, direction === 'top');
                this.dispatcher('refresh', []);
                return;
            case 'REMOVE':
                id = this.layout.removeCellAt(row, col);
                //console.log("Removed cell @ ID: " + id);
                this.dispatcher('unlinkCellID', [id]);
                this.dispatcher('refresh', []);
                return;
            case 'LINK-ADD':
                if (this.layout.getNumberOfActiveCells() === 1)
                    return;

                id = this.layout.getCellID(row, col);
                this.linkCache.start = {
                    id: id
                };

                this.linkGrouper.addGroupIfDoesntExistForMemberWithId(id);

                this.updateLinkLineCache(centerX, centerY, mouseX, mouseY, this.linkCache.start.id);
                this.anchorLinkLineStartTo(centerX, centerY);
                this.anchorLinkLineEndTo(mouseX, mouseY);

                this.properties.state = 'LINK-IN-PROGRESS';
                break;
            case 'LINK-IN-PROGRESS':
                id = this.layout.getCellID(row, col);
                if (id === this.linkCache.start.id) {
                    this.properties.state = 'LINK-ADD';
                    this.linkGrouper.removeIfContainsOnlyOneMember(id);
                    this.flushLinkCache();
                    break;
                } else if (this.linkGrouper.isMembersInSameGroup(id, this.linkCache.start.id)) {
                    this.properties.state = 'LINK-ADD';
                    this.flushLinkCache();
                    break;
                }

                this.linkCache.end = {
                    id: this.layout.getCellID(row, col)
                }

                this.consumeLinkCache();
                this.properties.state = 'LINK-ADD';
                this.flushLinkCache();
                this.linkDidChange();
                break;
            case 'LINK-REMOVE':
                this.linkGrouper.ungroupMember(this.layout.getCellID(row, col));
                break;
        }

        this.clear();
        this.render();
    }



    flushLinkCache() {
        this.linkCache = {
            start: {
                id: -1
            },
            end: {
                id: -1
            }
        };
        this.linkLineCache = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        };
    }

    consumeLinkCache() {
        // 1. Check if start is already in a linked group
        let groupIndexOfStart = this.linkGrouper.getLinkGroupIndexOfMember(this.linkCache.start.id);

        if (groupIndexOfStart === -1) { // no group found, create a new one.
            let groupIndex = this.linkGrouper.addNewLinkGroup(this.linkCache.start.id);
            this.linkGrouper.addMemberToGroup(groupIndex, this.linkCache.end.id);
        } else {
            this.linkGrouper.ungroupMember(this.linkCache.end.id); // Ungroup it from old grp
            this.linkGrouper.addMemberToGroup(groupIndexOfStart, this.linkCache.end.id);
        }

        this.flushLinkCache();
    }

    changeState(newState) {
        this.properties.state = newState;
    }

    getParentBounds() {
        let innerWidth = parent.width();
        let innerHeight = parent.height();
        let outerWidth = parent.outerWidth();
        let outerHeight = parent.outerHeight();

        let paddingX = (outerWidth - innerWidth) / 2;
        let paddingY = (outerHeight - innerHeight) / 2;

        let bounds = {
            x0: paddingX,
            y0: paddingY,
            x1: paddingX + innerWidth,
            y1: paddingY + innerHeight,
            width: innerWidth,
            height: innerHeight
        };

        return bounds;
    }

    linkDidChange() {
        if (this.linkChangedCallback.callback)
            this.linkChangedCallback.callback(this.linkChangedCallback.key);
    }

    setLinkChangedCallback(key, callback) {
        this.linkChangedCallback = {
            key: key,
            callback: callback
        }
    }

}

module.exports = MiniatureSplitView;
