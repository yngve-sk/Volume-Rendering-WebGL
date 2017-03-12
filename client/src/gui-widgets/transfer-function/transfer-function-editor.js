let d3 = require('d3');
let VolumeDataset = require('../../environment/environment').VolumeDataset;

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
    constructor(displayOptions, getInteractionMode, $scope$id, getModel) {
        this.canvas = document.querySelector('.tf-canvas.ng-id-' + $scope$id);
        this.svgContainer = document.querySelector('.tf-d3-container.ng-id-' + $scope$id);

        console.log(this.canvas);
        console.log(this.svgContainer);
        this.getModel = getModel;

        this.svg = null;

        this.options = {
            leftAxisWidthPercentage: 0.07,
            bottomAxisHeightPercentage: 0.15
        };

        this.displayOptions = displayOptions;
        this.getInteractionMode = getInteractionMode;
    }

    clear() {
        this.svgContainer.innerHTML = "";
    }

    render() {
        this.clear();
        /**  INITIALIZATION  **/
        let self = this;
        let model = this.getModel();

        let controlPointsFrameX = 100 * this.options.leftAxisWidthPercentage,
            controlPointsFrameY = 0,
            controlPointsFrameWidth = (100 * (1 - this.options.leftAxisWidthPercentage)),
            controlPointsFrameHeight = (100 * (1 - this.options.bottomAxisHeightPercentage));

        let totalWidth = this.svgContainer.clientWidth,
            totalHeight = this.svgContainer.clientHeight;

        var points = [];

        var dragged = null,
            selected = null;

        let curveStyle = d3.curveCardinal;

        let controlPointsLine = d3.line()
            .curve(curveStyle)
            .x((d) => {
                return d[0]
            })
            .y((d) => {
                return d[1]
            });

        let maxHistogramValue = d3.max(VolumeDataset.histogram);

        let xScale = d3.scaleLinear().domain([0, 255]).range(
            [totalWidth * controlPointsFrameX,
             totalWidth * (controlPointsFrameX + controlPointsFrameWidth)]),

            yScale = d3.scaleLinear().domain([0, maxHistogramValue]).range([
                totalHeight * (controlPointsFrameY + controlPointsFrameHeight),
                totalHeight * controlPointsFrameY
            ]); // Invert because y goes downwards

        let histogramArea = d3.area()
            .x(function (count, isovalue) {
                console.log("(" + count + ", " + isovalue + ")");
                console.log("x = " + xScale(isovalue));
                return xScale(isovalue);
            })
            .y1(function (count, isovalue) {
                return yScale(count);
            })
            .y0(yScale(controlPointsFrameY + controlPointsFrameHeight));

        let histogramLine = d3.line()
            .curve(curveStyle)
            .x(function (count, isovalue) {
                return xScale(isovalue);
            })
            .y(yScale(controlPointsFrameY + controlPointsFrameHeight));


        var svg = d3.select(this.svgContainer).append("svg")
            .attr("width", '100%')
            .attr("height", '100%')
            .attr("tabindex", 1);

        svg.append("rect") // Event listener rect
            .attr("width", controlPointsFrameWidth + '%')
            .attr("height", controlPointsFrameHeight + '%')
            .attr("x", controlPointsFrameX + '%')
            .attr("y", controlPointsFrameY + '%')
            .attr('fill-opacity', 0)
            .on("mousemove", mousemove)
            .on("mouseup", mouseup)
            .on("mousedown", mousedown);



        d3.select(window).on("keydown", keydown);


        svg.append('path') // Append histogram line
            .datum(VolumeDataset.histogram)
            .attr('class', 'tf-histogram-line')
            .attr('d', histogramLine)
            .call(redraw);

        svg.append('path') // Append histogram area
            .datum(VolumeDataset.histogram)
            .attr('class', 'tf-histogram-area')
            .attr('d', histogramArea)
            .call(redraw);


        svg.append("path") // Append the TF line
            .datum(points)
            .attr("class", "line tf-splineline")
            .call(redraw);


        svg.node().focus();

        /** RENDERING **/
        function redraw() {
            if (self.displayOptions.showTransferFunction) {
                redrawLine();
                redrawControlPoints();
            }
            redrawHistogram();

            if (d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        function redrawHistogram() {
            svg.select('path.tf-histogram-line').attr('d', histogramLine);
            svg.select('path.tf-histogram-area').attr('d', histogramArea);
        }

        function redrawLine() {
            svg.select("path.tf-splineline").attr("d", controlPointsLine); // Draw line
        }

        function redrawControlPoints() {
            let circle = svg.selectAll("circle")
                .data(points, function (d) {
                    return d;
                });

            circle.enter().append("circle")
                .attr("r", 1e-6)
                .on("mousedown", function (d) {
                    selected = dragged = d;
                    redraw();
                })
                .on("mouseup", mouseup)
                .attr("cx", function (d) {
                    console.log(d);
                    return d[0];
                })
                .attr("cy", function (d) {
                    return d[1];
                })
                .transition()
                .duration(750)
                .ease(d3.easeElastic)
                .attr("r", 6.5);

            circle
                .classed("selected", function (d) {
                    return d === selected;
                })
                .attr("cx", function (d) {
                    console.log(d);
                    return d[0];
                })
                .attr("cy", function (d) {
                    return d[1];
                });

            circle.exit().remove();
        }

        /** EVENT HANDLING  **/
        function change() {
            line.interpolate(this.value);
            redraw();
        }

        function mousedown(e) {
            let interactionMode = this.getInteractionMode();
            switch (interactionMode) {
                case 'Select': // Either start or end a range selection area.
                    break;
                case 'TF':
                    points.push(selected = dragged = d3.mouse(svg.node()));
                    break;
                default:
                    break;
            }
            redraw();
        }

        function mousemove() {
            if (!dragged) return;
            var m = d3.mouse(svg.node());
            console.log(m);
            dragged[0] = m[0];
            dragged[1] = m[1];
            redraw();
        }

        function mouseup() {
            if (!dragged) return;
            mousemove();
            dragged = null;
        }

        function keydown() {
            console.log("d3 keyodnw");
            if (!selected) return;
            switch (d3.event.keyCode) {
                case 8: // backspace
                case 46:
                    { // delete
                        var i = points.indexOf(selected);
                        points.splice(i, 1);
                        selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
                        redraw();
                        break;
                    }
            }
        }
    }


    renderFrame() {
        console.log(this.svgContainer.clientWidth + ",    " + this.svgContainer.clientHeight);
        this.svg = d3.select(this.svgContainer).append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
    }

    _renderColorAxis() {

        let colorGradient = model.options.colorGradient;
        let colorDomain = colorGradient.controlPoints.controlPoints;

        let colorScale = d3.scaleLinear().domain([0, 100]).range([0, 100]);

    }

    _renderOpacityAxis() {

    }

    _renderCanvas() {

    }

    _renderColorGradient() {

    }
}


module.exports = TransferFunctionEditor;
