/**
 * Represents a subview, will manage the renderers for each
 * subview, and also hold pointers to the models which the
 * renderers will be drawing. The reason for holding pointers
 * is it makes linking different proprties together easier.
 * @memberof module:Core/View
 */
class Subview {
    /**
     * Initializes a new subview
     * @class undefined
     * @param {WebGL2Context} webGLContext The webGL context to render to
     * @param {Object} models JSON with the initial models
     * @param {Object} models.slicer the slicer model
     * @param {Object} models.sphere the sphere model
     * @param {Object} models.camera the camera model (VP matrix)
     * @param {Object} models.lights the lighting model
     * @constructor
     */
    constructor(webGLContext, models) {
        this.gl = webGLContext;

        this.renderers = {
            volume: null,
            slicer: null,
            sphere: null
        };

        // Pointers to models stored in the model manager
        this.models = {
            volume: null,
            slicer: null,
            sphere: null,
            camera: null,
            lights: null
        };

        this.viewports = {
            volume: null,
            slicer: null,
            sphere: null
        };
    }

    render() {
        this.renderers.volume.render({
            camera: this.models.camera,
            viewport: this.viewports.volume
        });

        this.renderers.slicer.render({
            model: this.models.slicer,
            viewport: this.viewports.slicer
        });

        this.renderers.sphere.render({
            model: this.models.sphere,
            viewport: this.viewports.sphere
        });
    }

    /**
     * A stripped down mouse event
     * @typedef {Object} MouseEvent
     * @property {Object} pos normalized position within the container [0,1]
     * @property {number} pos.x
     * @property {number} pos.x
     * @property {string} type type of the event, 'mousedown,' 'mouseup', 'mousemove', 'mouseenter', 'mouseexit'
     * @property {number} button The mouse button. 0(left click), 1(middle button) or 2(right click)
     *
     * @memberof module:Core/View
     **/

    /**
     * Called whenever an event happens, will delegate the mouse event
     * to the respective model.
     *
     * @param {string} subcellName - name of the subview, 'sphere', 'slicer' or 'volume'
     * @param {module:Core/View.MouseEvent} event - the event
     */
    notifyEventDidHappen(subcellName, event) {
        //this.models[subcellName].notifyEventDidHappen(event);
    }

    /**
     * Sets the viewport render targets for this subview,
     * (the {@link module:Core/View.ViewManager} is
     * responsible for keeping the layout refreshed)
     *
     * @param {Object.<module:Core/View.Viewport>} viewports JSON of the viewports. Keys correspond to viewport names ('sphere', 'slicer', 'volume').
     */
    setViewports(viewports) {
        this.viewports = viewports;
    }
}

module.exports = Subview;
