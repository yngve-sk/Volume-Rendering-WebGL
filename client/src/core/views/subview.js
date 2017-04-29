let ConfigurableRenderer = require('../rendering/configurable-renderer');

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
    constructor(webGLContext) {
        this.gl = webGLContext;

        //        // Pointers to models stored in the model manager
        //        this.models = {
        //            volume: null, // pointer to iso2color texture obj
        //            slicer: null, // pointer to state of slicer obj
        //            sphere: null, // pointer to state of sphere obj
        //            camera: null, // pointer to camera obj
        //            lights: null // pointer to lights obj
        //        };
        this.uniforms = null;

        this.needsUpdate = {
            Volume: false,
            Slicer: true,
            Sphere: false
        }

        this.renderers = {
            Volume: new ConfigurableRenderer(this.gl),
            Slicer: new ConfigurableRenderer(this.gl),
            SlicerPicking: new ConfigurableRenderer(this.gl),
            Sphere: null
        };

        this.viewports = {
            Volume: null, // pointer to volume viewport obj
            Slicer: null, // pointer to slicer viewport obj
            Sphere: null // pointer to sphere viewport obj
        };
    }

    getAspectRatio() {
        let total = this.viewports.volume;
        if (total)
            return total.width / total.height;
        else
            return 1; // default fallback
    }

    renderSpecific(name) {
        this.renderers[name].render();
    }

    notifyNeedsUpdate(name) {
        this.needsUpdate[name] = true;
    }

    render() {
        if (this.needsUpdate.Volume) {
            this.renderers.Volume.render();
            //this.needsUpdate.volume = false;
        }

        if (this.needsUpdate.Slicer) {
            this.renderers.Slicer.render();
            //this.needsUpdate.Slicer = false;
        }
        if (this.needsUpdate.SlicerPicking) {
            this.renderers.SlicerPicking.render();
            //this.needsUpdate.volume = false;
        }
        //
        //        this.renderers.sphere.render({
        //            model: this.models.sphere,
        //            viewport: this.viewports.sphere
        //        });
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
     * @param {string} subcellName - name of the subview, 'Sphere', 'Slicer' or 'Volume'
     * @param {module:Core/View.MouseEvent} event - the event
     */
    notifyEventDidHappen(subcellName, event) {
        //this.models[subcellName].notifyEventDidHappen(event);
    }

    setUniforms(uniforms) {
        this.uniforms = uniforms;
    }

    configureRenderer(rendererName, config) {
        this.renderers[rendererName].configure(config);
    }

    /**
     * Sets the viewport render targets for this subview,
     * (the {@link module:Core/View.ViewManager} is
     * responsible for keeping the layout refreshed)
     *
     * @param {Object.<module:Core/View.Viewport>} viewports JSON of the viewports. Keys correspond to viewport names ('Sphere', 'Slicer', 'Volume').
     */
    setViewports(viewports) {
        this.viewports = viewports;
        for (let vp of viewports) {
            if (this.renderers[vp.name])
                this.renderers[vp.name].setViewport(vp);
            this.viewports[vp.name] = vp;
        }
    }
}

module.exports = Subview;
