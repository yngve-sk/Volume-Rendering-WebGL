let d3 = require('d3');
let VolumeDataset = require('../../environment/environment').VolumeDataset;
let TestData = require('./histogram-test-dataset');
let $ = require('jquery');
let ColorGradient = require('./color-gradient');
let Environment = require('../../environment/environment');

class TransferFunctionEditor {
    /*
        @displayOptions - read options from controller, example:
            $scope.displayOptions = {
                showHistogram: true,
                showControlPoints: true,
                showSelection: true,
                zoomSelection : false
                }

        @getInteractionMode - function that returns the current interaction mode @ controller
            Will return one of the following:
                'Select',
                'TF'

        @$scope$id - angular scope ID, the scope id is used as the suffix
                     of the canvas and SVG of render the TF editor onto. I.E:

                     .tf-canvas.ng-id-N
                     .tf-d3-container.ng-id-N

                     where N is the $scope$id

        @getModel - Getter for the discrete representation of the TF,
                    It's a getter because the model may change, without the
                    transfer function editor knowing of it. All the TF editor
                    knows is to render the model it is given by the getModel()
                    func.

    */
    constructor(displayOptions, getInteractionMode, $scope$id, getModel, EnvironmentTFKey) {
        //this.canvas = document.querySelector('.tf-canvas.ng-id-' + $scope$id);
        this.svgContainer = document.querySelector('.tf-d3-container.ng-id-' + $scope$id);
        this.$scope$id = $scope$id;
        this.EnvironmentTFKey = EnvironmentTFKey;

        /************************************************************/
        /**********           BINDINGS TO ENVIRONMENT      **********/
        /************************************************************/
        this.splines = {}; // Stores the spline line, used to calc the interpolation

        this.tfModel = Environment.TransferFunctionManager.getTransferFunction(EnvironmentTFKey, this.splines);

        this.colorGradientObject = this.tfModel.colorGradient;
        this.controlPoints = this.tfModel.controlPoints;

        this.getHistogram = () => {
            return Environment.VolumeDataset.histogram;
        };

        this.histogramRef = Environment.VolumeDataset.histogram;
        this.histogramSelectionRef = TestData.histogramSelection;
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
        this.getModel = getModel;
        this.getInteractionMode = getInteractionMode;

        this.options = {
            leftAxisWidthPercentage: 0.07,
            bottomAxisHeightPercentage: 0.25,
            isoValueAxisHeightPercentage: 0.110,
            curve: d3.curveLinear,
            controlPointSplineCurve: d3.curveLinear,
            contentTopPaddingPercentage: 0.2
        };

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

        d3.select(window).on("keydown", () => {
            this._keydown();
        });

        //console.log(this.tfModel);
        //console.log(Environment);
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
        let sizes = this._getSizes();
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
                this._mousedown();
            })
            .on('mouseup', () => {
                this._mouseup();
            })
            .on('mousemove', () => {
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

        this.colorPicker.on('change', (tinycolor) => {
            this._colorPicked(tinycolor, true);
        });
        this.colorPicker.on('move', (tinycolor) => {
            this._colorPicked(tinycolor, false);
        });
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
        let sizes = this._getSizes();

        this.scales.content.x = d3.scaleLinear().domain([0, 1]).range([0, sizes.content.width]);
        this.scales.content.y = d3.scaleLinear().domain([1, 0]).range([0, sizes.content.height]);

        this.scales.total.x = d3.scaleLinear().domain([0, 1]).range([0, sizes.total.width]);
        this.scales.total.y = d3.scaleLinear().domain([1, 0]).range([0, sizes.total.height]);

        this.scale = { // Recalc the scale
            x: sizes.total.width / this.originalSize.total.width,
            y: sizes.total.height / this.originalSize.total.height
        };

        this.eventListenerRect
            .attr('x', sizes.content.x0)
            .attr('y', sizes.content.y0)
            .attr('width', sizes.content.width)
            .attr('height', sizes.content.height);

        this.histogramSelectionGroup
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.content.y0 + ') ' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.histogramGroup
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.transferFunctionGroup
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.transferFunctionControlPointGroup
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.canvas
            .style('left', sizes.content.x0)
            .style('top', sizes.content.y0)
            .style('width', sizes.content.width)
            .style('height', sizes.content.height);

        //    this.colorGradientRect
        //        .attr('x', sizes.content.x0)
        //        .attr('y', sizes.bottomAxis.colorGradientRect.y0)
        //        .attr('width', sizes.content.width)
        //        .attr('height', sizes.bottomAxis.colorGradientRect.height);


        this.colorGradientRectContainer
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.bottomAxis.colorGradientRect.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')'
            );
        //console.log(this.colorGradientRect.node().getBoundingClientRect());

        this.colorGradientControlPointsGroup
            .attr('transform',
                'translate(' + 0 + ', ' + -8 + ')');

        this.isovalueAxis
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.bottomAxis.isovalues.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');

        this.opacityAxis
            .attr('transform',
                'translate(' + sizes.content.x0 + ', ' + sizes.content.y0 + ')' +
                'scale(' + this.scale.x + ', ' + this.scale.y + ')');
    }

    _getSizes() {
        let totalWidthPX = this.svgMain.style('width'),
            totalHeightPX = this.svgMain.style('height');

        let totalWidth = parseFloat(totalWidthPX.replace('px', '')),
            totalHeight = parseFloat(totalHeightPX.replace('px', ''));

        let contentY0 = this.options.contentTopPaddingPercentage * totalHeight;

        let contentWidth = (1 - this.options.leftAxisWidthPercentage) * totalWidth,
            contentHeight = (1 - this.options.bottomAxisHeightPercentage - this.options.contentTopPaddingPercentage) * totalHeight;

        let bottomAxisY0 = contentY0 + contentHeight,
            bottomAxisIsovaluesHeight = this.options.isoValueAxisHeightPercentage * totalHeight,
            bottomAxisColorGradientRectY0 = bottomAxisY0 + bottomAxisIsovaluesHeight,
            bottomAxisColorGradientRectHeight = totalHeight - bottomAxisColorGradientRectY0;


        return {
            total: {
                width: totalWidth,
                height: totalHeight
            },
            content: {
                x0: this.options.leftAxisWidthPercentage * totalWidth,
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

    _clear() {
        this._clearHistogramSelection();
        this._clearHistogram();
        this._clearTransferFunction();
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

    _refreshColorGradient() {
        this._clearColorGradient();
        this._renderColorGradientRect();
        this._renderColorGradientControlPoints(this._getSizes());
        this._renderColorGradientOntoCanvas();
    }

    render() {
        this._clear();
        let sizes = this._getSizes();

        if (this.displayOptions.showHistogramSelection)
            this._renderHistogramSelection(sizes);

        if (this.displayOptions.showHistogram)
            this._renderHistogram(sizes);

        if (this.displayOptions.showTransferFunction)
            this._renderTransferFunction();

        this._renderColorGradient(sizes);
        this._renderColorGradientOntoCanvas(sizes);
        this._renderAxes(sizes);

        //this._renderColorOpacityBitmap();
    }

    _renderHistogramSelection(sizes) {
        let histogram = this.getHistogram();
        let yDomain = d3.extent(histogram),
            yRange = [this.originalSize.content.height, 0];

        let xDomain = [0, histogram.length - 1],
            xRange = [0, this.originalSize.content.width];

        let yScale = d3.scaleLinear().domain(yDomain).range(yRange),
            xScale = d3.scaleLinear().domain(xDomain).range(xRange);

        let line = d3.line()
            .curve(this.options.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y((isovalue, i) => {
                return yScale(isovalue);
            });

        let area = d3.area()
            .curve(this.options.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y1((isovalue, i) => {
                return yScale(isovalue);
            })
            .y0(yRange[0]);

        this.histogramSelectionGroup
            .append('path')
            .datum(this.histogramSelectionRef)
            .attr('d', line)
            .attr('class', 'tf-editor-3d-selection-histogram-line');

        this.histogramSelectionGroup
            .append('path')
            .datum(this.histogramSelectionRef)
            .attr('d', area)
            .attr('class', 'tf-editor-3d-selection-histogram-area');
    }

    _renderHistogram(sizes) {
        let histogram = this.getHistogram();
        let yDomain = d3.extent(histogram),
            yRange = [this.originalSize.content.height, 0];

        let xDomain = [0, histogram.length - 1],
            xRange = [0, this.originalSize.content.width];

        let yScale = d3.scaleLinear().domain(yDomain).range(yRange),
            xScale = d3.scaleLinear().domain(xDomain).range(xRange);

        let line = d3.line()
            .curve(this.options.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y((isovalue, i) => {
                return yScale(isovalue);
            });

        let area = d3.area()
            .curve(this.options.curve)
            .x((isovalue, i) => {
                return xScale(i);
            })
            .y1((isovalue, i) => {
                return yScale(isovalue);
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
        this._renderControlPointSplines();
        this._renderControlPoints();
    }

    _renderControlPointSplines() {

        this.splines = d3.line()
            .curve(this.options.controlPointSplineCurve)
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
        let circles = this.transferFunctionControlPointGroup.selectAll(".circle")
            .data(this.controlPoints);
        let self = this;

        circles.enter().append("circle")
            .attr("r", 1e-6)
            .attr('class', 'tf-editor-control-point')
            .on("mousedown", (d) => {
                this.selected = this.dragged = d;
                this._mousedown();
            })
            .on("mouseup", () => {
                this._mouseup();
            })
            .on('mouseenter', function () {
                d3.select(this).classed('selected', true);
            })
            .on('mouseout', function (d) {
                d3.select(this).classed('selected', self.selected === d);
                if (self.selected === d) {
                    self._clearTransferFunction();
                    self._renderTransferFunction();
                }
            })
            .attr("cx", (d) => {
                return this.scales.content.x(d[0]);
            })
            .attr("cy", (d) => {
                return this.scales.content.y(d[1]);
            })
            .classed("selected", (d) => {
                return d === this.selected;
            })
            .attr("r", 6.5);

        circles

            .attr("cx", (d) => {
                return this.scales.content.x(d[0]);
            })
            .attr("cy", (d) => {
                return this.scales.content.y(d[1]);
            });

        circles.exit().remove();
    }

    _renderColorOpacityBitmap() {

    }

    _renderColorGradient(sizes) {
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

    _renderColorGradientOntoCanvas(sizes) {
        let canvasNode = this.canvas.node();
        let context = canvasNode.getContext('2d', {alpha: true});

        let splines = d3.line() // Used for opacity TF stuff
            .curve(this.options.controlPointSplineCurve)
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



    _renderColorGradientControlPoints(sizes) {
        let triangle = d3.symbol()
            .type(d3.symbolTriangle)
            .size(25);

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

        groups.append('path')
            .style('stroke', 'black')
            .style('fill', (d) => {
                return d.color
            })
            .attr('d', triangle);

    }

    _renderAxes(sizes) {
        let xScale = d3.scaleLinear()
            .domain([0, this.histogramRef.length])
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
        let sizes = this._getSizes();
        let offset = 100 * (mouse[0] / sizes.content.width);

        //console.log("mouse down @ " + mouse + ", offset = " + offset);
        // 2. Get offset
        //TestData.gradient.addControlPoint(color, offset);
    }

    _colorGradientMouseUp(mouse) {
        let mouse2 = d3.mouse(this.colorGradientRectContainer.node());
        //let mouse = d3.mouse(this.colorGradientRect.node());
        let sizes = this._getSizes();
        let offsetX = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        let offsetY = 100 * (this.scale.y * mouse[1] / sizes.bottomAxis.colorGradientRect.height);

        // If placed @ valid location, set up the color picker.
        this.colorGradientState.selectedIndex = this.colorGradientObject.addControlPoint('white', offsetX);
        //        console.log(this.colorGradientObject.gradient);
        //        console.log("Mouse up, index = " + this.colorGradientState.selectedIndex + ", offset = " + offsetX);
        this.colorGradientState.isAwaitingColorSelection = true;
        this.colorPicker.spectrum('toggle');
    }

    _colorGradientMouseMove(mouse) {

        if (this.colorGradientState.isAwaitingColorSelection || this.colorGradientState.selectedIndex === -1)
            return;

        let sizes = this._getSizes();
        let offset = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        //console.log(offset);

        // NOTE: Scale the mouse coords, scale transformations arent taken into
        // account for mouse events.
        let offsetX = 100 * (this.scale.x * mouse[0] / sizes.content.width);
        let offsetY = 100 * (this.scale.y * mouse[1] / sizes.bottomAxis.colorGradientRect.height);

        //console.log("content.width = " + sizes.content.width + ", mouse[0] = " + mouse[0] + ", " + "offsetX = " + offsetX);

        this.colorGradientState.selectedIndex = this.colorGradientObject.moveControlPoint(
            this.colorGradientState.selectedIndex, offset);

        this._refreshColorGradient();
        //console.log("_colorGradientMouseMove(), (x,y) = (" + offsetX + ', ' + offsetY + ')');
    }

    _mousedown() {
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

                this.controlPoints.push(this.selected = this.dragged = mouseNormalized);
                this._refreshTransferFunction();
                break;
            default:
                break;
        }
        this.render();
    }

    _mouseup() {
        let interactionMode = this.getInteractionMode();
        switch (interactionMode) {
            case 'Select': // Either start or end a range selection area.
                break;
            case 'TF':
                if (!this.dragged) return;
                this.dragged = null;
                this._refreshTransferFunction();
            default:
                break;
        }
    }

    _mousemove() {
        //console.log(d3.mouse(this.eventListenerRect.node()));

        let interactionMode = this.getInteractionMode();
        switch (interactionMode) {
            case 'Select': // Either start or end a range selection area.
                break;
            case 'TF':
                if (!this.dragged) return;
                let m = d3.mouse(this.transferFunctionGroup.node());
                this.dragged[0] = this.scales.content.x.invert(m[0]);
                this.dragged[1] = this.scales.content.y.invert(m[1]);
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
                this.removeSelectedControlPoint();
                break;
        }

        //console.log(this.tfModel);
        //console.log(Environment);
    }

    removeSelectedControlPoint() {
        let i = this.controlPoints.indexOf(this.selected);
        this.controlPoints.splice(i, 1);
        this.selected = this.controlPoints.length ? this.controlPoints[i > 0 ? i - 1 : 0] : null;
        this._refreshTransferFunction();
    }

}


module.exports = TransferFunctionEditor;
