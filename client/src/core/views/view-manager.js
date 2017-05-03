let d3 = require('d3');

let Subview = require('./subview');
let MiniatureSplitViewOverlay = require('../../widgets/split-view/miniature-split-view-overlay');
let SubcellLayout = require('../../widgets/split-view/subcell-layout');

let Models = require('../linkable-models').Models;

let ConfigurationManager = require('../resource-managers/configuration-manager');
let ShaderManager = require('../resource-managers/shader-manager');
let FBAndTextureManager = require('../resource-managers/frame-buffer-and-texture-manager');
let ModelSyncManager = require('../resource-managers/model-sync-manager');
let UniformManager = require('../resource-managers/uniform-manager');
let BufferManager = require('../resource-managers/buffer-manager');
let PickingBufferManager = require('../resource-managers/picking-buffer-manager');
let VolumeEventHandlerDelegate = require('./volume-event-handler-delegate');

let GetSlicerBufferAttribArrays = require('../models/slicer-model-buffers');



let Settings = require('../settings').Views.ViewManager,
    OverlaySettings = Settings.WindowsOverlay;

let twgl = require('twgl.js');
let createCuboidVertices = require('../../geometry/box');

let glsl = require('glslify');
let InteractionModeManager = require('../interaction-modes-v2');

let OverlayCellEventToModel = {
    'Sphere': 'Sphere',
    'Volume': 'CAMERA',
    'Slicer': 'Slicer'
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

        this.masterContext.clearColor(0.2, 0.2, 0.2, 1.0);

        this.masterContext.getExtension('EXT_color_buffer_float');
        this.masterContext.getExtension('OES_texture_float')
        twgl.setDefaults({
            attribPrefix: "a_"
        });

        twgl.resizeCanvasToDisplaySize(this.masterContext.canvas);

        this.subviews = {};
        this.localControllerSelectedSubviewID = 0;

        this.configurationManager = new ConfigurationManager(this);
        this.modelSyncManager = new ModelSyncManager(this);
        this.shaderManager = new ShaderManager(this.masterContext);
        this.FBAndTextureManager = new FBAndTextureManager(this.masterContext, environmentRef);

        this.uniformManagerVolume = new UniformManager();
        this.uniformManagerSlicer = new UniformManager();
        this.uniformManagerUnitQuad = new UniformManager();

        this.bufferManager = new BufferManager(this.masterContext);
        this.pickingBufferManager = new PickingBufferManager(this);
        /*
                this.boundingBoxBuffer = null; // Dependent on dataset
                this.slicerBuffer = null; // TEMP
        */

        //twgl.bindFramebufferInfo(this.masterContext);

        this.volumeEventHandler = new VolumeEventHandlerDelegate(this, {
            clickTimeout: 150
        });

        let eventListenerOverlayCallback = (cellID, subcellName, event) => {
            //            console.log("cellID: " + cellID + ", subcell: " + subcellName + ", loc: (" + event.pos.x + ", " + event.pos.y + "), button = " +
            //                event.button);
            //console.log("cellID: " + cellID + ", subcell: " + subcellName + ", loc: (" + event.pos.x + ", " + event.pos.y + "), button = " + event.button);

            switch (subcellName) {
                case 'Volume':
                    this.volumeEventHandler.handle(event, cellID);
                    //this.uniformManagerVolume.updateAll();
                    //this.uniformManagerSlicer.updateAll();
                    break;
                case 'Slicer': // Delegate directly to the slicer
                    // model since it is self contained
                    this.modelSyncManager.getActiveModel(Models.SLICER.name, cellID).mouse(event);
                    this.uniformManagerSlicer.updateAll();
                    //                    this.requestAnimationFrame();
                    break;
                case 'Sphere':
                    break;
            }

            if (subcellName === 'Sphere')
                return; // Ignore sphere for now.

            /*if (this.subviews[cellID]) {
                let modelName = OverlayCellEventToModel[subcellName];
                let model = this.modelSyncManager.getActiveModel(modelName, cellID);
                this.modelSyncManager.getActiveModel(modelName, cellID).mouse(event);
                this.uniformManagerVolume.updateAll();
                this.uniformManagerSlicer.updateAll();
            } //else*/

            /*if (this.subviews[cellID])
                this.subviews[cellID].notifyEventDidHappen(subcellName, event)
            else*/
            //console.log("Subview not initialized yet (active dataset required)");
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
        this._genFrameBuffersAndTextureTargets();
        this._genBuffers();
        this._genPickingBuffers();
        this._bindUniformManagers();

        this.addNewView(0);

        //this.slicerBuffer = twgl.createBufferInfoFromArrays(this.masterContext, slicerBufferAttribs);

        //this.refresh();
        this.requestAnimationFrame();
    }


    notifySlicesDidChange(id) {
        this.uniformManagerSlicer.updateAll();
        this.uniformManagerVolume.updateAll();
        this.notifyNeedsUpdateForModel(Models.SLICER.name, id, ['Volume', 'Slicer']);
        //this._setNeedsUpdateForAllSubviews(['Volume', 'Slicer']);
        this.requestAnimationFrame();
    }

    notifySlicerNeedsUpdate(id) {
        this.uniformManagerSlicer.updateAll();
        this.notifyNeedsUpdateForModel(Models.SLICER.name, id, ['Slicer']);
        this.requestAnimationFrame();
    }

    notifyIsoThresholdDidChange(editorName, newMin, newMax) {
        let subviewID = editorName === 'GLOBAL' ? 'GLOBAL' : this.localControllerSelectedSubviewID;

        let thresholds = this.modelSyncManager.getModel(Models.THRESHOLDS.name, subviewID);
        // TODO change to active when local controls are implemented!

        thresholds.setMinMax(newMin, newMax);
        this.notifyNeedsUpdateForModel(Models.THRESHOLDS.name, 0, ['Volume']);
        this.requestAnimationFrame();
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

    _genFrameBuffersAndTextureTargets() {
        this.FBAndTextureManager.create2DTextureFB({
            name: 'FrontFace'
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'BackFace'
        });

        /*this.FBAndTextureManager.create2DTextureFB({
            name: 'UnitQuadTexture'
        });*/
    }

    _genPickingBuffers() {
        let gl = this.masterContext;

        let SlicerPBWidth = 512,
            SlicerPBHeight = 512;

        let SlicerPBFormat = gl.RGBA;

        let RailsPB = this.FBAndTextureManager.create2DPickingBufferFB({
            name: 'SlicerPickingRails',
            width: SlicerPBWidth,
            height: SlicerPBHeight
        });

        let CubeFacePB = this.FBAndTextureManager.create2DPickingBufferFB({
            name: 'SlicerPickingCubeFaces',
            width: SlicerPBWidth,
            height: SlicerPBHeight
        });

        let SlicesPB = this.FBAndTextureManager.create2DPickingBufferFB({
            name: 'SlicerPickingSlices',
            width: SlicerPBWidth,
            height: SlicerPBHeight
        });

        this.pickingBufferManager.addPickingBuffer({
            name: 'SlicerRails',
            width: SlicerPBWidth,
            height: SlicerPBHeight,
            format: SlicerPBFormat,
            fbInfo: RailsPB
        });

        this.pickingBufferManager.addPickingBuffer({
            name: 'SlicerCubeFace',
            width: SlicerPBWidth,
            height: SlicerPBHeight,
            format: SlicerPBFormat,
            fbInfo: CubeFacePB
        });

        this.pickingBufferManager.addPickingBuffer({
            name: 'SlicerSlices',
            width: SlicerPBWidth,
            height: SlicerPBHeight,
            format: SlicerPBFormat,
            fbInfo: SlicesPB
        });
    }

    _genVolumeBoundingBoxBuffer() {

        this.boundingBoxBuffer = twgl.createBufferInfoFromArrays(this.masterContext, {
            position: vertices.position,
            indices: vertices.indices,
            normal: vertices.normal,
            texcoord: vertices.texcoord
        });
    }

    _genBuffers() {
        let dataset = this.env.getActiveDataset('GLOBAL');
        let bb = dataset.header.normalizedBB;
        let vertices = createCuboidVertices(bb.width, bb.height, bb.depth);
        this.bufferManager.createBufferInfoFromArrays(vertices, 'VolumeBB');

        this.bufferManager.createFullScreenQuad('FullScreenQuadBuffer');

        let bufferInfo = this.bufferManager.getBufferInfo('DebugCubeBuffer');
        this.bufferManager.createBoundingBoxBufferInfo('DebugCubeBuffer', 1.0, 0.5, 0.7);

        let slicerBufferAttribArrays = GetSlicerBufferAttribArrays();
        this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.Vertices, 'SlicerBuffer');
        this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.CubeFaceVertices, 'SlicerCubeFaceBuffer');
        this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.RailVertices, 'SlicerRailBuffer');
        this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.SliceVertices, 'SlicerSliceBuffer');

        this.bufferManager.createBufferInfoFromArrays(slicerBufferAttribArrays.RailPickingBufferVertices, 'SlicerRailPBBuffer');
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

    setModelPointsToGlobal(modelName, pointToGlobal) {
        this.modelSyncManager.setModelPointsToGlobal(modelName, pointToGlobal);

        if (modelName === Models.SLICER.name || modelName === Models.CAMERA.name)
            this._syncSlicerAndVolumeCameras();
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


    renderSlickingRailBuffer(id) {
        if (id === 'GLOBAL')
            id = Object.keys(this.subviews)[0];

        this.uniformManagerSlicer.updateAll();
        this.subviews[id].renderSpecific('SlicerPickingRails');
    }

    renderSlicerPickingBuffers(id) {
        if (id === 'GLOBAL')
            id = Object.keys(this.subviews)[0];

        this.uniformManagerSlicer.updateAll();

        this.subviews[id].renderSpecific('SlicerPickingCubeFaces');
        this.subviews[id].renderSpecific('SlicerPickingSlices');
        this.subviews[id].renderSpecific('SlicerPickingRails');
    }
    renderSlicerPickingBuffersV2(id, bufferNames) {
        if (id === 'GLOBAL')
            id = Object.keys(this.subviews)[0];

        this.uniformManagerSlicer.updateAll();

        for (let bufferName in bufferNames)
            this.subviews[id].renderSpecific(bufferName);
    }

    _renderPickingBuffer(name, id) {
        // Special case, just pick an arbitrary subview
        // I.e use any subview to render the picking buffer using the
        // GLOBAL uniforms. When GLOBAL mode is enabled then all subviews
        // will have those same uniforms anyway!
        if (id === 'GLOBAL') {
            id = Object.keys(this.subviews)[0];
        }
        this.uniformManagerSlicer.updateAll();
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
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getLookAt();
        });
        this.uniformManagerVolume.addUnique('u_World', (subviewID) => {
            //return uniforms.u_world;
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getWorldMatrix();
        });
        this.uniformManagerVolume.addUnique('u_WorldInverseTranspose', (subviewID) => {
            //return uniforms.u_worldInverseTranspose;
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getWorldInverseTranspose();
        });
        this.uniformManagerVolume.addUnique('u_WorldViewProjection', (subviewID) => {
            //return uniforms.u_worldViewProjection;
            return this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getWorldViewProjectionMatrix();
        });
        this.uniformManagerVolume.addUnique('u_AspectRatio', (subviewID) => {
            return this.subviews[subviewID].getAspectRatio();
        });
    }

    viewTypeChanged(subviewID, newType) {
        // Now configure the renderer of the subview to use the
        // shader corresponding to the view type!

    }

    datasetDidChange() {
        this._init();
        Environment.notifyDatasetWasRead();
    }

    transferFunctionDidChange(tfKey) {
        this.FBAndTextureManager.createTransferFunction2DTexture(tfKey);
        this.uniformManagerVolume.updateAll();
    }

    _bindUniformManagers() {
        this._bindUniformManagerVolume();
        this._bindUniformManagerSlicer();
    }

    _bindUniformManagerUnitQuad() {
        /*this.uniformManagerUnitQuad.addShared('u_QuadTexture', () => {
            return this.FBAndTextureManager.getTexture('UnitQuadTexture');
        });*/
        this.uniformManagerUnitQuad.addUnique('u_QuadTexture', (subviewID) => {
            return this.FBAndTextureManager.getTexture('UnitQuadTexture' + subviewID)
        })
    }

    _bindUniformManagerSlicer() {
        // unique
        this.uniformManagerSlicer.addUnique('u_WorldViewProjection', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_WorldViewProjection;
        });
        this.uniformManagerSlicer.addUnique('u_SliceOffsets', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_SliceOffsets;
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
        this.uniformManagerSlicer.addUnique('u_Size', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_Size;
        });
        this.uniformManagerSlicer.addUnique('u_IntersectionPointDebug', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_IntersectionPointDebug;
        });
        this.uniformManagerSlicer.addUnique('u_DraggedSliceIndices', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_DraggedSliceIndices;
        });
        this.uniformManagerSlicer.addUnique('u_ActiveDragRailID', (subviewID) => {
            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            return slicerModel.uniforms.u_ActiveDragRailID;
        });
        this.uniformManagerSlicer.addUnique('u_SlicerImageTexture', (subviewID) => {
            return this.FBAndTextureManager.getTexture('SlicerImageTexture' + subviewID);
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
        this.uniformManagerVolume.addUnique('u_IsoMinMax', (subviewID) => {
//            return this.modelSyncManager.getActiveModel(Models.THRESHOLDS.name, 'GLOBAL').getMinMaxInt16(); // TEMP, change to local
            return this.modelSyncManager.getModel(Models.THRESHOLDS.name, 'GLOBAL').getMinMaxInt16();
        });

        this.uniformManagerVolume.addUnique('u_SliceX', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID).getSliceOffsets('X');
        });
        this.uniformManagerVolume.addUnique('u_SliceY', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID).getSliceOffsets('Y');
        });
        this.uniformManagerVolume.addUnique('u_SliceZ', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID).getSliceOffsets('Z');
        });
        this.uniformManagerVolume.addUnique('u_VolumeImageTexture', (subviewID) => {
            return this.FBAndTextureManager.getTexture('VolumeImageTexture' + subviewID);
        });
    }


    linkChanged(modelKey) {
        this.modelSyncManager.updateSyncForModelKey(modelKey);

        if (modelKey === Models.CAMERA.name) { // Repoint slicer cameras!
            this._syncSlicerAndVolumeCameras()
        }
    }

    _syncSlicerAndVolumeCameras() {
        this.modelSyncManager.call(Models.CAMERA.name, 'killSlaves');

        for (let subviewID in this.subviews) {
            let volumeCamera = this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID);

            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            slicerModel.linkCameraPhiAndThetaTo(volumeCamera);
        }
    }

    _generateBasicSlicerConfigForSubview(subviewID) {
        let gl = this.masterContext;

        let model = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);
        let uniforms = this.uniformManagerSlicer.getUniformBundle(subviewID);
        uniforms.u_QuadTexture = this.FBAndTextureManager.getTexture('UnitQuadTexture');

        let BasicSlicerConfig = {
            uniforms: this.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerBasic'),
                    frameBufferInfo: null,
                    //frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('UnitQuadTexture'),
                    //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerBuffer'),
                    //                    bufferInfo: this.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    //                    bufferInfo: this.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.CULL_FACE],
                        enable: [gl.BLEND],
                        blendFunc: [gl.SRC_ALPHA, gl.ONE],
                        //clear: [gl.COLOR_BUFFER_BIT,  gl.DEPTH_BUFFER_BIT] // this caused only one slicer to render... wtf
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
               /* {
                    programInfo: this.shaderManager.getProgramInfo('Texture2Quad'),
                    frameBufferInfo: null, //this.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: this.bufferManager.getBufferInfo('FullScreenQuadBuffer'),
                    glSettings: {
                        clear: [gl.COLOR_BUFFER_BIT],
                        enable: [gl.CULL_FACE],
                        cullFace: [gl.BACK],
                        disable: [gl.BLEND]
                    }
                },*/

            ]
        };



        return BasicSlicerConfig;
    }

    _generateSlicerPickingBufferConfigForSubview(subviewID) {
        let gl = this.masterContext;
        let model = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

        let PickingConfig = {
            uniforms: this.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
                        cullFace: [gl.BACK],
                        depthFunc: [gl.LESS],
                        disable: [gl.BLEND, gl.CULL_FACE],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                },
                {
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    //                    bufferInfo: this.bufferManager.getBufferInfo('SlicerRailBuffer'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerRailPBBuffer'),
                    //bufferInfo: this.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    glSettings: { // Same as before...
                        enable: [gl.DEPTH_TEST, gl.CULL_FACE],
                        clear: [gl.DEPTH_BUFFER_BIT],
                        cullFace: [gl.BACK],
                        depthFunc: [gl.LESS],
                        disable: [gl.BLEND],
                    }
                },
                /*{
                    programInfo: this.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: this.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: this.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    //bufferInfo: this.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
//                    bufferInfo: this.bufferManager.getBufferInfo('SlicerBuffer'),
                    glSettings: { // Same as before...
                        enable: [gl.DEPTH_TEST],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                        disable: [gl.CULL_FACE,gl.BLEND],
                        //enable: [gl.BLEND],
                        //blendFunc: [gl.SRC_ALPHA, gl.ONE],
                    }
                }*/
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


    addNewView(id, initialConfigurations) {
        // One texture to hold the output of each of these
        this.FBAndTextureManager.create2DTextureFB({
            name: 'VolumeImageTexture' + id
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'SlicerImageTexture' + id
        });


        this.subviews[id] = new Subview(this.masterContext);
        this.modelSyncManager.addSubview(id, this);
        this.uniformManagerVolume.addSubview(id);
        this.uniformManagerSlicer.addSubview(id);


        this.configurationManager.configureSubview(id, initialConfigurations || {
            Volume: 'Basic',
            Slicer: 'Basic',
            SlicerPicking: 'Basic',
            SlicerPickingSlices: 'Default',
            SlicerPickingRails: 'Default',
            SlicerPickingCubeFaces: 'Default'
        });

        /* let config = this._generateBasicVolumeConfigForSubview(id);
        let slicerConfig = this._generateBasicSlicerConfigForSubview(id),
            slicerPickerConfig = this._generateSlicerPickingBufferConfigForSubview(id);
        let volumeConfig = this._generateDebugConfigurationForSubview(id);
        this.subviews[id].configureRenderer('Volume', slicerConfig);
*/
        /*
                let slicerConfigs = this._generateBasicSlicerConfigForSubview(id);


                this.subviews[id].configureRenderer('Slicer', slicerConfig);
                this.subviews[id].configureRenderer('SlicerPicking', slicerPickerConfig);*/

        this.syncWithLayout();
        this._syncSlicerAndVolumeCameras();

    }

    removeView(id) {
        delete this.subviews[id];
        this.modelSyncManager.removeSubview(id);
        this.uniformManagerVolume.removeSubview(id);

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


    _debugRotateCube(subviewID) {
        let cam = this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID);

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

        this.uniformManagerSlicer.updateAll();
        this.uniformManagerVolume.updateAll();

        //twgl.resizeCanvasToDisplaySize(gl.canvas);

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
        //window.requestAnimationFrame(this.refresh.bind(this));
    }



    transferFunctionDidChangeForSubviewID(tfEditorKey) {
        if (Object.keys(this.subviews).length === 0)
            return;

        console.log("Updating TF tex... src: " + tfEditorKey);
        this.FBAndTextureManager.createTransferFunction2DTexture(tfEditorKey);
        this.uniformManagerVolume.updateAll();

        let needsUpdateSubviewIDs = [];
        if (tfEditorKey === 'GLOBAL') {
            needsUpdateSubviewIDs = this.modelSyncManager.getSubviewIDsLinkedWithMaster('GLOBAL', Models.TRANSFER_FUNCTION.name);
        } else {
            needsUpdateSubviewIDs = this.modelSyncManager.getSubviewIDsLinkedWith(this.localControllerSelectedSubviewID, Models.TRANSFER_FUNCTION.name);
        }

        this._notifySubviewsNeedUpdate('Volume', needsUpdateSubviewIDs, true);
        //        for (let subviewID of needsUpdateSubviewIDs) {
        //            this.subviews[subviewID].notifyNeedsUpdate('Volume', true);
        //        }

        if (needsUpdateSubviewIDs.length > 0)
            this.requestAnimationFrame(['Volume']);
    }

    _notifySubviewNeedsFullUpdate(subviewID, renderers) {
        for (let renderer of renderers) {
            this.subviews[subviewID].notifyNeedsUpdate(renderer, true);
        }
    }

    _notifySubviewsNeedUpdate(rendererName, subviewIDs, fullUpdate) {
        for (let subviewID of subviewIDs) {
            this.subviews[subviewID].notifyNeedsUpdate(rendererName, fullUpdate);
        }

        for (let subviewID in this.subviews) {
            this.subviews[subviewID].notifyNeedsUpdate(rendererName);
        }
    }

    notifyNeedsUpdateForModel(model, sourceSubview, toUpdate) {
        if (Object.keys(this.subviews).length === 0)
            return;

        // 1. Get subview IDs linked with

        let needsUpdateSubviewIDs = this.modelSyncManager.getSubviewIDsLinkedWith(sourceSubview, model);

        for (let rendererKey of toUpdate)
            this._notifySubviewsNeedUpdate(rendererKey, needsUpdateSubviewIDs, true);

        /*        for (let subviewID of needsUpdateSubviewIDs) {
                    for (let rendererKey of toUpdate)
                        this.subviews[subviewID].notifyNeedsUpdate(rendererKey, true);
                }*/

        //if (needsUpdateSubviewIDs.length > 0)
        //    this.requestAnimationFrame();
    }

    _notifyNeedsUpdate(name, subviewID) {
        for (let theSubviewID in this.subviews) {
            this.subviews[theSubviewID].notifyNeedsUpdate(name);
        }
    }

    requestAnimationFrame(renderers, subviewID) {
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
