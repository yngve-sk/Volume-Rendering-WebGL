let twgl = require('twgl.js');

/**
 * Manages and creates frame buffers and textures.
 *
 * @memberof module:Core/Renderer
 */
class FrameBufferAndTextureManager {
    /**
     * @param {WebGL2Context} gl the webGL context the framebuffer manager is tied to
     * @constructor
     */
    constructor(gl) {
        this.gl = gl;
        this.framebuffers = {

        };

        this.textures = {

        };
    }


    /**
     *
     * @typedef {Object} FramebufferDetail
     * @property {string|number} name name of the frame buffer
     * @property {number} width width of the texture attachment
     * @property {number} height height of the texture attachment
     *
     * @memberof module:Core/Renderer
     **/

    getTexture(name) {
        if (!this.textures[name])
            alert('Texture with name: ' + name + ' is NOT registered...');
        return this.textures[name];
    }

    getFrameBuffer(name) {
        if (!this.framebuffers[name])
            alert('FB  with name: ' + name + ' is NOT registered...');

        return this.framebuffers[name];
    }

    /**
     * Creates a frame buffer holding a 2D texture
     *
     * @param {module:Core/Renderer.FramebufferDetail} detail
     */
    create2DTextureFB(detail) {
        let gl = this.gl;
        this.textures[detail.name] = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            width: detail.width,
            height: detail.height,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            internalFormat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            wrap: gl.CLAMP_TO_EDGE,
            premultiplyAlpha: false,
            auto: true,
            src: null
        });

        let framebuffer = twgl.createFramebufferInfo(gl, [{
            attach: gl.COLOR_ATTACTMENT0,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            target: gl.FRAMEBUFFER,
            level: 0,
            attachment: this.textures[detail.name]
        }]);

        this.framebuffers[detail.name] = framebuffer;
        return this.framebuffer;
    }



    /**
     * @typedef {Object} GridPos2Isovalue3DTextureDetail
     * @property {string} name name of the texture (used when fetching it)
     * @property {number} cols number of cols
     * @property {number} rows number of rows
     * @property {number} slices number of slices
     * @property {Int16Array} isovalues the isovalue array
     *
     * @memberof module:Core/Renderer
     **/

    /**
     * Creates a 3D texture from an isovalue array
     *
     * @param {module:Core/Renderer.GridPos2Isovalue3DTextureDetail} detail
     */
    createGridPos2Isovalue3DTexture(detail) {
        let gl = this.gl;
        this.textures[detail.name] =
            twgl.createTexture(gl, {
                target: gl.TEXTURE_3D,
                width: detail.cols,
                height: detail.rows,
                depth: detail.slices,
                internalFormat: gl.R16I, // format when sampling from shader
                format: gl.RED_INTEGER, // format of data
                type: gl.SHORT, // type of data
                src: detail.isovalues,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                wrapR: gl.CLAMP_TO_EDGE,
                premultiplyAlpha: false
            });
    }
}

module.exports = FrameBufferAndTextureManager;
