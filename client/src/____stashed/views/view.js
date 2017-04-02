let VolumeRenderer = require('./volume/volume-renderer');
let Buttons = require('./mouse-buttons');

class View {
    /*

    @canvasID - html id attrib of the canvas to render stuff onto
    @cellID - logical cell ID, used for lookups in the environment

    */
    constructor(canvasID, cellID, environmentRef) {
        this.canvas = document.getElementById(canvasID);
        this.cellID = cellID;
        this.env = environmentRef;

        this.gl = this.canvas.getContext("webgl2");

        this.slicerRenderer = null;
        this.sphereRenderer = null;
        this.volumeRenderer = new VolumeRenderer(this.canvas, this.env);

        this.activeElement = this.volumeRenderer; // For now just point it to volumerenderer
        this.mouse = {
            isDown: false,
            button: Buttons.LEFT,
            isDragInProgress: false
        };

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseMove(e.layerX, e.layerY, e)
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseUp(e.layerX, e.layerY, e)
        });
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown(e.layerX, e.layerY, e)
        });
        this.canvas.addEventListener('click', (e) => {
            this.mouseClick(e.layerX, e.layerY, e)
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            //console.log("RIGHT CLICK CANVAS!");
            e.preventDefault();
        });

    }


    mouseClick(x, y, e) {
        this.activeElement.mouseDrag(x, y, e.movementX, e.movementY, this.mouse.button);
    }

    mouseMove(x, y, e) {
        //console.log(this.activeElement);
        //console.log("Mouse move! " + this.mouse.isDown ? "DRAGGING" : "MOVING");
        if (this.mouse.isDown)
            this.activeElement.mouseDrag(x, y, e.movementX, e.movementY, this.mouse.button);
        else
            this.activeElement.mouseMove(x, y, e.movementX, e.movementY, this.mouse.button);
    }

    mouseDown(x, y, e) {
        //console.log("Mouse down");
        this.mouse.button = e.button;
        this.activeElement.mouseDown(x, y, this.mouse.button);
        this.mouse.isDown = true;
    }

    mouseUp(x, y, e) {
        //console.log("mouse UP!");
        this.mouse.isDown = false;
        this.activeElement.mouseUp(x, y, this.mouse.button);
    }

    refresh() {
        this.volumeRenderer.render();
    }

    _render(subview) {
        this.volumeRenderer.render();
        //this.sphere.render();
        //this.slicer.render();
    }
}

module.exports = View;
