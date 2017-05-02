let twgl = require('twgl.js');
let Environment = require('../environment');

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
    constructor(gl, environmentRef) {
        this.gl = gl;
        this.env = environmentRef;

        this.framebuffers = {

        };

        this.textures = {

        };

        this.transferFunctionTextures = {}; // {subviewID : TextureObj}

        this._initDebugTextures();
    }


    _initDebugTextures() {
        let gl = this.gl;
        this.textures['DebugTex1'] = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
                255, 255, 255, 255,
                192, 192, 192, 255,
                192, 192, 192, 255,
                255, 255, 255, 255,
            ],
        });
        this.textures['DebugTex2'] = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
                155, 155, 155, 255,
                192, 192, 192, 255,
                192, 122, 122, 255,
                255, 255, 255, 255,
            ],
        });
        this.textures['DebugTex3'] = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
                55, 55, 155, 255,
                92, 12, 192, 255,
                192, 92, 192, 255,
                255, 55, 55, 255,
            ],
        });
        this.textures['DebugTex4'] = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
                5, 55, 255, 255,
                192, 192, 192, 255,
                192, 2, 192, 255,
                155, 5, 255, 255,
            ],
        });

    }

    /**
     *
     * @typedef {Object} FramebufferDetail
     * @property {string|number} name name of the frame buffer
     *
     * @memberof module:Core/Renderer
     **/

    getTexture(name) {
        if (!this.textures[name])
            console.error('Texture with name: ' + name + ' is NOT registered...');
        return this.textures[name];
    }

    getFrameBuffer(name) {
        if (!this.framebuffers[name])
            console.error('FB  with name: ' + name + ' is NOT registered...');

        return this.framebuffers[name];
    }

    createDEBUG2DTexture(name) {
        let gl = this.gl;
        this.textures[name] = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
        255, 255, 255, 255,
        192, 192, 192, 255,
        192, 192, 192, 255,
        255, 255, 255, 255,
      ]
        });
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
            width: detail.width || gl.drawingBufferWidth,
            height: detail.height || gl.drawingBufferHeight,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            internalFormat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            wrap: gl.CLAMP_TO_EDGE,
            //premultiplyAlpha: false,
            //auto: true,
            //src: null
        });

        let framebuffer = twgl.createFramebufferInfo(gl, [{
            attach: gl.COLOR_ATTACTMENT0,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            target: gl.TEXTURE_2D,
            level: 0, //auto: true,
            attachment: this.textures[detail.name]
        }], detail.width, detail.height);

        twgl.bindFramebufferInfo(gl);

        this.framebuffers[detail.name] = framebuffer;
        return framebuffer;
    }

    create2DPickingBufferFB(name, pickingFunction) {
        // For now use the same thing
        let fb = this.create2DTextureFB({
            name: name,
            width: 1024,
            height: 1024
        });

        if (pickingFunction)
            fb.pick = pickingFunction;

        let gl = this.gl;

        // Convenience method attached to not do the binding/unbinding
        // manually
        fb.readPixels = (x, y, w, h, format, type, dst, offset) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
            gl.readPixels(x, y, w, h, format, type, dst, offset);
            //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
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

    createTransferFunction2DTexture(tfEditorKey) {
        let gl = this.gl;

        let TFEditor = tfEditorKey; // LOCAL or GLOBAL

        // 1. Find out which subview the TF editor is currently pointing to
        let subviewID = this.env.TransferFunctionManager.getReferencedCellIDForTFKey(tfEditorKey);

        // 2. Get the canvas of the editor, so it can be loaded into a tex
        let info = this.env.TransferFunctionManager.getCanvasForTFKey(tfEditorKey);
        let isoToColorData = info.canvas,
            bounds = info.textureBounds;

        // 3. Load the canvas img data into a texture of height 1
        let imgdata = isoToColorData.getContext('2d').getImageData(bounds.x, bounds.y, bounds.width, 1);
        let buffer = imgdata.data; // UInt8ClampedArray, i.e all values [0,255]

        // 4. Create the texture bound to the given subviewID
        this.transferFunctionTextures[subviewID] = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            internalFormat: gl.RGBA,
            width: bounds.width,
            height: 1,
            src: buffer,
            premultiplyAlpha: false
        });
    }

    getTransferFunction2DTexture(subviewID) {
        if (!this.transferFunctionTextures[subviewID]) // default to global
            return this.transferFunctionTextures['GLOBAL'];

        return this.transferFunctionTextures[subviewID];
    }
}

module.exports = FrameBufferAndTextureManager;
