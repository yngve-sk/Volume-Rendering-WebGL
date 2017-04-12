let d3 = require('d3');

let Subview = require('./subview');
let MiniatureSplitViewOverlay = require('../../widgets/split-view/miniature-split-view-overlay');
let SubcellLayout = require('../../widgets/split-view/subcell-layout');

let Models = require('../linkable-models').Models;

let ShaderManager = require('../resource-managers/shader-manager');
let FBAndTextureManager = require('../resource-managers/frame-buffer-and-texture-manager');
let ModelSyncManager = require('../resource-managers/model-sync-manager');
let UniformManager = require('../resource-managers/uniform-manager');
let BufferManager = require('../resource-managers/buffer-manager');


let Settings = require('../settings').Views.ViewManager,
    OverlaySettings = Settings.WindowsOverlay;

let twgl = require('twgl.js');
let createCuboidVertices = require('../../geometry/box');

let glsl = require('glslify');


let OverlayCellEventToModel = {
    'sphere': 'SPHERE',
    'volume': 'CAMERA',
    'slicer': 'SLICER'
};

/** @module Core/View */

/**
 * Windowing manager built on the SplitBox / MiniatureSplitView classes,
 * Will manage multiple renderers operating on the same WebGL context,
 * delegate events and such
 **/
class ViewManager {
    constructor(environmentRef, getAddRemoveView) {
        this.env = environmentRef;

        this.canvasContainer = d3.select('#webgl-canvas-container');
        this.masterCanvas = document.getElementById('webgl-master-canvas');

        this.masterContext = this.masterCanvas.getContext('webgl2', {
            premultipliedAlpha: false,
            alpha: true,
            depth: true
        });

        this.masterContext.getExtension('EXT_color_buffer_float');
        this.masterContext.getExtension('OES_texture_float')
        twgl.setDefaults({
            attribPrefix: "a_"
        });

        this.subviews = {
            //0: new Subview(this.masterContext)
        };

        twgl.resizeCanvasToDisplaySize(this.masterContext.canvas);


        this.modelSyncManager = new ModelSyncManager(this.masterContext);
        this.shaderManager = new ShaderManager(this.masterContext);
        this.FBAndTextureManager = new FBAndTextureManager(this.masterContext);
        this.uniformManager = new UniformManager();
        this.bufferManager = new BufferManager(this.masterContext);
        this.boundingBoxBuffer = null; // Dependent on dataset


        var arrays = {
            position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
            normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
            texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
            indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
        };
        this.boundingBoxBuffer2 = twgl.createBufferInfoFromArrays(this.masterContext, arrays);

        //twgl.bindFramebufferInfo(this.masterContext);


        let eventListenerOverlayCallback = (cellID, subcellName, event) => {
            //            console.log("cellID: " + cellID + ", subcell: " + subcellName + ", loc: (" + event.pos.x + ", " + event.pos.y + "), button = " +
            //                event.button);
            console.log("cellID: " + cellID + ", subcell: " + subcellName + ", loc: (" + event.pos.x + ", " + event.pos.y + "), button = " +
                event.button);

            if (this.subviews[cellID]) {
                let modelName = OverlayCellEventToModel[subcellName];
                let model = this.modelSyncManager.getActiveModel(modelName, cellID);
                this.modelSyncManager.getActiveModel(modelName, cellID).mouse(event);
                this.uniformManager.updateAll();
            } else
            if (this.subviews[cellID])
                this.subviews[cellID].notifyEventDidHappen(subcellName, event)
            else
                console.log("Subview not initialized yet (active dataset required)");
        }

        let overlayConfig = {
            containerID: 'webgl-canvas-container',
            coverMe: this.masterCanvas,
            miniatureSplitViewGetter: getAddRemoveView,
            options: {
                showIDs: OverlaySettings.Options.showIDs,
                bottomTopThresholdPercentage: OverlaySettings.Options.bottomTopThresholdPercentage
            },
            subcellLayout: new SubcellLayout({
                changeLayoutThresholdMultiplier: OverlaySettings.SubcellLayout.changeLayoutThresholdMultiplier,
                standardSizeMultiplier: OverlaySettings.SubcellLayout.standardSizeMultiplier
            }),
            listener: eventListenerOverlayCallback
        };

        this.splitviewOverlay = new MiniatureSplitViewOverlay(overlayConfig);

        window.addEventListener('resize', () => {
            this._resize();
        }, false);

        this._debugDoRefresh = true;

        setTimeout(() => {
            this._init();
        }, 1000);
    }

    /**
     * Initializes frame buffers, textures, shader programs and binds uniform managers
     * to models. To be on the safe side - everything in the environment must be
     * initialized before this is initialized. (Including dataset)
     */
    _init() {
        //        this._initDebug();

        //this.FBAndTextureManager.createDEBUG2DTexture('DebugTex');

        // Works!
        this._genFrameBuffersAndTextureTargets();
        this._bindUniformManager();
        this.bufferManager.createBoundingBoxBufferInfo('DebugCubeBuffer', 1.0, 0.5, 0.7);
        let bufferInfo = this.bufferManager.getBufferInfo('DebugCubeBuffer');

        this.addNewView(0);
        this.refresh();
    }

    _initDebug() {
        this.FBAndTextureManager.createDEBUG2DTexture('DebugTex');
        this._bindUniformManagerDebug();

        // Works!
        this.bufferManager.createBoundingBoxBufferInfo('DebugCubeBuffer', 1.0, 0.5, 0.7);
        let bufferInfo = this.bufferManager.getBufferInfo('DebugCubeBuffer');

        this.addNewView(0);
        this.refresh();
    }

    _generateDebugConfigurationForSubview(subviewID) {
        let DebugConfig = {
            uniforms: this.uniformManager.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('TextureBackMinusFront'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
            ]
        };

        return DebugConfig;
    }

    _bindUniformManagerDebug() {
        let gl = this.masterContext;
        let tex = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: [
                 255, 255, 255, 255,
                 192, 192, 192, 255,
                 192, 192, 192, 255,
                 255, 255, 255, 255,
               ],
        });
        let uniforms = {
            u_LightWorldPos: [1, 8, -10],
            u_LightColor: [1, 0.8, 0.8, 1],
            u_Ambient: [0, 0, 0, 1],
            u_Specular: [1, 1, 1, 1],
            u_Shininess: 50,
            u_SpecularFactor: 1,
            u_Diffuse: tex //this.FBAndTextureManager.getTexture('DebugTex'),
        };
        // Adding some as shared, some as unique (should work)
        this.uniformManager.addUnique('u_LightWorldPos', (subviewID) => {
            return uniforms.u_LightWorldPos
        });
        this.uniformManager.addUnique('u_LightColor', (subviewID) => {
            return uniforms.u_LightColor
        });
        this.uniformManager.addShared('u_Ambient', () => {
            return uniforms.u_Ambient
        });
        this.uniformManager.addShared('u_Specular', () => {
            return uniforms.u_Specular
        });
        this.uniformManager.addShared('u_Shininess', () => {
            return uniforms.u_Shininess
        });
        this.uniformManager.addShared('u_SpecularFactor', () => {
            return uniforms.u_SpecularFactor
        });
        this.uniformManager.addShared('u_BoundingBoxNormalized', () => {
            return new Float32Array([1.0, 0.5, 0.7]); // TODO return the actual bounding box
        });
        this.uniformManager.addShared('u_Diffuse', () => {
            return this.FBAndTextureManager.getTexture('DebugTex'); //uniforms.u_Diffuse
        });
        this.uniformManager.addUnique('u_ViewInverse', (subviewID) => {
            //return uniforms.u_viewInverse;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getLookAt();
        });
        this.uniformManager.addUnique('u_World', (subviewID) => {
            //return uniforms.u_world;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldMatrix();
        });
        this.uniformManager.addUnique('u_WorldInverseTranspose', (subviewID) => {
            //return uniforms.u_worldInverseTranspose;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldInverseTranspose();
        });
        this.uniformManager.addUnique('u_WorldViewProjection', (subviewID) => {
            //return uniforms.u_worldViewProjection;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldViewProjectionMatrix();
        });
        this.uniformManager.addUnique('u_AspectRatio', (subviewID) => {
            return this.subviews[subviewID].getAspectRatio();
        });
    }


    _genFrameBuffersAndTextureTargets() {
        this.FBAndTextureManager.create2DTextureFB({
            gl: this.masterContext,
            name: 'FrontFace',
            width: 300,
            height: 150
        });

        this.FBAndTextureManager.create2DTextureFB({
            gl: this.masterContext,
            name: 'BackFace',
            width: 300,
            height: 150
        });
    }

    datasetDidChange() {
        this._init();
    }

    _genTextures() {
        let dataset = this.env.getActiveDataset('GLOBAL');
        if (!dataset)
            return;

        let h = dataset.header;

        this.FBAndTextureManager.createGridPos2Isovalue3DTexture({
            name: 'u_ModelXYZToIsoValue', // Will be used for looking it up again
            cols: h.cols,
            rows: h.rows,
            slices: h.slices,
            isovalues: dataset.isovalues
        });
    }

    _bindUniformManager() {
        // 1. Set up getters
        // shared
        this.uniformManager.addShared('u_BoundingBoxNormalized', () => {
            return new Float32Array([1.0, 0.5, 0.7]); // TODO return the actual bounding box

            //            let nbb = this.env.getActiveDataset('GLOBAL').header.normalizedBB;
            //            return new Float32Array([nbb.width, nbb.height, nbb.depth]);
        });

        this.FBAndTextureManager.createDEBUG2DTexture('DebugTex');
        this.FBAndTextureManager.create2DTextureFB({
            width: this.masterCanvas.width,
            height: this.masterCanvas.height,
            name: 'DebugTex2'
        });
        this.uniformManager.addShared('u_TexCoordToRayOrigin', () => {
            return this.FBAndTextureManager.getTexture('FrontFace'); // FrontFace
        });
        this.uniformManager.addShared('u_TexCoordToRayEndPoint', () => {
            return null; //this.FBAndTextureManager.getTexture('BackFace');
        });
        this.uniformManager.addShared('u_ModelXYZToIsoValue', () => {
            return null; //this.FBAndTextureManager.getTexture('u_ModelXYZToIsoValue');
        });
        this.uniformManager.addShared('u_AlphaCorrectionExponent', () => {
            // New sampling rate / base sampling rate.
            // Let it be 1 for now since sampling rate is not dynamic.
            return 1;
        });
        this.uniformManager.addShared('u_SamplingRate', () => {
            let d = this.env.getActiveDataset('GLOBAL');
            if (!d)
                return 0.1; // For debugging only

            let h = d.header;
            let m = Math.max(h.cols, h.rows, h.slices);

            return 1.0 / m;
        });

        // unique
        this.uniformManager.addUnique('u_WorldViewProjection', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getWorldViewProjectionMatrix();
        });
        this.uniformManager.addUnique('u_AspectRatio', (subviewID) => {
            return this.subviews[subviewID].getAspectRatio();
        });


    }



    linkChanged(modelKey) {
        this.modelSyncManager.updateSyncForModelKey(modelKey);
    }

    _generateBasicVolumeConfigForSubview(subviewID) {
        let BasicVolumeConfig = {
            uniforms: this.uniformManager.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.boundingBoxBuffer2, // The bounding box!
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: this.boundingBoxBuffer2, // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('BasicVolume'),
                    frameBufferInfo: null, // Render to screen
                    bufferInfo: this.boundingBoxBuffer2, // The bounding box!
                    /*NEEDED UNIFORMS:
                    u_WorldViewProjection,    <- Depends on camera for model
                    u_BoundingBoxNormalized   <- In dataset header
                    u_TexCoordToRayOrigin     <- In texture belonging to FB
                    u_TexCoordToRayEndPoint   <- In texture belonging to FB
                    u_ModelXYZToIsoValue      <- Get from texture (shared for all)
                    u_IsoValueToColorOpacity  <- Texture for TF obj the model is pointing to
                    u_AlphaCorrectionExponent <- Precalculated float
                    u_SamplingRate            <- 1 voxel per step, i.e 1/max(w,h,d)
                    */
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
            ]
        };

        return BasicVolumeConfig;
    }

    updateUniformsForModel(subviewID, modelName) {

    }

    uniformsDidChangeForSubview(subviewID) {

    }

    addNewView(id) {
        this.subviews[id] = new Subview(this.masterContext);
        this.modelSyncManager.addSubview(id);
        this.uniformManager.addSubview(id);
        //        let config = this._generateBasicVolumeConfigForSubview(id);
        let config = this._generateDebugConfigurationForSubview(id);
        this.subviews[id].configureRenderer('volume', config);

        this.syncWithLayout();
    }

    removeView(id) {
        delete this.subviews[id];
        this.modelSyncManager.removeSubview(id);
        this.uniformManager.removeSubview(id);

        this.syncWithLayout();
    }

    /**
     * Syncs the view manager with the layout, and passes the subcell
     * viewports down to each respective subview.
     */
    syncWithLayout() {

        let normalizedViewports = this.splitviewOverlay.render();
        // TODO sync aspect ratio ... HMH!

        let canv = this.masterContext.canvas;
        let width = canv.width,
            height = canv.height;

        let canvasViewports = {};

        for (let subviewID in normalizedViewports) {
            canvasViewports[subviewID] = normalizedViewports[subviewID].map(
                (normalized) => {
                    return normalized.denormalize(width, height);
                });
        }

        for (let subviewID in this.subviews) {
            this.subviews[subviewID].setViewports(canvasViewports[subviewID]);
        }
    }

    _resize() {
        this.syncWithLayout();
    }

    _genBoundingBoxBuffer() {
        let dataset = this.env.getActiveDataset('GLOBAL');

        let bb = dataset.header.normalizedBB;

        let vertices = createCuboidVertices(bb.width, bb.height, bb.depth);

        // TODO move logic for this shit to a manager
        this.boundingBoxBuffer = twgl.createBufferInfoFromArrays(this.masterContext, {
            position: vertices.position,
            indices: vertices.indices,
            normal: vertices.normal,
            texcoord: vertices.texcoord
        });
    }

    _debugRotateCube(subviewID) {
        let cam = this.modelSyncManager.getActiveModel('CAMERA', subviewID);

        if (subviewID % 6 === 0)
            cam.getModelTransformation().rotateZ(-0.007);
        else if (subviewID % 2 === 0)
            cam.getModelTransformation().rotateY(0.007);
        else if (subviewID % 3 === 0)
            cam.getModelTransformation().rotateX(0.007);


        this.uniformManager.updateAll();
    }

    __applyViewportPercentages(gl, args) {
        gl.viewport(
            args[0] * gl.canvas.width,
            args[1] * gl.canvas.height,
            args[2] * gl.canvas.width,
            args[3] * gl.canvas.height
        );
    }

    refresh() {
        let gl = this.masterContext;
/*

        //twgl.resizeCanvasToDisplaySize(gl.canvas);
        //this.__applyViewportPercentages(gl, 0, 0, 1.0, 1.0);

        this.uniformManager.updateAll();

        let pos2RGBInfo = this.shaderManager.getProgramInfo('PositionToRGB');
        let bufferInfo = this.bufferManager.getBufferInfo('DebugCubeBuffer');
        let tex2FaceInfo = this.shaderManager.getProgramInfo('TextureToBBColor');

        let tex = twgl.createTexture(gl, {
            target: gl.TEXTURE_2D,
            width:  gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
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

        let fb = twgl.createFramebufferInfo(gl, [{
            attach: gl.COLOR_ATTACTMENT0,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            target: gl.TEXTURE_22D,
            level: 0,
            attachment: tex
        }]);

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        this.__applyViewportPercentages(gl, 0, 0, 1.0, 1.0);

        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);

        gl.useProgram(pos2RGBInfo.program);
        gl.cullFace(gl.BACK);

        let uniformBundle = this.uniformManager.getUniformBundle(0);

        twgl.setBuffersAndAttributes(gl, pos2RGBInfo, bufferInfo);
        twgl.setUniforms(pos2RGBInfo, uniformBundle);

        twgl.bindFramebufferInfo(gl, fb);


        gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
       // twgl.drawBufferInfo(gl, pos2RGBInfo);

        /* tex = twgl.createTexture(gl, {
             min: gl.NEAREST,
             mag: gl.NEAREST,
             src: [
                  255, 255, 255, 255,
                  192, 192, 192, 255,
                  192, 192, 192, 255,
                  255, 255, 255, 255,
                ],
         });*/
        /*
        uniformBundle.u_TexCoordToRayOrigin = tex;

        gl.cullFace(gl.BACK);
        gl.useProgram(tex2FaceInfo.program);

        twgl.setBuffersAndAttributes(gl, tex2FaceInfo, bufferInfo);
        twgl.setUniforms(tex2FaceInfo, uniformBundle);

        twgl.bindFramebufferInfo(gl, null);


        uniformBundle = this.uniformManager.getUniformBundle(0);
        uniformBundle.u_TexCoordToRayOrigin = tex;


        gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);*/


        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let viewID in this.subviews) {
            let view = this.subviews[viewID];
            this._debugRotateCube(viewID);

            if (!view)
                continue;

            view.render();
        }

        // if (this._debugDoRefresh)
        window.requestAnimationFrame(this.refresh.bind(this));
    }



    __DEBUGRefreshView0() {
        console.log("__DEBUGRefreshView0()");
        this.subviews[0].refresh();
    }
}


module.exports = ViewManager;
