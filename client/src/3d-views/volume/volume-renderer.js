/*
    Renders a volume model onto a GL context,
    model is supposed to be treated as _READ ONLY_
    from here.

    To render stuff, the volume renderer needs...
        * A camera
            - Perspective: Near plane + position.
                For ray casting... Render the NEAR PLANE.
                Use eyePos ---> Frag Pos to shoot the ray in the f-shader.

        * A bounding box around the volume:
            - (MinX,MinY,MinZ), (MaxX, MaxY, MaxZ) (to begin with)

        * A 3D Texture mapping coord to isovalue
        * A 1D Texture mapping isovalue to color (FOR NOW, TODO: 2D)
        * ...TO BE CONTINUED.

*/
let glsl = require('glslify');
let twgl = require('twgl.js'),
    m4 = twgl.m4,
    shapes = twgl.primitives;
shapes.createCuboidVertices = require('../../geometry/box');

let Environment = null;
let GetColorGradientInput = null;

let Buttons = require('../mouse-buttons');
let Transformations = require('../viewing&transformations/transformations');
let Camera = require('../viewing&transformations/camera');

setTimeout(() => {
    Environment = require('../../environment/environment');
    console.log(Environment); // Shitty workaround, TODO find something better
    GetColorGradientInput = Environment.TransferFunctionManager.getTransferFunction('GLOBAL').canvas.node();

}, 1500);

class VolumeRenderer {
    constructor(canvas, environmentRef) {
        twgl.setDefaults({
            attribPrefix: "a_"
        });
        let gl = canvas.getContext("webgl2", {
            premultipliedAlpha: false,
            alpha: true,
            depth: true
        });
        this.gl = gl;

        console.log(gl.getExtension('OES_texture_float'));
        gl.getExtension('EXT_color_buffer_float');
        var available_extensions = gl.getSupportedExtensions();
        console.log(available_extensions);

        let firstPassVShaderCode = glsl.file('./shaders/shader.pass1.v.glsl'),
            firstPassFShaderCode = glsl.file('./shaders/shader.pass1.f.glsl');

        let secondPassVShaderCode = glsl.file('./shaders/shader.pass2.v.glsl'),
            secondPassFShaderCode = glsl.file('./shaders/shader.pass2.f.glsl');

        let thirdPassVShaderCode = glsl.file('./shaders/shader.pass3.v.glsl'),
            thirdPassFShaderCode = glsl.file('./shaders/shader.pass3.f.glsl');

        this.shaderProgramInfos = {
            firstPass: twgl.createProgramInfo(this.gl, [firstPassVShaderCode, firstPassFShaderCode]),
            secondPass: twgl.createProgramInfo(this.gl, [secondPassVShaderCode, secondPassFShaderCode]),
            thirdPass: twgl.createProgramInfo(this.gl, [thirdPassVShaderCode, thirdPassFShaderCode])
        };

        this.transformation = new Transformations();

        this.camera = new Camera({
            fieldOfViewRadians: Math.PI / 6,
            aspectRatio: gl.canvas.clientWidth / gl.canvas.clientHeight,
            zNear: 0.2,
            zFar: 20
        });

        this.rayOriginsTexture = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            width: 300,
            height: 150,
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

        this.rayDirectionsTexture = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            width: 300,
            height: 150,
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

        this.rayEndPointsTexture = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            width: 300,
            height: 150,
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

        this.imageTexture = twgl.createTexture(gl);

        this.rayOriginsFBInfo = twgl.createFramebufferInfo(gl, [{
            attach: gl.COLOR_ATTACTMENT0,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            target: gl.FRAMEBUFFER,
            level: 0,
            attachment: this.rayOriginsTexture
        }]);

        this.rayEndPointsFBInfo = twgl.createFramebufferInfo(gl, [{
            attach: gl.COLOR_ATTACTMENT0,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            target: gl.FRAMEBUFFER,
            level: 0,
            attachment: this.rayEndPointsTexture
        }]);

        //        let status1 = gl.checkFramebufferStatus(this.rayOriginsFBInfo.framebuffer);

        this.rayDirectionsFBInfo = twgl.createFramebufferInfo(gl, [{
            auto: true,
            attachment: this.rayDirectionsTexture
        }]);

        //        let status2 = gl.checkFramebufferStatus(this.rayDirectionsFBInfo.framebuffer);

        twgl.bindFramebufferInfo(gl);

        this.uniforms = {
            u_lightWorldPos: [1, 8, -10],
            u_lightColor: [1, 0.8, 0.8, 1],
            u_ambient: [0, 0, 0, 1],
            u_specular: [1, 1, 1, 1],
            u_shininess: 50,
            u_specularFactor: 1,

            u_viewportWidth: -1,
            u_viewportHeight: -1,


            u_TexCoordToRayOrigin: this.rayOriginsTexture, // OK!
            u_TexCoordToRayEndPoints: this.rayEndPointsTexture,
            u_TexCoordToRayDirection: this.rayDirectionsTexture, // OK!

            u_ModelXYZToIsoValue: null, // ISOVALUES LOOKUP TODO
            u_ModelXYZToGradientMagnitude: null,

            u_IsoValueToColor: null, // TF TEXTURE, TODO.
            u_IsoValueToOpacity: null, // TF TEXTURE, TODO.

            u_OpacityStopThreshold: 0.9,
            u_Steps: 512, // TODO have slider rdy for this property.
            u_AlphaCorrection: 0.5,
            u_Spacing: null,
            u_BoundingBoxNormalized: null,

            u_world: null,
            u_worldInverseTranspose: null,
            u_worldViewProjection: null,
            u_viewInverse: null,
            u_worldView: null,
            u_view: null,
            u_projection: null
        };

        this.doRefresh = true;

    }

    toggleDoRender() {
        this.doRefresh = !this.doRefresh;
        this.printState();
    }

    printState() {
        console.log(GetColorGradientInput());
    }

    /*

        Does the following:
        1. Render front faces of cube to texture TF,
            TF(xScreen, yScreen) -> (xModel, yModel, zModel)
        2. Render back faces of cube to texture TB, then...

            let T = Empty texture (xScreen, yScreen) -> (DirectionNormalized, lengthUnnormalized)

            * For each pixel P = (xScreen, yScreen),
                let PF = TF(xScreen, yScreen)
                let PB = TB(xScreen, yScreen)
                let F2B = PB.xyz - PF.xyz
                let length = length(F2B)
                let F2BNormalized = normalize(F2B)
                T(xScreen, yScreen) = (F2BNormalized, length)

        ...Now texture coords can be mapped to:
            1. The start position of the ray, TF(x,y) -> StartPos
            2. The direction & unnormalized length of the ray, T(x,y) -> (direction, length)

        3. The actual raycasting (TODO)

    */
    render() {
        let gl = this.gl;

        //this._initTextures();

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        this.__applyViewportPercentages(gl, 0, 0, 1.0, 1.0);
        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._updateTextures();
        this._updateUniforms();

        gl.enable(gl.CULL_FACE);

        this._renderFirstPass(this.rayOriginsFBInfo, gl.BACK);
        this._renderFirstPass(null, gl.BACK, [0.02, 0.67, 0.31, 0.31]);
        this.__applyViewportPercentages(gl, [0, 0, 1.0, 1.0]);

        this._renderFirstPass(this.rayEndPointsFBInfo, gl.FRONT);
        this._renderFirstPass(null, gl.FRONT, [0.33, 0.67, 0.31, 0.31]);

        this._renderSecondPass(this.rayDirectionsFBInfo);
        this._renderSecondPass(null, [0.67, 0.67, 0.31, 0.31]);
        this.__applyViewportPercentages(gl, [0, 0, 1.0, 1.0]);

        this._renderThirdPass(null); // To frame

        //twgl.bindFramebufferInfo(gl);
        //gl.drawElements(gl.TRIANGLES, this.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

        if (this.doRefresh) window.requestAnimationFrame(this.render.bind(this));
    }

    __applyViewportPercentages(gl, args) {
        gl.viewport(
            args[0] * gl.canvas.width,
            args[1] * gl.canvas.height,
            args[2] * gl.canvas.width,
            args[3] * gl.canvas.height
        );
    }


    _updateUniforms() {
        let view = this.camera.getViewMatrix(),
            viewInverse = this.camera.getLookAt(),
            projection = this.camera.getPerspectiveMatrix(),
            viewProjection = this.camera.getViewProjectionMatrix(),

            world = this.transformation.getTransformation(),
            worldInverseTranspose = m4.transpose(m4.inverse(world)),
            worldViewProjection = m4.multiply(viewProjection, world);


        this.uniforms.u_world = world;
        this.uniforms.u_worldInverseTranspose = worldInverseTranspose;
        this.uniforms.u_worldViewProjection = worldViewProjection;

        this.uniforms.u_viewInverse = viewInverse;
        this.uniforms.u_view = view;

        this.uniforms.u_projection = projection;
    }

    _updateTextures() {
        let check = Environment.TransferFunctionManager.checkNeedsUpdate('GLOBAL');
        if (check) {
            this.__updateTexture_IsoToColorOpacity();
        }
    }

    _initTextures() {
        // Needed textures are...
        // XYZ -> Isovalue
        // Isovalue -> Color/opacity
        let gl = this.gl;

        //this.uniforms.u_ModelXYZToIsoValue = twgl.createTexture(gl, {
        //    target: gl.TEXTURE_3D,
        //    width: Environment.VolumeDataset.header.cols,
        //    height: Environment.VolumeDataset.header.slices,
        //    depth: Environment.VolumeDataset.header.rows,
        //    internalFormat: gl.R8UI, // format when sampling from shader
        //    format: gl.RED_INTEGER, // format of data
        //    type: gl.UNSIGNED_BYTE, // type of data
        //    src: Environment.VolumeDataset.isovalues
        //});


        this.uniforms.u_ModelXYZToIsoValue = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: Environment.VolumeDataset.header.cols,
            height: Environment.VolumeDataset.header.rows,
            depth: Environment.VolumeDataset.header.slices,
            internalFormat: gl.R16I, // format when sampling from shader
            format: gl.RED_INTEGER, // format of data
            type: gl.SHORT, // type of data
            src: Environment.VolumeDataset.isovalues,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE,
            premultiplyAlpha: false
        });

        let spacing = Environment.VolumeDataset.header.spacing;

        this.uniforms.u_Spacing = new Float32Array([spacing.x, spacing.y, spacing.z]);

        //this.uniforms.u_ModelXYZToGradientMagnitude = twgl.createTexture(gl, {
        //    target: gl.TEXTURE_3D,
        //    width: Environment.VolumeDataset.header.cols,
        //    height: Environment.VolumeDataset.header.slices,
        //    depth: Environment.VolumeDataset.header.rows,
        //    internalFormat: gl.RG32F, // format when sampling from shader
        //    format: gl.RG, // format of data
        //    type: gl.FLOAT, // type of data
        //    src: Environment.VolumeDataset.isovaluesAndGradientMagnitudes
        //});

        //this.__updateTexture_IsoToColorOpacity();

        //this.u_IsoValueToColor = Environment.TransferFunctionManager.tfs['GLOBAL']
        //this.u_IsoValueToOpacity = Environment.TransferFunctionManager.tfs['GLOBAL']

        console.log("GENERATED TEXTURESS ! !!! !!");
        console.log(this.uniforms.u_ModelXYZToIsoValue);
        console.log(this.uniforms.u_IsoValueToColorOpacity);
    }

    __updateTexture_IsoToColorOpacity() {
        console.log('__updateTexture_IsoToColorOpacity()');
        let info = Environment.TransferFunctionManager.getCanvasForTFKey('GLOBAL');
        let isoToColorData = info.canvas,
            bounds = info.textureBounds;

        let gl = this.gl;

        let imgdata = isoToColorData.getContext('2d').getImageData(bounds.x, bounds.y, bounds.width, 1);
        let buffer = imgdata.data; // UInt8ClampedArray, i.e all values [0,255]

        //this.uniforms.u_IsoValueToColorOpacity = gl.createTexture();
        //gl.bindTexture(gl.TEXTURE_2D, this.uniforms.u_IsoValueToColorOpacity);
        //gl.texSubImage2D(gl.TEXTURE_2D,
        //    0, //level
        //    bounds.x,
        //    bounds.y,
        //    bounds.width,
        //    bounds.height,
        //    gl.RGBA, // format
        //    gl.UNSIGNED_BYTE, // format of canvas data
        //    info.canvas
        //);

        this.uniforms.u_IsoValueToColorOpacity = twgl.createTexture(this.gl, {
            target: this.gl.TEXTURE_2D,
            internalFormat: gl.RGBA,
            width: bounds.width,
            height: 1,
            src: buffer,
            premultiplyAlpha: false
        });

    }

    _renderFirstPass(fbinfo, cull, viewport) {
        let gl = this.gl;

        gl.useProgram(this.shaderProgramInfos.firstPass.program);

        gl.cullFace(cull ? cull : gl.BACK);

        twgl.setBuffersAndAttributes(gl, this.shaderProgramInfos.firstPass, this.bufferInfo);
        twgl.setUniforms(this.shaderProgramInfos.firstPass, this.uniforms);

        twgl.bindFramebufferInfo(gl, fbinfo);

        if (viewport)
            this.__applyViewportPercentages(gl, viewport);

        gl.drawElements(gl.TRIANGLES, this.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    }

    _renderSecondPass(fbinfo, viewport) {
        let gl = this.gl;

        gl.cullFace(gl.FRONT);
        gl.useProgram(this.shaderProgramInfos.secondPass.program);

        twgl.setBuffersAndAttributes(gl, this.shaderProgramInfos.secondPass, this.bufferInfo);
        twgl.setUniforms(this.shaderProgramInfos.secondPass, this.uniforms);

        twgl.bindFramebufferInfo(gl, fbinfo);

        if (viewport)
            this.__applyViewportPercentages(gl, viewport);

        gl.drawElements(gl.TRIANGLES, this.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    }

    _renderThirdPass(fbinfo) {
        let gl = this.gl;

        gl.useProgram(this.shaderProgramInfos.thirdPass.program);
        gl.cullFace(gl.BACK);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        twgl.setBuffersAndAttributes(gl, this.shaderProgramInfos.thirdPass, this.bufferInfo);
        twgl.setUniforms(this.shaderProgramInfos.thirdPass, this.uniforms);

        twgl.bindFramebufferInfo(gl, fbinfo);
        gl.drawElements(gl.TRIANGLES, this.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    }

    _init() {}

    _initShaders() {}

    _initBuffers() {
        // 1. Create the bounding box
        let bb = Environment.VolumeDataset.header.normalizedBB;
        let width = bb.width,
            height = bb.height,
            depth = bb.depth;

        this.uniforms.u_BoundingBoxNormalized = new Float32Array([width, height, depth]);
        let vertices = shapes.createCuboidVertices(width, height, depth);

        //let vertices = shapes.createCubeVertices(width, height, depth);
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, {
            position: vertices.position,
            indices: vertices.indices,
            normal: vertices.normal,
            texcoord: vertices.texcoord
        });
    }

    mouseDown(x, y, button) {
        //console.log("Mouse button " + Buttons[button] + " down @ (" + x + ", " + y + ")");
    }

    mouseUp(x, y, button) {
        //console.log("Mouse button " + Buttons[button] + " up @ (" + x + ", " + y + ")");
    }

    mouseUpAfterDrag(x, y, button) {
        //console.log("Mouse button " + Buttons[button] + " up after drag @ (" + x + ", " + y + ")");
    }

    mouseMove(newX, newY, dx, dy, button) {
        //console.log("Mouse moved @ volume renderer to (" + newX + ", " + newY + "), dx = " + dx + ", dy = " + dy);
    }

    mouseDrag(newX, newY, dx, dy, button) {
        let ROTATIONAL_SPEED = 0.009;
        let SPEED = 0.009;
        //console.log("MouseDrag, " + button);
        switch (button) {
            case Buttons.LEFT:
                // Rotate
                //                this.transformation.rotateY(-dx * ROTATIONAL_SPEED);
                //                this.transformation.rotateX(-dy * ROTATIONAL_SPEED);

                this.transformation.rotateFromEye(dx * ROTATIONAL_SPEED, -dy * ROTATIONAL_SPEED, this.camera.eye, this.camera.up);

                //console.log("ROTATE...");
                //console.log(this.transformation);
                break;
            case Buttons.RIGHT:
                // Translate
                this.transformation.translate(dx * SPEED, 0, dy * SPEED);
                break;
            case Buttons.MIDDLE:
                // Zoom in/out according to dy
                break;
        }
    }

    mouseClick(x, y, button) {

    }
}


module.exports = VolumeRenderer;
