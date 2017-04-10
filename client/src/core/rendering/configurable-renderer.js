let twgl = require('twgl.js');
let m4 = twgl.m4;

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

    _applyViewport() {
        this.gl.viewport(
            this.viewport.x0,
            this.viewport.y0,
            this.viewport.width,
            this.viewport.height);
    }

    /**
     * Renders as instructed by the current configuration
     */
    render() {
        let gl = this.gl;

        //let step0 = this.steps[0];
        //let programInfo = step0.programInfo,
        //    program = programInfo.program;
        //let bufferInfo = step0.bufferInfo;
        //
        //twgl.bindFramebufferInfo(gl, step0.frameBufferInfo);
        //
        //gl.enable(gl.DEPTH_TEST);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //gl.enable(gl.CULL_FACE);
        //
        //let applyViewport = () => {
        //    gl.viewport(
        //        this.viewport.x0,
        //        this.viewport.y0,
        //        this.viewport.width,
        //        this.viewport.height);
        //}
        //
        //var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
        //var eye = [1, 4, -6];
        //var target = [0, 0, 0];
        //var up = [0, 1, 0];
        //
        //var camera = m4.lookAt(eye, target, up);
        //var view = m4.inverse(camera);
        //var viewProjection = m4.multiply(projection, view);
        //var world = m4.rotationY(0);
        //
        ////uniforms.u_viewInverse = camera;
        ////uniforms.u_world = world;
        ////uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        //
        //let tmp_u_worldViewProjection = m4.multiply(viewProjection, world);
        //
        //this.uniforms.u_WorldViewProjection = tmp_u_worldViewProjection;
        //
        //
        //gl.useProgram(program);
        //
        //gl.cullFace(gl.BACK);
        //
        //twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        //twgl.setUniforms(programInfo, this.uniforms);
        //
        //
        //applyViewport();
        //
        //gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);


        for (let step of this.steps) {
            let programInfo = step.programInfo;

            //twgl.bindFramebufferInfo(gl, step.frameBufferInfo);
            gl.useProgram(programInfo.program);
            this._applyViewport();



            if (step.glSettings) {
                for (let func in step.glSettings) {
                    // Ex: {cullFace: 'BACK'} evalues into:
                    // gl[cullFace](gl[BACK]) which is the same as
                    // gl.cullFace(gl.BACK)
                    gl[func](gl[step.glSettings[func]]);
                }
            }

            twgl.setBuffersAndAttributes(gl, programInfo, step.bufferInfo);
            //twgl.setUniforms(programInfo, step.uniforms); // One bundle per step
            twgl.setUniforms(programInfo, this.uniforms); // Same bundle for all

            //            if (step.frameBufferInfo) {
            //                twgl.bindFramebufferInfo(gl, step.frameBufferInfo);
            //                //twgl.drawBufferInfo(gl, step.bufferInfo);
            //                gl.drawElements(gl.TRIANGLES, step.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
            //
            //            } else {
            //                gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Target = screen!
            //                //twgl.drawBufferInfo(gl, step.bufferInfo);
            gl.drawElements(gl.TRIANGLES, step.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
            //            }
        }
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
