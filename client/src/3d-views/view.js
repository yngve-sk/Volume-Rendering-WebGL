const VolumeRenderer = require('./volume/volume-renderer');

class View {
    /*

    @canvasID - html id attrib of the canvas to render stuff onto
    @cellID - logical cell ID, used for lookups in the environment

    */
    constructor(canvasID, cellID) {
        this.canvas = document.getElementById(canvasID);
        this.cellID = cellID;

        this.gl = this.canvas.getContext("webgl2");

        this.slicer = {
            renderer: null,
            model: null
        };

        this.sphere = {
            renderer: null,
            model: null
        };

        this.volume = {
            renderer: new VolumeRenderer(this.canvas),
            model: null
        } // ignore model for now.
    }

    refresh() {
        this.volume.renderer.render();
    }

    _render(subview) {}
}

module.exports = View;
