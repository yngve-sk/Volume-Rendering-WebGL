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
            Volume: true,
            Slicer: true,
            Sphere: false
        }
        this.needsFullUpdate = {
            Volume: true,
            Slicer: true,
            Sphere: false
        }

        this.renderers = {
            Volume: new ConfigurableRenderer(this.gl),
            Slicer: new ConfigurableRenderer(this.gl),
            SlicerPicking: new ConfigurableRenderer(this.gl),
            SlicerPickingSlices: new ConfigurableRenderer(this.gl),
            SlicerPickingRails: new ConfigurableRenderer(this.gl),
            SlicerPickingCubeFaces: new ConfigurableRenderer(this.gl),
            Volume3DPicking: new ConfigurableRenderer(this.gl),
            VolumeRayRender: new ConfigurableRenderer(this.gl),
            VolumePointRenderer: new ConfigurableRenderer(this.gl),
            Sphere: null
        };

        this.viewports = {
            Volume: null, // pointer to volume viewport obj
            Slicer: null, // pointer to slicer viewport obj
            Sphere: null, // pointer to sphere viewport obj
            VolumeRayRender: null
        };
    }

    getAspectRatio() {
        let total = this.viewports.Volume;
        if (total)
            return total.width / total.height;
        else
            return 1; // default fallback
    }

    renderSpecific(name, full) {
        this.renderers[name].render(full  || true); //shitty design but w/E! might be a json later to render a certain set of steps and so on.
    }

    notifyNeedsUpdate(name, fullUpdate) {
        this.needsUpdate[name] = true;

        if (fullUpdate !== undefined)
            this.needsFullUpdate[name] = fullUpdate;
    }

    render() {
        if (this.needsUpdate.Volume) {
            this.renderers.Volume.render(this.needsFullUpdate.Volume);
            this.renderers.Slicer.render(true);
            this.needsUpdate.Volume = false;
            this.needsFullUpdate.Volume = false;
            this.needsUpdate.Slicer = false;
        } else if (this.needsUpdate.Slicer) {
            this.renderers.Volume.render(false);
            this.renderers.Slicer.render(true);
            this.needsUpdate.Slicer = false;
        } else if (this.needsUpdate.SlicerPicking) {
            //this.renderers.SlicerPicking.render();
            this.needsUpdate.SlicerPicking = false;
        }
    }

    fullRender() {
        this.renderers.Volume.render(true);
        this.renderers.Slicer.render(true);
    }

    lastStepRender() {
        this.renderers.Volume.render(false);
        this.renderers.Slicer.render(false);
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

        this.renderers.VolumeRayRender.setViewport(this.viewports.Volume);
        this.renderers.VolumePointRenderer.setViewport(this.viewports.Volume);
    }
}

module.exports = Subview;
