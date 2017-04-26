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


        this.modelSyncManager = new ModelSyncManager(this);
        this.shaderManager = new ShaderManager(this.masterContext);
        this.FBAndTextureManager = new FBAndTextureManager(this.masterContext, environmentRef);

        this.uniformManagerVolume = new UniformManager();
        this.uniformManagerSlicer = new UniformManager();
        this.uniformManagerUnitQuad = new UniformManager();

        this.bufferManager = new BufferManager(this.masterContext);
        this.bufferManager.createFullScreenQuad('FullScreenQuadBuffer');

        this.boundingBoxBuffer = null; // Dependent on dataset
        this.slicerBuffer = null; // TEMP

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
                this.uniformManagerVolume.updateAll();
                this.uniformManagerSlicer.updateAll();
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
            //this._init();
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

        this._genTextures();
        //this._genBoundingBoxBuffer();
        this._genFrameBuffersAndTextureTargets();
        this._bindUniformManager();
        this.bufferManager.createBoundingBoxBufferInfo('DebugCubeBuffer', 1.0, 0.5, 0.7);
        let bufferInfo = this.bufferManager.getBufferInfo('DebugCubeBuffer');

        this.addNewView(0);

        //this.slicerBuffer = twgl.createBufferInfoFromArrays(this.masterContext, slicerBufferAttribs);

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

    getPickingBufferInfo(name, id) {
        let getter = () => {
            return this.FBAndTextureManager.getFrameBuffer(name);
        };
        let refresh = () => {
            this._renderPickingBuffer(name, id);
        }

        return {
            get: getter,
            refresh: refresh
        };
    }

    _renderPickingBuffer(name, id) {
        this.subviews[id].renderSpecific(name);
    }

    _generateDebugConfigurationForSubview(subviewID) {
        let buffer = this.bufferManager.getBufferInfo('VolumeBB');

        let DebugConfig = {
            uniforms: this.uniformManagerVolume.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    //bufferInfo: this.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('BasicVolume'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: this.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
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
        this.uniformManagerVolume.addUnique('u_LightWorldPos', (subviewID) => {
            return uniforms.u_LightWorldPos
        });
        this.uniformManagerVolume.addUnique('u_LightColor', (subviewID) => {
            return uniforms.u_LightColor
        });
        this.uniformManagerVolume.addShared('u_Ambient', () => {
            return uniforms.u_Ambient
        });
        this.uniformManagerVolume.addShared('u_Specular', () => {
            return uniforms.u_Specular
        });
        this.uniformManagerVolume.addShared('u_Shininess', () => {
            return uniforms.u_Shininess
        });
        this.uniformManagerVolume.addShared('u_SpecularFactor', () => {
            return uniforms.u_SpecularFactor
        });
        this.uniformManagerVolume.addShared('u_BoundingBoxNormalized', () => {
            return new Float32Array([1.0, 0.5, 0.7]); // TODO return the actual bounding box
        });
        this.uniformManagerVolume.addShared('u_Diffuse', () => {
            return this.FBAndTextureManager.getTexture('DebugTex'); //uniforms.u_Diffuse
        });
        this.uniformManagerVolume.addUnique('u_ViewInverse', (subviewID) => {
            //return uniforms.u_viewInverse;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getLookAt();
        });
        this.uniformManagerVolume.addUnique('u_World', (subviewID) => {
            //return uniforms.u_world;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldMatrix();
        });
        this.uniformManagerVolume.addUnique('u_WorldInverseTranspose', (subviewID) => {
            //return uniforms.u_worldInverseTranspose;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldInverseTranspose();
        });
        this.uniformManagerVolume.addUnique('u_WorldViewProjection', (subviewID) => {
            //return uniforms.u_worldViewProjection;
            return this.modelSyncManager.getActiveModel('CAMERA', subviewID).getWorldViewProjectionMatrix();
        });
        this.uniformManagerVolume.addUnique('u_AspectRatio', (subviewID) => {
            return this.subviews[subviewID].getAspectRatio();
        });
    }


    _genFrameBuffersAndTextureTargets() {
        this.FBAndTextureManager.create2DTextureFB({
            name: 'FrontFace'
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'BackFace'
        });

        this.FBAndTextureManager.create2DPickingBufferFB('SlicerPicking');

        this.FBAndTextureManager.create2DTextureFB({
            name: 'UnitQuadTexture'
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

        this.FBAndTextureManager.createTransferFunction2DTexture('GLOBAL');
    }

    transferFunctionDidChange(tfKey) {
        this.FBAndTextureManager.createTransferFunction2DTexture(tfKey);
        this.uniformManagerVolume.updateAll();
    }

    _bindUniformManager() {
        //this._bindUniformManagerVolume();
        this._bindUniformManagerSlicer();

    }

    _bindUniformManagerUnitQuad() {
        this.uniformManagerUnitQuad.addShared('u_QuadTexture', () => {
            return this.FBAndTextureManager.getTexture('UnitQuadTexture');
        });
    }

    _bindUniformManagerSlicer() {
        this.uniformManagerSlicer.addShared('u_SamplingRate', () => {
            let d = this.env.getActiveDataset('GLOBAL');
            if (!d)
                return 0.1; // For debugging only

            let h = d.header;
            let m = Math.max(h.cols, h.rows, h.slices);

            return 1.0 / m;
        });
        this.uniformManagerSlicer.addShared('u_DirectionColors', () => {
            return new Float32Array([
                1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 0.0, 1.0
            ]);
        });

        // unique
        this.uniformManagerSlicer.addUnique('u_WorldViewProjection', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_WorldViewProjection;
        });
        this.uniformManagerSlicer.addUnique('u_QuadOffsets', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_QuadOffsets;
        });
        this.uniformManagerSlicer.addUnique('u_QuadOffsetIndices', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_QuadOffsetIndices;
        });

        this.uniformManagerSlicer.addUnique('u_HighlightID', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_HighlightID;
        });
        this.uniformManagerSlicer.addUnique('u_PickingRayOrigin', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_PickingRayOrigin;
        });
        this.uniformManagerSlicer.addUnique('u_RayDir', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_RayDir;
        });
    }


    _bindUniformManagerVolume() {
        // 1. Set up getters
        // shared
        this.uniformManagerVolume.addShared('u_BoundingBoxNormalized', () => {
            // return new Float32Array([1.0, 0.5, 0.7]); // TODO return the actual bounding box

            let nbb = this.env.getActiveDataset('GLOBAL').header.normalizedBB;
            return new Float32Array([nbb.width, nbb.height, nbb.depth]);
        });

        this.FBAndTextureManager.createDEBUG2DTexture('DebugTex');
        this.FBAndTextureManager.create2DTextureFB({
            width: this.masterCanvas.width,
            height: this.masterCanvas.height,
            name: 'DebugTex2'
        });
        this.uniformManagerVolume.addShared('u_TexCoordToRayOrigin', () => {
            return this.FBAndTextureManager.getTexture('FrontFace'); // FrontFace
        });
        this.uniformManagerVolume.addShared('u_TexCoordToRayEndPoint', () => {
            return this.FBAndTextureManager.getTexture('BackFace');
        });
        this.uniformManagerVolume.addShared('u_ModelXYZToIsoValue', () => {
            return this.FBAndTextureManager.getTexture('u_ModelXYZToIsoValue');
        });
        this.uniformManagerVolume.addShared('u_AlphaCorrectionExponent', () => {
            // New sampling rate / base sampling rate.
            // Let it be 1 for now since sampling rate is not dynamic.
            return 1;
        });
        this.uniformManagerVolume.addShared('u_SamplingRate', () => {
            let d = this.env.getActiveDataset('GLOBAL');
            if (!d)
                return 0.1; // For debugging only

            let h = d.header;
            let m = Math.max(h.cols, h.rows, h.slices);

            return 1.0 / m;
        });

        // unique
        this.uniformManagerVolume.addUnique('u_WorldViewProjection', (subviewID) => {
            let aspectRatio = this.subviews[subviewID].getAspectRatio();

            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getWorldViewProjectionMatrix(aspectRatio);
        });
        this.uniformManagerVolume.addUnique('u_AspectRatio', (subviewID) => {
            return this.subviews[subviewID].getAspectRatio();
        });
        this.uniformManagerVolume.addUnique('u_IsoValueToColorOpacity', (subviewID) => {
            // 1. Get the active model (in case linked)
            let activeModel = this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID);

            // 2. Get the texture associated to the active model
            return this.FBAndTextureManager.getTransferFunction2DTexture(activeModel);
        });
    }


    linkChanged(modelKey) {
        this.modelSyncManager.updateSyncForModelKey(modelKey);
    }

    _generateBasicSlicerConfigForSubview(subviewID) {
        let gl = this.masterContext;

        let model = this.modelSyncManager.getActiveModel('SLICER', subviewID);
        let uniforms = this.uniformManagerSlicer.getUniformBundle(subviewID);
        uniforms.u_QuadTexture = this.FBAndTextureManager.getTexture('UnitQuadTexture');

        let BasicSlicerConfig = {
            uniforms: this.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerBasic'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('UnitQuadTexture'), //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerBuffer'),
                    glSettings: {
                        disable: [gl.CULL_FACE],
                        enable: [gl.BLEND],
                        blendFunc: [gl.SRC_ALPHA, gl.ONE],
                        clear: [gl.COLOR_BUFFER_BIT,  gl.DEPTH_BUFFER_BIT]
                    }
                },
                /*{ // Render the picking buffer into a subview..
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('UnitQuadTexture'), //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerBuffer'),
                    subViewport: {
                        x0: 0.05,
                        y0: 0.7,
                        width: 0.3,
                        height: 0.3
                    },
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
//                        depthFunc: [gl.LESS],
                        cullFace: [gl.BACK],
                        disable: [gl.BLEND],
                        //clear: [gl.COLOR_BUFFER_BIT]

                    }
                },*/
                {
                    programInfo: this.shaderManager.getProgramInfo('Texture2Quad'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('FullScreenQuadBuffer'),
                    glSettings: {
                        clear: [gl.COLOR_BUFFER_BIT],
                        enable: [gl.CULL_FACE],
                        cullFace: [gl.BACK],
                        disable: [gl.BLEND]
                    }
                },

            ]
        };



        return BasicSlicerConfig;
    }

    _generateSlicerPickingBufferConfigForSubview(subviewID) {
        let gl = this.masterContext;
        let model = this.modelSyncManager.getActiveModel('SLICER', subviewID);

        let PickingConfig = {
            uniforms: this.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST, gl.CULL_FACE],
                        cullFace: [gl.BACK],
                        depthFunc: [gl.LESS],
                        disable: [gl.BLEND],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerRailBuffer'),
                    glSettings: { // Same as before...
                    }
                }
            ]
        };

        return PickingConfig;
    }

    _generateBasicVolumeConfigForSubview(subviewID) {
        let buffer = this.bufferManager.getBufferInfo('VolumeBB');
        let BasicVolumeConfig = {
            uniforms: this.uniformManagerVolume.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer, // The bounding box!
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer, // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('BasicVolume'),
                    frameBufferInfo: null, // Render to screen
                    bufferInfo: buffer, // The bounding box!
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
        this.modelSyncManager.addSubview(id, this);
        this.uniformManagerVolume.addSubview(id);
        this.uniformManagerSlicer.addSubview(id);
        //        let config = this._generateBasicVolumeConfigForSubview(id);

        if (!this.bufferManager.hasBuffer('SlicerBuffer')) {
            let slicerBufferAttribArrays = this.modelSyncManager.getActiveModel('SLICER', id).attribArrays;
            this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.Vertices, 'SlicerBuffer');
            this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.CubeFaceVertices, 'SlicerCubeFaceBuffer');
            this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.RailVertices, 'SlicerRailBuffer');
        }

        let volumeConfig = this._generateDebugConfigurationForSubview(id);
        this.subviews[id].configureRenderer('volume', volumeConfig);

        let slicerConfigs = this._generateBasicSlicerConfigForSubview(id);

        let slicerConfig = this._generateBasicSlicerConfigForSubview(id),
            slicerPickerConfig = this._generateSlicerPickingBufferConfigForSubview(id);

        this.subviews[id].configureRenderer('slicer', slicerConfig);
        this.subviews[id].configureRenderer('SlicerPicking', slicerPickerConfig);

        this.syncWithLayout();
    }

    removeView(id) {
        delete this.subviews[id];
        this.modelSyncManager.removeSubview(id);
        this.uniformManagerVolume.removeSubview(id);

        this.syncWithLayout();
    }

    transferFunctionDidChangeForSubviewID(tfEditorKey) {
        console.log("Updating TF tex... src: " + tfEditorKey);
        this.FBAndTextureManager.createTransferFunction2DTexture(tfEditorKey);
        this.uniformManagerVolume.updateAll();
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
        this.bufferManager.createBufferInfoFromArrays(vertices, 'VolumeBB');

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


        this.uniformManagerVolume.updateAll();
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

        twgl.resizeCanvasToDisplaySize(gl.canvas);

        //gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let subviewID in this.subviews) {

            //this._updateTextures(subviewID);
            let view = this.subviews[subviewID];
            //this._debugRotateCube(subviewID);

            if (!view)
                continue;

            view.render();
        }

        // if (this._debugDoRefresh)
        window.requestAnimationFrame(this.refresh.bind(this));
    }

    _updateTextures(subviewID) {
        let TFModelID = this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID);

        let check = Environment.TransferFunctionManager.checkNeedsUpdate(TFModelID);
        if (check) {

            this.FBAndTextureManager.createTransferFunction2DTexture('GLOBAL');
        }
    }

    __DEBUGRefreshView0() {
        console.log("__DEBUGRefreshView0()");
        this.subviews[0].refresh();
    }
}


module.exports = ViewManager;
