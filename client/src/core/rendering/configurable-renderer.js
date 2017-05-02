let twgl = require('twgl.js');
let m4 = twgl.m4;
let _ = require('underscore');

/** @module Core/Renderer */

/**
 * Simple wrapper class, can be configured to perform
 * a sequence of render steps.
 * @memberof module:Core/Renderer
 */
class ConfigurableRenderer {

    /**
     * Initializes a new renderer with the given
     * initial configuration.
     *
     * @class undefined
     * @param {module:Core/Renderer.RendererConfiguration} initialConfig
     * @constructor
     */
    constructor(gl, initialConfig) {
        this.steps = [];
        this.gl = gl;
        this.viewport = null;

        if (initialConfig !== undefined)
            this.configure(initialConfig);
    }

    setViewport(viewport) {
        this.viewport = viewport;
    }

    /**
     * Syncs the renderer with the given configuration
     *
     * @param {module:Core/Renderer.RendererConfiguration} config
     */
    configure(config) {
        //this.gl = config.gl;
        if (config.viewport)
            this.viewport = config.viewport;

        this.steps = config.steps;
        this.uniforms = config.uniforms
    }

    /**
     * Modifies the current configuration of a renderer
     *
     *
     * @param {Object} newOptions
     */
    modifyConfig(newOptions) {
        for (let stepIndex in newOptions) {
            for (let configKey in newOptions[stepIndex]) {
                this.steps[stepIndex][configKey] = newOptions[stepIndex][configKey];
            }
        }
    }

    _applyViewport() {
        this.gl.viewport(
            this.viewport.x0,
            this.viewport.y0,
            this.viewport.width,
            this.viewport.height);
    }

    _applyScissorViewport() {
        this.gl.scissor(
            this.viewport.x0,
            this.viewport.y0,
            this.viewport.width,
            this.viewport.height
        );
    }

    _applySubViewport(svp01, fbinfo) {
        if (fbinfo) { // Use frame buffer as parent viewport
            let subX0 = svp01.x0 * fbinfo.width,
                subY0 = svp01.y0 * fbinfo.height;


            let subWidth = svp01.width * fbinfo.width,
                subHeight = svp01.height * fbinfo.height;

            this.gl.viewport(
                subX0,
                subY0,
                subWidth,
                subHeight);

        } else { // Use given viewport as parent
            let subX0 = this.viewport.x0 + svp01.x0 * this.viewport.width,
                subY0 = this.viewport.y0 + svp01.y0 * this.viewport.height;


            let subWidth = svp01.width * this.viewport.width,
                subHeight = svp01.height * this.viewport.height;

            this.gl.viewport(
                subX0,
                subY0,
                subWidth,
                subHeight);
        }


    }

    _renderStep(step) {
        let gl = this.gl;
        let programInfo = step.programInfo;

        //twgl.bindFramebufferInfo(gl, step.frameBufferInfo);
        gl.useProgram(programInfo.program);

        twgl.setBuffersAndAttributes(gl, programInfo, step.bufferInfo);
        twgl.setUniforms(programInfo, this.uniforms); // Same bundle for all

        let applyGLSettings = () => {
            for (let func in step.glSettings) {
                let args = step.glSettings[func];

                if (_.contains(['enable', 'disable', 'clear'], func)) {
                    for (let arg of args)
                        gl[func].call(gl, arg);
                } else {
                    gl[func].apply(gl, args);
                }
            }
        }

        if (step.frameBufferInfo) {
            twgl.bindFramebufferInfo(gl, step.frameBufferInfo);
            if (step.subViewport) // Also applies to frame bufs
                this._applySubViewport(step.subViewport, step.frameBufferInfo);

            applyGLSettings();

            //twgl.drawBufferInfo(gl, step.bufferInfo);
            gl.drawElements(gl.TRIANGLES, step.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Target = screen!

            if (step.subViewport)
                this._applySubViewport(step.subViewport);
            else
                this._applyViewport();

            //                gl.enable(gl.SCISSOR_TEST);
            applyGLSettings();


            //twgl.drawBufferInfo(gl, step.bufferInfo);
            gl.drawElements(gl.TRIANGLES, step.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
            //                gl.disable(gl.SCISSOR_TEST);
        }
    }

    /**
     * Renders as instructed by the current configuration
     * @param {bool} needsFullUpdate whether or not it needs a full update
     * if not it'll just do the last step which should always be just
     * rendering a texture onto a fullscreen quad
     */
    render(needsFullUpdate) {
        let gl = this.gl;

        if (needsFullUpdate)
            for (let step of this.steps)
                this._renderStep(step);
        else
            this._renderStep(this.steps[this.steps.length - 1]);

    }
}


module.exports = ConfigurableRenderer;
/**
 * Configuration of the webGL context in JSON format
 * @typedef {Object.<string,string>} GLConfiguration
 * @example
  {
   'cullFace': 'BACK',
   'clear' : 'COLOR_BUFFER_BIT'
}
  //
 *
 * @memberof module:Core/Renderer
 **/

/**
 * Configurations for one rendering step.
 *
 * @typedef {Object} RenderingStep
 * @property {twgl.ProgramInfo} programInfo Holds the shader program (see twgl library docs)
 * @property {twgl.FramebufferInfo} frameBufferInfo Holds the frame buffer, pass in null to set target to screen. (see twgl library docs)
 * @property {twgl.BufferInfo} bufferInfo Holds the shape to render, usually the bounding box (see twgl library docs)
 * @property {Object} uniforms JSON object corresponding to the uniforms in the shader.
 * @property {module:Core/Renderer.GLConfiguration} glSettings specify a set of openGL settings as key-value pairs in a JSON. These settings will be applied before the rendering is done.
 * @memberof module:Core/Renderer
 **/

/**
 *
 * @typedef {Object} RendererConfiguration
 * @property {WebGL2Context} gl WebGL2 target context to render to
 * @property {module:Core/View.Viewport} viewport The target viewport to render to
 * @property {module:Core/Renderer.RenderingStep[]} steps Array of rendering steps
 *
 * @memberof module:Core/Renderer
 **/
