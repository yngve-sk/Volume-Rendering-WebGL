let d3 = require('d3');
let VolumeDataset = require('../../core/environment').VolumeDataset;
let $ = require('jquery');
//let ColorGradient = require('./color-gradient');
let Environment = require('../../core/environment');

let TFEditorSettings = require('../../core/settings').Widgets.TransferFunction.Editor;

// D3 drag nad double click don't work well together, drag seems to override
// dblclick...
let TIME = Date.now(); // Used for timing mouse events etc
let dblClickWait = 300;
let mouseupmousedowntimeout = 300;
let clickTimeout = null;
let awaitingClick = false;
let awaitingDoubleClick = false;

/**
 * Represents the front-end of the transfer function editor.
 * Reads in user actions and writes to underlying objects,
 * which are read by the renderer. This element is self-contained
 * and shouldn't require any other input than user input via
 * the GUI.
 *
 * @class
 * @memberof module:Widgets/TransferFunction
 */
class TransferFunctionEditor {
    /**
     * Options for what to display in the transfer function editor.
     * @typedef {Object} DisplayOptions
     * @property {bool} showHistogram - Whether or not to display the histogram
     * @property {bool} showHistogramSelection - Whether or not to display the histogram selection (will be highlighted @ renderer)
     * @property {bool} show3DSelectionHistogram - Whether or not to show the histogram values of the selection made in the current renderer view bound to this editor
     * @property {bool} showTransferFunction - Whether or not to show the transfer function splines and control points
     * @memberof module:Widgets/TransferFunction
     */


    /**
    * Constructs a new TF editor
    * @param {module:Widgets/TransferFunction.DisplayOptions} displayOptions
    * @param {function} getInteractionMode - Function to fetch the current interaction mode as set in the GUI. Will return 'Select' or 'TF'.
    * @param {number} $scope$id - Angularjs ID of the view this editor will be embedded into. This ID is inserted into the classlists (ng-id-$scope$id) of some DOM elements in use by this editor.
    * @param {string} EnvironmentTFKey - The environment transfer function view key. Differs from $scope$id. This key is either 'LOCAL' or 'GLOBAL', representing one
    of the two active TF editors. the 'LOCAL' and 'GLOBAL' TFs have slightly different
    behaviors.
    * @constructor
    */
    constructor(displayOptions, getInteractionMode, $scope$id, EnvironmentTFKey) {
        //this.canvas = document.querySelector('.tf-canvas.ng-id-' + $scope$id);
        this.svgContainer = document.querySelector('.tf-d3-container.ng-id-' + $scope$id);
        this.$scope$id = $scope$id;
        this.EnvironmentTFKey = EnvironmentTFKey;

        /************************************************************/
        /**********           BINDINGS TO ENVIRONMENT      **********/
        /************************************************************/

        this.tfModel = null;

        this.histogram = null;
        this.histogramSelectionRef = null;
        this.colorGradientObject = null;
        this.controlPoints = null;

        this.notifyDatasetDidChange = () => {
            console.log("DatasetDidChange " + EnvironmentTFKey);
            this._updateDatasetModel();
        }

        this.notifyTFModelDidChange = () => {
            this._updateTFModel();
        }

        //Environment.listen('TFModelDidChange', EnvironmentTFKey, this.notifyTFModelDidChange);

        //Environment.listen('DatasetDidChange', EnvironmentTFKey, this.notifyDatasetDidChange);



        /************************************************************/
        /************************************************************/
        /************************************************************/

        /*------------------------------------------------*/
        /*                    ELEMENTS                    */
        /*------------------------------------------------*/
        this.container = null; // Container of it all

        this.svgMain = null; // SVG container

        this.eventListenerRect = null; // Event handler transparent rect
        this.histogramSelectionGroup = null; // Displays histogram of selection @ 3D view
        this.histogramGroup = null; // Displays the histogram itself
        this.transferFunctionGroup = null; // Displays TF, control points + spline
        this.transferFunctionControlPointGroup = null; // Overlays control points on top for ez
        // event handling, i.e they should precede the fucking event listener rect.

        this.canvas = null; // Canvas to render pixels onto
        this.canvasContext = null;

        this.colorGradientRect = null; // Color gradient @ bottom
        this.colorGradientRectContainer = null;
        this.colorGradientControlPointsGroup = null;

        //this.colorGradientObject = new ColorGradient();
        this.defs = null;

        this.isovalueAxis = null;
        this.opacityAxis = null;

        this.colorPicker = null;

        /*------------------------------------------------*/
        /*------------------------------------------------*/
        /*------------------------------------------------*/


        /*------------------------------------------------*/
        /*     INTERACTION STATES, OPTIONS & MODELREF     */
        /*------------------------------------------------*/
        this.getInteractionMode = getInteractionMode;
        /*

                this.options = {
                    leftAxisWidthPercentage: 0.07,
                    bottomAxisHeightPercentage: 0.25,
                    isoValueAxisHeightPercentage: 0.110,
                    curve: d3.curveLinear,
                    controlPointSplineCurve: d3.curveLinear,
                    contentTopPaddingPercentage: 0.2,
                    content: {
                        circleRadius: 5.5
                    },
                    canvas: {
                        texturePreviewHeightPercentage: 0.2
                    },
                    colorGradient: {
                        triangleSize: 35,
                        crossSize: 35,
                        trianglesGroupTranslateY: -8,
                        crossTranslateY: 14
                    }
                };
        */

        this.originalSize = {
            total: {
                width: -1,
                height: -1
            },
            content: {
                width: -1,
                height: -1
            }
        };
        this.scale = {
            x: 1,
            y: 1
        }; // Recalc on each resize

        this.scales = {
            content: {
                x: null,
                y: null
            },
            total: {
                x: null,
                y: null
            }
        }

        this.displayOptions = displayOptions;

        this.isothreshold = {
            min: 0,
            max: 4095
        }

        /*------------------------------------------------*/
        /*------------------------------------------------*/
        /*------------------------------------------------*/

        /*------------------------------------------------*/
        /*           CONTROL POINTS & EVENT CACHE         */
        /*------------------------------------------------*/
        //this.controlPoints = [];
        this.dragged = null;
        this.selectedControlPoint = null;

        this.transferFunctionSelection = {
            p1: {
                x: -1,
                y: -1
            },
            p2: {
                x: -1,
                y: -1
            }
        };


        this.colorGradientState = {
            selectedIndex: -1, // Index of selected point (if dragging)
            isAwaitingColorSelection: false
        };

        this.colorGradientControlPointsState = {
            selectedIndex: -1,
            isDragging: false
        }

        /*------------------------------------------------*/
        /*------------------------------------------------*/
        /*------------------------------------------------*/

        this._init($scope$id); // Declaring the elems above is just for clarity
        // _init initializes them all and injects them into the DOM!
        this._resize();

        /* call _resize() whenever window resizes! */
        window.addEventListener('resize', () => {
            this._resize()
        }, false);

        window.addEventListener('resizeTFEditor', () => {
            this._resize()
        }, false);

        d3.select(window).on("keydown", () => {
            this._keydown();
        });

        //console.log(this.tfModel);
        //console.log(Environment);
    }

    _getModel() {
        return Environment.getTransferFunctionForTFEditor(this.EnvironmentTFKey);
    }

    _getHistogram() {
        return Environment.getHistogramForTFEditor(this.EnvironmentTFKey);
    };

    setHistogram(histogramOBJ) {
        let numEntries = Object.keys(histogramOBJ).length;

        this.histogram = new Uint8Array(numEntries);

        for (let i = 0; i < numEntries; i++)
            this.histogram[i] = histogramOBJ[i];
    }

    _getHistogramSelections() {
        Environment.getHistogramSelectionsForTFEditor(this.EnvironmentTFKey)
    }

    _get3DViewSelectionHistogram() {
        Environment.get3DViewSelectionsHistogramForTFEditor(this.EnvironmentTFKey)
    }

    setTFModel(model) {
        this.tfModel = model;
        this.colorGradientObject = model.colorGradient;
        this.controlPoints = model.controlPoints;
        this._refreshColorGradient();
        this.render();
    }

    _updateTFModel() {
        this.tfModel = this._getModel();
        this.colorGradientObject = this.tfModel.colorGradient;
        this.controlPoints = this.tfModel.controlPoints;
        this._refreshColorGradient();
        this.render();
    }

    _updateDatasetModel() {
        //this.histogram = this._getHistogram();
        //this.histogramSelection = this._getHistogramSelections();
        //this.viewSelectionHistogram = this._get3DViewSelectionHistogram();
    }

    notifyModelDidChange() {
        this._updateTFModel();
    }


    _init() {
        this.container = document.querySelector('.tf-editor-container.ng-id-' + this.$scope$id);

        this.canvas = d3.select(this.container)
            .append('canvas')
            .attr('class', 'tf-editor-background-canvas ng-id' + this.$scope$id)
            .attr('width', 400)
            .attr('height', 400); // 400x400 pixels to render on

        this.svgMain = d3.select(this.container)
            .append('svg')
            .attr('class', 'tf-editor-svg-container');

        //.attr('width', '100%')
        //.attr('height', '100%');

        // Used to scale groups and their children,
        //will also be basis for the original coord system.
        let res = TFEditorSettings.Resolution;
        let sizes = this._getSizesFromTotal(res.width, res.height);

        this.originalSize.total = sizes.total;
        this.originalSize.content = sizes.content;


        this.histogramGroup = this.svgMain.append('g')
            .attr('class', 'tf-editor-full-histogram-group');

        this.histogramSelectionGroup = this.svgMain.append('g')
            .attr('class', 'tf-editor-3d-selection-histogram-group');

        this.transferFunctionGroup = this.svgMain.append('g')
            .attr('class', 'tf-editor-tf-view-group');

        this.eventListenerRect = this.svgMain.append('rect')
            .attr('class', 'tf-editor-event-listener-rect')
            .on('mousedown', () => {
                d3.event.stopPropagation();
                this._mousedown();
            })
            .on('mouseup', () => {
                d3.event.stopPropagation();
                this._mouseup();
            })
            .on('mousemove', () => {
                d3.event.stopPropagation();
                this._mousemove();
            });

        this.transferFunctionControlPointGroup = this.svgMain.append('g');



        //this.canvasContext = this.canvas.node().getContext(); TODO BITMAP

        let self = this;

        this.colorGradientRectContainer = this.svgMain.append('g');

        this.colorGradientRect = this.colorGradientRectContainer.append('rect')
            .attr('class', 'tf-editor-color-gradient-axis')
            .on('mousedown', function () {
                d3.event.stopPropagation();
                self._colorGradientMouseDown(d3.mouse(this));
            })
            .on('mouseup', function () {
                d3.event.stopPropagation();
                self._colorGradientMouseUp(d3.mouse(this));
            })
            .on('mousemove', function () {
                d3.event.stopPropagation();
                self._colorGradientMouseMove(d3.mouse(this));
            })
            .attr('width', sizes.content.width)
            .attr('height', sizes.bottomAxis.colorGradientRect.height);

        this.colorGradientControlPointsGroup = this.colorGradientRectContainer.append('g')
            .attr('class', 'tf-editor-color-gradient-control-points');
        //            .on('mousemove', () => {
        //                //        this.colorGradientControlPointsState = {
        //                //            selectedIndex: -1,
        //                //            isDragging: false
        //                //        }
        //                if (!this.colorGradientControlPointsState.isDragging)
        //                    return;
        //
        //                console.log("Mouse move!");
        //                let mouse = d3.mouse(this.colorGradientRectContainer.node());
        //                let mx = this.scales.content.x.invert(mouse[0]);
        //
        //                this.colorGradientControlPointsState.selectedIndex = this.colorGradientObject.moveControlPoint(
        //                    this.colorGradientControlPointsState.selectedIndex,
        //                    mx * 100);
        //                this._refreshColorGradient();
        //
        //                console.log("colorGradientControlPointsGroup.mouseMove...");
        //                console.log("relativeX = " + mx);
        //            });

        // JQuery records the events after d3 has. it FUCKS SHIT UP!
        // tried .off() and .unbind() but only this seems to work
        $(this.colorGradientRect.node()).on('click', function () {
            return false;
        });
        $(this.colorGradientRect.node()).on('mouseup', function () {
            return false;
        });
        $(this.colorGradientRect.node()).on('mousemove', function () {
            return false;
        });

        this.isovalueAxis = this.svgMain.append('g')
            .attr('class', 'tf-editor-axis-isovalue');

        this.opacityAxis = this.svgMain.append('g')
            .attr('class', 'tf-editor-axis-opacity');

        this.defs = this.svgMain.append('defs');
        this.colorGradient = this.defs.append('linearGradient')
            .attr('id', 'linear-gradient-' + this.$scope$id);

        $(".tf-editor-color-picker-container.ng-id-" + this.$scope$id + ">input").spectrum({

        }); // Initialize color picker
        this.colorPicker = $(".tf-editor-color-picker-container.ng-id-" + this.$scope$id + ">input");

        this.colorPicker.spectrum({
            move: (tinycolor) => {
                this._colorPicked(tinycolor, false);
                return false;
            },
            change: (tinycolor) => {
                this._colorPicked(tinycolor, true);
                return false;
            },
            hide: (tinycolor) => {
                this._colorNotPicked();
            }
        });
        /* this.colorPicker.on('change', (tinycolor) => {
             this._colorPicked(tinycolor, true);
         });
         this.colorPicker.on('move', (tinycolor) => {
             this._colorPicked(tinycolor, false);
         });
         this.colorPicker.on('hide', (tinycolor) => {
             this._colorPicked(tinycolor, true);
         });*/
    }


    _colorNotPicked() {
        if (this.colorGradientState.selectedIndex === -1)
            return;
        this.colorGradientObject.removeControlPointAtIndex(this.colorGradientState.selectedIndex);

        this.colorGradientState.selectedIndex = -1;
        this.colorGradientState.isAwaitingColorSelection = false;

        this._refreshColorGradient();
    }

    _colorPicked(tinycolor, isFinal) {
        let rgb = this.colorPicker.spectrum('get').toHexString();
        //console.log("color set to: " + rgb);
        //
        //        console.log(this.colorGradientObject);
        //        console.log("Color " + rgb + " selected " + (isFinal ? 'FINALLY ' : 'TEMPORARILY') + ' @ index ' + this.colorGradientState.selectedIndex);

        this.colorGradientObject.setColorAt(this.colorGradientState.selectedIndex, rgb);
        this._refreshColorGradient();

        if (isFinal) {
            this.colorGradientState.selectedIndex = -1;
            this.colorGradientState.isAwaitingColorSelection = false;
        }

    }



    _resize() {
        // Step1, calculate the sizing relative to clientwidth/height of the SVG!
        this.sizes = this._getSizes();

        this.scale = { // Recalc the scale
            x: this.sizes.total.width / this.originalSize.total.width,
            y: this.sizes.total.height / this.originalSize.total.height
        };

        this.scales.content.x = d3.scaleLinear().domain([0, 1]).range([0, this.sizes.content.width]);
        this.scales.content.y = d3.scaleLinear().domain([1, 0]).range([0, this.sizes.content.height]);

        this.scales.total.x = d3.scaleLinear().domain([0, 1]).range([0, this.sizes.total.width]);
        this.scales.total.y = d3.scaleLinear().domain([1, 0]).range([0, this.sizes.total.height]);


        let circleRadius = TFEditorSettings.TransferFunctionDisplay.circleRadius;

        let pp = 2;

        this.eventListenerRect
            .attr('x', this.sizes.content.x0 - pp * circleRadius)
            .attr('y', this.sizes.content.y0 - pp * circleRadius)
            .attr('width', this.sizes.content.width + pp * 2 * circleRadius)
            .attr('height', this.sizes.content.height + pp * 2 * circleRadius);

        this.histogramSelectionGroup
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.content.y0 + ') ' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.histogramGroup
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.transferFunctionGroup
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.content.y0 + ')');
        //+'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.transferFunctionControlPointGroup
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.content.y0 + ')');
        //+'scale(' + this.scale.x + ', ' + this.scale.y + ')');
        this._refreshTransferFunctionSplinesAndControlPoints();

        let texturePreviewHeightPercentage = TFEditorSettings.Layout.texturePreviewHeightPercentage;

        this.canvas
            .style('left', this.sizes.content.x0)
            .style('top', this.sizes.content.y0 - this.sizes.content.height * texturePreviewHeightPercentage)
            .style('width', this.sizes.content.width)
            .style('height', this.sizes.content.height * (1 + texturePreviewHeightPercentage));

        //    this.colorGradientRect
        //        .attr('x', this.sizes.content.x0)
        //        .attr('y', this.sizes.bottomAxis.colorGradientRect.y0)
        //        .attr('width', this.sizes.content.width)
        //        .attr('height', this.sizes.bottomAxis.colorGradientRect.height);


        this.colorGradientRectContainer
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.bottomAxis.colorGradientRect.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')'
            );
        //console.log(this.colorGradientRect.node().getBoundingClientRect());

        this.colorGradientControlPointsGroup
            .attr('transform',
                'translate(' + 0 + ', ' + -8 + ')');

        this.isovalueAxis
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.bottomAxis.isovalues.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.opacityAxis
            .attr('transform',
                'translate(' + this.sizes.content.x0 + ', ' + this.sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');
    }

    _getSizesFromTotal(totalWidth, totalHeight) {
        let layout = TFEditorSettings.Layout;

        let contentY0 = layout.contentTopPaddingPercentage * totalHeight;

        let contentWidth = (1 - layout.leftAxisWidthPercentage) * totalWidth,
            contentHeight = (1 - layout.bottomAxisHeightPercentage - layout.contentTopPaddingPercentage) * totalHeight;

        let bottomAxisY0 = contentY0 + contentHeight,
            bottomAxisIsovaluesHeight = layout.isoValueAxisHeightPercentage * totalHeight,
            bottomAxisColorGradientRectY0 = bottomAxisY0 + bottomAxisIsovaluesHeight,
            bottomAxisColorGradientRectHeight = totalHeight - bottomAxisColorGradientRectY0;


        return {
            total: {
                width: totalWidth,
                height: totalHeight
            },
            content: {
                x0: layout.leftAxisWidthPercentage * totalWidth,
                y0: contentY0,
                width: contentWidth,
                height: contentHeight
            },
            bottomAxis: {
                isovalues: {
                    y0: bottomAxisY0,
                    height: bottomAxisIsovaluesHeight
                },
                colorGradientRect: {
                    y0: bottomAxisY0 + bottomAxisIsovaluesHeight,
                    height: totalHeight - (bottomAxisY0 + bottomAxisIsovaluesHeight)
                }
            }
        };
    }

    _getSizes() {
        let totalWidthPX = this.svgMain.style('width'),
            totalHeightPX = this.svgMain.style('height');

        let totalWidth = parseFloat(totalWidthPX.replace('px', '')),
            totalHeight = parseFloat(totalHeightPX.replace('px', '')) * 0.9;

        return this._getSizesFromTotal(totalWidth, totalHeight);

    }

    _clear() {
        this._clearHistogramSelection();
        this._clearHistogram();
        this._clearTransferFunction();
        this._clearColorGradient();
        this._renderColorGradient(this._getSizes());
        // Empty the contents of all

        // TODO!
        //this.canvasContext.save();
        //
        //        // Use the identity matrix while clearing the canvas
        //        this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        //        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        //
        //        // Restore the transform
        //        this.canvasContext.restore();
    }

    _clearHistogramSelection() {
        this.histogramSelectionGroup.selectAll('*').remove();

    }

    _clearHistogram() {
        this.histogramGroup.selectAll('*').remove();

    }

    _clearTransferFunction() {
        this.transferFunctionGroup.selectAll('*').remove();
        this.transferFunctionControlPointGroup.selectAll('*').remove();
    }

    _clearColorGradient() {
        this.colorGradientControlPointsGroup.selectAll('*').remove();
    }

    _refreshHistogram() {
        this._clearHistogram();
        this._renderHistogram();
    }

    _refreshHistogramSelection() {
        this._clearHistogramSelection();
        this._renderHistogramSelection();
    }

    _refreshTransferFunction() {
        this._clearTransferFunction();

        this._renderTransferFunction();
        this._renderColorGradientOntoCanvas();
    }

    _refreshTransferFunctionSplinesAndControlPoints() {
        this._clearTransferFunction();
        this._renderTransferFunction();
    }

    _refreshColorGradient() {
        this._clearColorGradient();
        this._renderColorGradientRect();
        this._renderColorGradientControlPoints(this._getSizes());
        this._renderColorGradientOntoCanvas();
    }

    _refreshColorGradientExceptPoints() {
        this._renderColorGradientRect();
        this._renderColorGradientOntoCanvas();
    }

    /**
     * Renders the data currently linked to this view.
     */
    render() {
        this._clear();
        let sizes = this._getSizes();

        this._renderHistogramSelection(sizes);
        this._renderHistogram(sizes);
        this._renderTransferFunction();

        this._renderColorGradient(sizes);
        this._renderColorGradientOntoCanvas(sizes);
        this._renderAxes(sizes);

        //this._renderColorOpacityBitmap();
    }

    _notifyTFDidChange() {
        console.log("_notifyTFDidChange(" + this.EnvironmentTFKey + ")");
        Environment.notifyTransferFunctionDidChangeAtEditor(this.EnvironmentTFKey);
    }

    _renderHistogramSelection(sizes) {
        if (!this.displayOptions.showHistogramSelection)
            return;

        let histogram = this._getHistogramSelections();
        if (!histogram || histogram.length === 0)
            return;

        let yDomain = d3.extent(histogram),
            yRange = [this.originalSize.content.height, 0];

        if(this.displayOptions.applyThreshold) {
            let yThresholded = new Uint8Array(histogram.length);
            for(let i = this.isothreshold.min; i < this.isothreshold.max; i++)
                yThresholded[i] = histogram[i];

            yDomain = d3.extent(yThresholded);
        }

        let xDomain = [0, histogram.length - 1],
            xRange = [0, this.originalSize.content.width];

        let yScale = d3.scaleLinear().domain(yDomain).range(yRange),
            xScale = d3.scaleLinear().domain(xDomain).range(xRange);

        let line = d3.line()
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y((isovalue, i) => {
                return yScale(isovalue);
            });

        let area = d3.area()
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y1((isovalue, i) => {
                return yScale(isovalue);
            })
            .y0(yRange[0]);

        this.histogramSelectionGroup
            .append('path')
            .datum(histogram)
            .attr('d', line)
            .attr('class', 'tf-editor-3d-selection-histogram-line');

        this.histogramSelectionGroup
            .append('path')
            .datum(histogram)
            .attr('d', area)
            .attr('class', 'tf-editor-3d-selection-histogram-area');
    }

    updateIsoThreshold(min, max) {
        this.isothreshold = {
            min: min,
            max: max
        }

        this._refreshHistogram();
        this._refreshHistogramSelection();
    };

    _renderHistogram(sizes) {
        if (!this.displayOptions.showHistogram)
            return;

        let histogram = this.histogram;
        if (!histogram || histogram.length === 0)
            return;

        let yDomain = d3.extent(histogram),
            yRange = [this.originalSize.content.height, 0];


        if(this.displayOptions.applyThreshold) {
            let yThresholded = new Uint8Array(histogram.length);
            for(let i = this.isothreshold.min; i < this.isothreshold.max; i++)
                yThresholded[i] = histogram[i];

            histogram = yThresholded;
            yDomain = d3.extent(yThresholded);
        }

        // Displace to make it work as log-scale
        yDomain[0] += 1;
        yDomain[1] += 1;

        let xDomain = [0, histogram.length - 1],
            xRange = [0, this.originalSize.content.width];

        let yScale = d3.scaleLog().domain(yDomain).range(yRange),
            xScale = d3.scaleLinear().domain(xDomain).range(xRange);

        let line = d3.line()
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y((isovalue, i) => {
                let y = yScale(isovalue + 1);
                if (y === Infinity) {
                    console.log("y is inf... wtf?");
                }
                return y;
            });

        let area = d3.area()
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y1((isovalue, i) => {
                let y = yScale(isovalue + 1);
                if (y === Infinity) {
                    console.log("y is inf... wtf?");
                }

                return yScale(y);
            })
            .y0(yRange[0]);

        this.histogramGroup
            .append('path')
            .datum(histogram)
            .attr('d', line)
            .attr('class', 'tf-editor-histogram-line');

        this.histogramGroup
            .append('path')
            .datum(histogram)
            .attr('d', area)
            .attr('class', 'tf-editor-histogram-area');
    }

    _renderTransferFunction() {
        if (!this.displayOptions.showTransferFunction)
            return;

        if (this.controlPoints === null) // || this.controlPoints.length === 0)
            return;

        this._renderControlPointSplines();
        this._renderControlPoints();
    }

    _renderControlPointSplines() {
        if (!this.displayOptions.showTransferFunction)
            return;

        this.splines = d3.line()
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((d) => {
                return this.scales.content.x(d[0]);
            })
            .y((d) => {
                return this.scales.content.y(d[1]);
            });

        this.transferFunctionGroup
            .append('path')
            .datum(this.controlPoints)
            .attr('class', 'tf-splineline')
            .attr('d', this.splines);
    }

    _renderControlPoints() {
        if (!this.displayOptions.showTransferFunction)
            return;

        let circles = this.transferFunctionControlPointGroup.selectAll(".circle")
            .data(this.controlPoints);
        let self = this;
        let circleRadius = TFEditorSettings.TransferFunctionDisplay.circleRadius;

        var dragCircle = d3.drag()
            .on('start', function (d) {
                d3.event.sourceEvent.stopPropagation();
                //d3.event.sourceEvent.preventDefault();
                self.selected = self.dragged = d;
            })
            .on('drag', () => {
                this._mousemove();
            })
            .on('end', () => {
                this._mouseup();
            });




        let click = () => {
            console.log("Click!");
            if (Date.now() - TIME < dblClickWait && awaitingDoubleClick) { // dblclick!
                clearTimeout(clickTimeout); // Stop normal click event
                //                alert("Dblclick!");
                this._removeSelectedControlPoint();
                awaitingDoubleClick = false;
            } else {
                TIME = Date.now();
                awaitingDoubleClick = true;
                clickTimeout = setTimeout(() => {
                    awaitingDoubleClick = false;
                    //                    alert("Click!");
                    this._moveSelectedControlPointToBottom();
                }, dblClickWait);

                awaitingClick = false;
            }
        }

        circles.enter().append("circle")
            .attr("r", circleRadius)
            .attr('class', 'tf-editor-control-point')
            .on("mousedown", function (d) {
                self.selected = self.dragged = d;
                self._mousedown();
                TIME = Date.now();
                awaitingClick = true;
            })
            .on("mouseup", () => {
                this._mouseup();
                if (awaitingDoubleClick || Date.now() - TIME < mouseupmousedowntimeout) {
                    click();
                }
                awaitingClick = false;
            })
            .on('mouseenter', function () {
                d3.select(this).classed('selected', true);
                awaitingClick = false;
            })
            .on('mouseout', function (d) {
                d3.select(this).classed('selected', self.selected === d);
                if (self.selected === d) {
                    self._clearTransferFunction();
                    self._renderTransferFunction();
                }
            })
            .on("mousemove", () => {
                this._mousemove();
                awaitingClick = false;
            })
            /*.on('click', () => {
                console.log("Click!");
                if (Date.now() - TIME < clickWait) { // dblclick!
                    clearTimeout(clickTimeout); // Stop normal click event
                    alert("Dblclick!");
                } else {
                    TIME = Date.now();
                    clickTimeout = setTimeout(() => {
                        alert("Click!");
                    }, clickWait);
                }
            })*/
            .attr("cx", (d) => {
                return this.scales.content.x(d[0]);
            })
            .attr("cy", (d) => {
                return this.scales.content.y(d[1]);
            })
            .classed("selected", (d) => {
                return d === this.selected;
            })
            .attr("r", circleRadius)
        //.call(dragCircle);



        circles

            .attr("cx", (d) => {
                return this.scales.content.x(d[0]);
            })
            .attr("cy", (d) => {
                return this.scales.content.y(d[1]);
            });

        circles.exit().remove();
    }


    _renderColorGradient(sizes) {
        if (!this.colorGradientObject) // || this.colorGradientObject.gradient.length === 0)
            return;

        this._renderColorGradientRect();
        this._renderColorGradientControlPoints(sizes);
    }

    _renderColorGradientRect() {
        let gradient = this.colorGradientObject.gradient;

        let sorted = this.colorGradientObject.gradient.sort((a, b) => {
            return a.offset - b.offset;
        });

        this.defs.remove();
        this.defs = this.svgMain.append('defs');
        this.colorGradient = this.defs.append('linearGradient')
            .attr('id', 'linear-gradient-' + this.$scope$id);

        //this.colorGradient.selectAll('*').delete();

        //for (let d of sorted) {
        //    this.colorGradient
        //        .append('stop')
        //        .attr('offset', d.offset + '%')
        //        .attr('stop-color', d.color) L
        //}

        this.colorGradient.selectAll('stop')
            .data(sorted)
            .enter().append('stop')
            .attr('offset', (d) => {
                return d.offset + '%'
            })
            .attr('stop-color', (d) => {
                return d.color;
            }).exit().remove();

        // Apply the gradient to the rect
        this.colorGradientRect.style('fill', 'url(#linear-gradient-' + this.$scope$id + ')');
    }

    /*  _renderColorGradientOntoCanvas(sizes) {
            let canvasNode = this.canvas.node();
            let context = canvasNode.getContext('2d', {
                alpha: true
            });

            let splines = d3.line() // Used for opacity TF stuff
                .curve(TFEditorSettings.TransferFunctionDisplay.curve)
                .x((d) => {
                    return x(d[0]);
                })
                .y((d) => {
                    return y(d[1]);
                });

            let cWidth = canvasNode.width,
                cHeight = canvasNode.height;

            let x0 = 0,
                x1 = cWidth,
                y0 = cHeight / 2,
                y1 = y0;


            let colorGradient = context.createLinearGradient(x0, y0, x1, y1);
            let opacityGradient = context.createLinearGradient(x0, y0, x1, y1);

            for (let point of this.colorGradientObject.gradient) {
                colorGradient.addColorStop(point.offset / 100, point.color);
            }

            for (let point of this.controlPoints) {
                let opacity = parseInt(Math.round(point[1] * 255));; // only linear interp. for now.
                opacityGradient.addColorStop(point[0], 'rgba(' + opacity + ', ' + opacity + ',' + opacity + ',1)');
            }

            context.fillStyle = opacityGradient;
            context.fillRect(0, 0, canvasNode.width, canvasNode.height);

            // Now extract the interpolated pixels
            let imgData = context.getImageData(0, 0, canvasNode.width, 1);

            let data = imgData.data;
            let width = imgData.width;

            let opacities = new Uint8ClampedArray(width);

            for (let i = 0; i < width * 4; i += 4) {
                opacities[i / 4] = data[i]; // transform back to [0,1]
            }


            context.fillStyle = colorGradient;
            context.fillRect(0, 0, canvasNode.width, canvasNode.height);

            let imgData2 = context.getImageData(0, 0, canvasNode.width, canvasNode.height);
            let data2 = imgData2.data;
            let height = imgData2.height;

            //let newImageData = new Uint8ClampedArray(width * height * 4);

            // Copy to new img data turns out, not needed!
            //for (let i = 0; i < data2.length; i++) {
            //    newImageData[i] = data2[i];
            //}

            // Adjust opacities row by row
            // r g b a  r g b a
            // 0 1 2 3  4 5 6 7
            for (let i = 3; i < data2.length; i += 4) {
                let opacityAdjust = opacities[parseInt(i / 4) % width];
                data2[i] = opacityAdjust;
            }

            context.putImageData(new ImageData(data2, width, height), 0, 0);
            Environment.TransferFunctionManager.notifyDiscreteTFDidChange(this.EnvironmentTFKey);
        }
    */

    /**
     * Represents texture bounds in the Canvas coordinate space
     * @typedef {Object} TextureBounds
     * @property {number} x - leftmost coordinate.
     * @property {number} y - upper coordinate (0 = top)
     * @property {number} width - width of the texture
     * @property {number} height - height of the texture
     * @memberof module:Widgets/TransferFunction
     */


    /**
     * Gets the current texture bounds of the color X opacity gradient
     * @returns {module:Widgets/TransferFunction.TextureBounds}
     */
    getTextureBounds() {
        let canvasNode = this.canvas.node();

        return {
            x: 0,
            y: 0,
            width: canvasNode.width,
            height: canvasNode.height * TFEditorSettings.Layout.texturePreviewHeightPercentage
        }
    }

    _renderColorGradientOntoCanvas(sizes) {
        if (!this.colorGradientObject)
            return;

        this._renderColorGradientCanvas(sizes);
        this._renderColorGradientTexture(sizes);
    }
    /* Renders the texture as it should be, i.e opacity interpolates left-to-right
       over the color. Less intensive to do on a smaller strip that changes whenever
       a control point is dragged, instead of doing it on the entire thing. */
    _renderColorGradientTexture(sizes) {
        let canvasNode = this.canvas.node();
        let context = canvasNode.getContext('2d', {
            alpha: true
        });

        let splines = d3.line() // Used for opacity TF stuff
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((d) => {
                return x(d[0]);
            })
            .y((d) => {
                return y(d[1]);
            });

        let tWidth = canvasNode.width,
            tHeight = canvasNode.height * TFEditorSettings.Layout.texturePreviewHeightPercentage;

        let x0 = 0,
            x1 = tWidth,
            y0 = tHeight / 2,
            y1 = y0;


        let colorGradient = context.createLinearGradient(x0, y0, x1, y1);
        let opacityGradient = context.createLinearGradient(x0, y0, x1, y1);

        for (let point of this.colorGradientObject.gradient) {
            colorGradient.addColorStop(point.offset / 100, point.color);
        }

        for (let point of this.controlPoints) {
            let opacity = parseInt(Math.round(point[1] * 255));; // only linear interp. for now.
            opacityGradient.addColorStop(point[0], 'rgba(' + opacity + ', ' + opacity + ',' + opacity + ',1)');
        }

        context.fillStyle = opacityGradient;
        context.fillRect(0, 0, tWidth, tHeight);

        // Now extract the interpolated pixels
        let imgData = context.getImageData(0, 0, tWidth, tHeight);

        let data = imgData.data;
        let width = imgData.width;

        let opacities = new Uint8ClampedArray(width);

        for (let i = 0; i < width * 4; i += 4) {
            opacities[i / 4] = data[i]; // transform back to [0,1]
        }


        context.fillStyle = colorGradient;
        context.fillRect(0, 0, tWidth, tHeight);

        let imgData2 = context.getImageData(0, 0, tWidth, tHeight);
        let data2 = imgData2.data;
        let height = imgData2.height;

        //let newImageData = new Uint8ClampedArray(width * height * 4);

        // Copy to new img data turns out, not needed!
        //for (let i = 0; i < data2.length; i++) {
        //    newImageData[i] = data2[i];
        //}

        // Adjust opacities row by row
        // r g b a  r g b a
        // 0 1 2 3  4 5 6 7
        for (let i = 3; i < data2.length; i += 4) {
            let opacityAdjust = opacities[parseInt(i / 4) % width];
            data2[i] = opacityAdjust;
        }

        context.putImageData(new ImageData(data2, width, height), 0, 0);

        // CALL POSSIBLY OBSOLETE...
        Environment.notifyDiscreteTFDidChange(this.EnvironmentTFKey, this.getTextureBounds());

        this._notifyTFDidChange();
    }

    /* Opacity interpolates down-up, color as usual */
    _renderColorGradientCanvas(sizes) {
        let canvasNode = this.canvas.node();
        let context = canvasNode.getContext('2d', {
            alpha: true
        });

        let splines = d3.line() // Used for opacity TF stuff
            .curve(TFEditorSettings.TransferFunctionDisplay.curve)
            .x((d) => {
                return x(d[0]);
            })
            .y((d) => {
                return y(d[1]);
            });

        let offsetY = canvasNode.height * TFEditorSettings.Layout.texturePreviewHeightPercentage;

        let cWidth = canvasNode.width,
            cHeight = canvasNode.height - offsetY;

        let x0C = 0,
            x1C = cWidth,
            y0C = cHeight / 2,
            y1C = y0C;

        let x0O = cWidth / 2,
            x1O = cWidth / 2,
            y0O = canvasNode.height,
            y1O = offsetY;


        let colorGradient = context.createLinearGradient(x0C, y0C, x1C, y1C);
        let opacityGradient = context.createLinearGradient(x0O, y0O, x1O, y1O);

        for (let point of this.colorGradientObject.gradient) {
            colorGradient.addColorStop(point.offset / 100, point.color);
        }

        let dummyControlPoints = [[0, 1], [1, 0]];

        for (let point of dummyControlPoints) {
            let opacity = parseInt(Math.round(point[1] * 255));; // only linear interp. for now.
            opacityGradient.addColorStop(point[0], 'rgba(' + opacity + ', ' + opacity + ',' + opacity + ',1)');
        }

        context.fillStyle = opacityGradient;
        context.fillRect(0, offsetY, 1, cHeight);

        // Now extract the interpolated pixels
        let imgData = context.getImageData(0, offsetY, 1, cHeight);

        let data = imgData.data;
        let width = imgData.width;

        let opacities = new Uint8ClampedArray(cHeight);

        let cHeightRGBA = cHeight * 4;
        for (let i = 0; i < cHeightRGBA; i += 4) {
            opacities[i / 4] = data[cHeightRGBA - i]; // transform back to [0,1]
        }


        context.fillStyle = colorGradient;
        context.fillRect(0, offsetY, canvasNode.width, cHeight);

        let imgData2 = context.getImageData(0, offsetY, canvasNode.width, cHeight);
        let data2 = imgData2.data;
        let height = imgData2.height;

        //let newImageData = new Uint8ClampedArray(width * height * 4);

        // Copy to new img data turns out, not needed!
        //for (let i = 0; i < data2.length; i++) {
        //    newImageData[i] = data2[i];
        //}

        // Adjust opacities row by row
        // r g b a  r g b a
        // 0 1 2 3  4 5 6 7
        let rowWidth = cWidth * 4;
        for (let row = 0; row < cHeight; row++) {
            for (let col = 3; col < cWidth * 4; col += 4) {
                let rowOffset = row * rowWidth;
                let colOffset = col + 3;
                data2[rowOffset + col] = opacities[row];
            }
        }

        //for (let i = 3; i < data2.length; i += 4) {
        //    let opacityAdjust = opacities[parseInt(i / 4) % width];
        //    data2[i] = opacityAdjust;
        //}
        let newImageData = new ImageData(data2, canvasNode.width, cHeight);

        context.putImageData(newImageData, 0, offsetY, 0, 0, canvasNode.width, cHeight);

    }

    _renderColorGradientControlPoints(sizes) {
        let triangle = d3.symbol()
            .type(d3.symbolTriangle)
            .size(TFEditorSettings.ColorGradientDisplay.triangleSize);

        let cross = d3.symbol()
            .type(d3.symbolCross)
            .size(TFEditorSettings.ColorGradientDisplay.crossSize);

        let groups = this.colorGradientControlPointsGroup
            .selectAll('.node')
            .data(this.colorGradientObject.gradient)
            .enter()
            .append('g')
            .attr('transform', (d) => {
                return 'translate(' + (d.offset * this.originalSize.content.width) / 100 + ', 0)' +
                    'scale(1,-1)';
            })
            .attr('class', '.tf-editor-color-gradient-symbols');

        let self = this;
        let draggedIndex = -1;
        let draggedGlyphIndex = -1;
        let prevX = -1;

        let doubleclickThresholdMS = 500;
        let time = Date.now();

        console.log();
        console.log(this.colorGradientRect.node().height);
        let cgRectHeight = parseFloat(this.colorGradientRect.attr('height'));
        let crossTY = TFEditorSettings.ColorGradientDisplay.crossTranslateY;

        let ty = cgRectHeight + crossTY;

        let crossYOffset = -1 * (ty);


        groups.append('path')
            .style('stroke', 'black')
            .style('fill', (d) => {
                return 'red'
            })
            .attr('d', cross)
            .on('mousedown', (d, i) => {
                this.colorGradientObject.removeControlPointAtIndex(i);
                this._refreshColorGradient();
            })
            .attr('transform', 'translate(0, ' + crossYOffset + ') rotate(45)')
            .attr('id', (d, i) => {
                return self.$scope$id + '-tf-color-gradient-cross-' + i
            });

        groups.append('path')
            .style('stroke', 'black')
            .style('fill', (d) => {
                return d.color
            })
            .attr('d', triangle)
            .on('mousedown', (d, i) => {
                let dt = Date.now() - time;
                if (dt < doubleclickThresholdMS) {
                    this.colorGradientState.selectedIndex = i;
                    this.colorGradientState.isAwaitingColorSelection = true;
                    this.colorPicker.spectrum('toggle');
                    time -= doubleclickThresholdMS; // Make sure it is reset
                } else
                    time = Date.now();
            })
            .call(d3.drag()
                .on("start", function (d, i) {
                    d3.select(this).raise().classed('dragged', true);
                    draggedIndex = i;
                    draggedGlyphIndex = i;
                    prevX = d3.event.x;
                })
                .on("drag", function (d) {
                    let mouse = d3.mouse(self.colorGradientRectContainer.node());
                    let mx = self.scales.content.x.invert(mouse[0]);

                    let manualX = 100 * self.scale.x * mouse[0] / self.sizes.content.width;
                    let newOffset = manualX; //mx * 100;
                    // Something off with scales, not sure what it is but this works.

                    let oldOffset = self.colorGradientObject.gradient[draggedIndex].offset;
                    // Discretely move the control point
                    draggedIndex = self.colorGradientObject.moveControlPoint(draggedIndex, newOffset);


                    console.log("newX = " + newOffset + ", i(post drag)= " + draggedIndex);
                    console.log("manualX = " + manualX);

                    let dx = d3.event.x - prevX;

                    // Transform this element accordingly
                    d3.select(this)
                        .attr('transform', 'translate(' + dx + ', 0)' +
                            'scale(1,1)');

                    // Can't reconstruct a color gradient while it is being dragged
                    self._refreshColorGradientExceptPoints();
                })
                .on("end", function (d) {
                    d3.select(this).raise().classed('dragged', false);
                    draggedIndex = -1;
                    prevX = -1;
                    console.log("Refresh color gradient!");
                    self._refreshColorGradient();
                })
            )
            .exit().remove();

    }

    _renderAxes(sizes) {
        if (!this.histogram)
            return;

        let xScale = d3.scaleLinear()
            .domain([0, this.histogram.length  || 4095])
            .range([0, this.originalSize.content.width]);

        let yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.originalSize.content.height, 0]);

        let isoLine = d3.line()
            .x((count, isovalue) => {
                return yScale(isovalue);
            })
            .y((count, isovalue) => {
                return xScale(count);
            });

        this.isovalueAxis.call(d3.axisBottom(xScale).ticks(10));
        this.opacityAxis.call(d3.axisLeft(yScale).ticks(10));



    }


    _colorGradientMouseDown(mouse) {
        //console.log('_colorGradientMouseDown');
        // Add new control point
        // 1. Place a control point!
        //let mouse = d3.mouse(this.colorGradientRect.node());
        let sizes = this.sizes;
        let offset = 100 * (mouse[0] / sizes.content.width);

        //console.log("mouse down @ " + mouse + ", offset = " + offset);
        // 2. Get offset
        //TestData.gradient.addControlPoint(color, offset);
    }

    _colorGradientMouseUp(mouse) {
        let mouse2 = d3.mouse(this.colorGradientRectContainer.node());
        //let mouse = d3.mouse(this.colorGradientRect.node());
        let sizes = this.sizes;
        let offsetX = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        let offsetY = 100 * (this.scale.y * mouse[1] / sizes.bottomAxis.colorGradientRect.height);

        let offsetX2 = this.scales.content.x.invert(mouse[0]) * 100,
            offsetY2 = this.scales.content.y.invert(mouse[1]) * 100;

        // If placed @ valid location, set up the color picker.
        this.colorGradientState.selectedIndex = this.colorGradientObject.addControlPoint({
            color: 'white',
            offset: offsetX
        });
        //        console.log(this.colorGradientObject.gradient);
        //        console.log("Mouse up, index = " + this.colorGradientState.selectedIndex + ", offset = " + offsetX);
        this.colorGradientState.isAwaitingColorSelection = true;
        this.colorPicker.spectrum('toggle');
    }

    _colorGradientMouseMove(mouse) {
        if (this.colorGradientState.isAwaitingColorSelection || this.colorGradientState.selectedIndex === -1)
            return;

        let sizes = this.sizes;
        let offset = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        //console.log(offset);

        // NOTE: Scale the mouse coords, scale transformations arent taken into
        // account for mouse events.
        let offsetX2 = this.scales.content.x.invert(mouse[0]);
        let offsetX = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        let offsetY = 100 * (this.scale.y * mouse[1] / sizes.bottomAxis.colorGradientRect.height);

        console.log("offset = " + offset + ", offsetX2 = " + offsetX2);

        //console.log("content.width = " + sizes.content.width + ", mouse[0] = " + mouse[0] + ", " + "offsetX = " + offsetX);

        this.colorGradientState.selectedIndex = this.colorGradientObject.moveControlPoint(
            this.colorGradientState.selectedIndex, offsetX2);

        this._refreshColorGradient();
        //console.log("_colorGradientMouseMove(), (x,y) = (" + offsetX + ', ' + offsetY + ')');
    }

    _mousedown() {
        if (this.colorGradientState.isAwaitingColorSelection)
            return;

        let interactionMode = this.getInteractionMode();

        switch (interactionMode) {
            case 'Select': // Either start or end a range selection area.
                break;
            case 'TF':
                if (this.dragged)
                    return;

                let mouse = d3.mouse(this.transferFunctionGroup.node());

                let mouseX = mouse[0],
                    mouseY = mouse[1];

                let mouseXNormalized = this.scales.content.x.invert(mouseX),
                    mouseYNormalized = this.scales.content.y.invert(mouseY);

                let mouseNormalized = [mouseXNormalized, mouseYNormalized];

                this.controlPoints.insert(this.selected = this.dragged = mouseNormalized);
                /*
                this.dragged = mouseNormalized;
                this.selected = this.dragged;


                this.controlPoints.push(this.selected = this.dragged = mouseNormalized);*/
                this._refreshTransferFunction();
                break;
            default:
                break;
        }
        this.render();
    }

    _mouseup() {
        if (this.colorGradientState.isAwaitingColorSelection)
            return;

        let interactionMode = this.getInteractionMode();
        switch (interactionMode) {
            case 'Select': // Either start or end a range selection area.
                break;
            case 'TF':
                if (!this.dragged) return;
                this.dragged = null;
                this.controlPoints.sortPreserve(0);
                this._refreshTransferFunction();
            default:
                break;
        }
    }

    _mousemove() {
        if (this.colorGradientState.isAwaitingColorSelection)
            return;

        let clamp01 = (num) => {
            return num < 0 ? 0 : num > 1 ? 1 : num;
        }

        //let relativeM = d3.mouse(this.transferFunctionGroup.node());
        //
        //        console.log("Raw: " + relativeM);
        //        relativeM[0] = clamp01(this.scales.content.x.invert(relativeM[0]));
        //        relativeM[1] = clamp01(this.scales.content.y.invert(relativeM[1]));
        //        console.log("Relative: " + relativeM);

        let interactionMode = this.getInteractionMode();
        switch (interactionMode) {
            case 'Select': // Either start or end a range selection area.
                break;
            case 'TF':
                if (!this.dragged) return;
                let m = d3.mouse(this.transferFunctionGroup.node());
                this.dragged[0] = clamp01(this.scales.content.x.invert(m[0]));
                this.dragged[1] = clamp01(this.scales.content.y.invert(m[1]));
                this.controlPoints.sortPreserve(0);
                this._refreshTransferFunction();
                break;
            default:
                break;
        }
    }

    _keydown() {
        if (!this.selected || this.getInteractionMode() !== 'TF')
            return;
        switch (d3.event.keyCode) {
            case 8: // backspace
            case 46:
                this._removeSelectedControlPoint();
                break;
        }

        //console.log(this.tfModel);
        //console.log(Environment);
    }

    _removeSelectedControlPoint() {
        let i = this.controlPoints.indexOf(this.selected);
        this.controlPoints.splice(i, 1);
        this.selected = this.controlPoints.length ? this.controlPoints[i > 0 ? i - 1 : 0] : null;
        this._refreshTransferFunction();
    }

    _moveSelectedControlPointToBottom() {
        let i = this.controlPoints.indexOf(this.selected);
        this.controlPoints.toBottom(i);
        this.selected = this.controlPoints.length ? this.controlPoints[i > 0 ? i - 1 : 0] : null;
        this._refreshTransferFunction();
    }

}


module.exports = TransferFunctionEditor;
