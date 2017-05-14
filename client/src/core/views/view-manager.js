let d3 = require('d3');

let Subview = require('./subview');
let MiniatureSplitViewOverlay = require('../../widgets/split-view/miniature-split-view-overlay');
let SubcellLayout = require('../../widgets/split-view/subcell-layout');

let Models = require('../all-models').Models;

let ConfigurationManager = require('../resource-managers/configuration-manager');
let ShaderManager = require('../resource-managers/shader-manager');
let FBAndTextureManager = require('../resource-managers/frame-buffer-and-texture-manager');
let ModelSyncManager = require('../resource-managers/model-sync-manager');
let UniformManager = require('../resource-managers/uniform-manager');
let BufferManager = require('../resource-managers/buffer-manager');
let PickingBufferManager = require('../resource-managers/picking-buffer-manager');
let SelectionManager = require('../resource-managers/selection-manager');
let VolumeEventHandlerDelegate = require('./volume-event-handler-delegate');

let GetSlicerBufferAttribArrays = require('../models/slicer-model-buffers');

let Settings = require('../settings').Views.ViewManager,
    OverlaySettings = Settings.WindowsOverlay;

let twgl = require('twgl.js');
let createCuboidVertices = require('../../geometry/box');
let v3 = twgl.v3;

let glsl = require('glslify');
let InteractionModeManager = require('../interaction-modes-v2');

let OverlayCellEventToModel = {
    'Sphere': 'Sphere',
    'Volume': 'CAMERA',
    'Slicer': 'Slicer'
};

let DatasetGet = require('../settings').WSClient.get;

let PRESETS = require('../settings-presets');
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

        this.masterContext.clearColor(0.0, 0.0, 0.0, 0.0);

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

        this.selectionManager = new SelectionManager(this);

        this.uniformManagerVolume = new UniformManager();
        this.uniformManagerSlicer = new UniformManager();
        this.uniformManagerUnitQuad = new UniformManager();

        this.bufferManager = new BufferManager(this.masterContext);
        this.pickingBufferManager = new PickingBufferManager(this);
        /*
                this.boundingBoxBuffer = null; // Dependent on dataset
                this.slicerBuffer = null; // TEMP
        */

        this.selectedPoint = null;
        this.selectedRay = null;

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

        this.mm2Float = (mm) => {
            return mm / 1000.0;
        }
    }

    getTransferFunctionSubviewIDForTFEditorKey(tfEditorKey) {
        let subviewID = tfEditorKey === 'GLOBAL' ? 'GLOBAL' : this.modelSyncManager.getActiveModelSubviewID(Models.TRANSFER_FUNCTION.name, this.localControllerSelectedSubviewID);

        return subviewID;
    }

    getTransferFunctionForTFEditor(tfEditorKey) {
        let subviewID = this.getTransferFunctionSubviewIDForTFEditorKey(tfEditorKey);
        return this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID);
    }

    getModelObjectForEditor(model, editorKey) {
        let subviewID = this._getSubviewIDForModelAndEditor(model, editorKey);
        return this.modelSyncManager.getActiveModel(model.name, subviewID);
    }

    _getSubviewIDForModelAndEditor(model, editorKey) {
        return editorKey === 'GLOBAL' ? 'GLOBAL' : this.modelSyncManager.getActiveModelSubviewID(model.name, this.localControllerSelectedSubviewID);
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

        // gen millimeter to float scale too

        let dataset = this.env.getActiveDataset('GLOBAL');
        if (dataset) {
            let h = dataset.header;

            // Normalized bb:
            // w, h, d
            //

            this.mm2Float = (mm) => {
                return mm * (h.normalizedBB.depth / (h.slices * h.spacing.z));
            }
        }

        this.addNewView(0);

        //this.slicerBuffer = twgl.createBufferInfoFromArrays(this.masterContext, slicerBufferAttribs);

        //this.refresh();
        this.env.notifyViewmanagerInitialized();
        this.requestAnimationFrame();
    }

    _printSettingsForSubviewWithID(id) {
        let activeModels = this.modelSyncManager.getActiveModels(id);
        console.log("ACTIVE MODELS ... " + activeModels);
    }

    notifySlicesDidChange(id) {
        this.uniformManagerSlicer.updateAll();
        this.uniformManagerVolume.updateAll();
        this.notifyNeedsUpdateForModel(Models.SLICER.name, id, ['Volume', 'Slicer']);
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
        this.notifyNeedsUpdateForModel(Models.THRESHOLDS.name, subviewID, ['Volume']);
        this.requestAnimationFrame();
    }

    _genTextures() {
        let dataset = this.env.getActiveDataset('GLOBAL');
        if (!dataset)
            return;

        let h = dataset.header;

        if (DatasetGet === 'isovalues') {
            this.FBAndTextureManager.createGridPos2Isovalue3DTexture({
                name: 'u_ModelXYZToIsoValue', // Will be used for looking it up again
                cols: h.cols,
                rows: h.rows,
                slices: h.slices,
                isovalues: dataset.isovalues
            });
        } else {
            this.FBAndTextureManager.createGridPos2IsovalueGMag3DTexture({
                name: 'u_ModelXYZToIsoValue', // Will be used for looking it up again
                cols: h.cols,
                rows: h.rows,
                slices: h.slices,
                isovalues: dataset.isovalues
            });
        }

        //this.FBAndTextureManager.createGridPos2Isovalue3DTexture({
        /* this.FBAndTextureManager.createGridPos2IsovalueGMag3DTexture({
             name: 'u_ModelXYZToIsoValue', // Will be used for looking it up again
             cols: h.cols,
             rows: h.rows,
             slices: h.slices,
             isovalues: dataset.isovalues
         });*/

        this.FBAndTextureManager.createTransferFunction2DTexture('GLOBAL');
    }

    _genFrameBuffersAndTextureTargets() {
        this.FBAndTextureManager.create2DTextureFB({
            name: 'FrontFace'
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'BackFace'
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'RayProjectionTexture',
            width: 512,
            height: 512
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'RayRenderTexture',
            width: 512,
            height: 512
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'PointProjectionTexture',
            width: 512,
            height: 512
        });

        this.FBAndTextureManager.create2DTextureFB({
            name: 'PointRenderTexture',
            width: 512,
            height: 512
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

        let VolumePBWidth = 512,
            VolumePBHeight = 512,
            VolumePBFormat = gl.RGBA;

        // Volume PB layout: .. WHY NOT USE FRONT FACE
        // R -> X [0,1]
        // G -> Y [0,1]
        // B -> Z [0,1]
        // A -> ???? maybe ISO ... [0,1]

        let VolumePB = this.FBAndTextureManager.create2DPickingBufferFB({
            name: 'VolumePicking',
            width: VolumePBWidth,
            height: VolumePBHeight
        });

        let VolumeBackfacePB = this.FBAndTextureManager.create2DPickingBufferFB({
            name: 'VolumeBackfacePicking',
            width: VolumePBWidth,
            height: VolumePBHeight
        });

        this.pickingBufferManager.addPickingBuffer({
            name: 'Volume',
            width: VolumePBWidth,
            height: VolumePBHeight,
            fbInfo: VolumePB
        });

        this.pickingBufferManager.addPickingBuffer({
            name: 'VolumeBackface',
            width: VolumePBWidth,
            height: VolumePBHeight,
            fbInfo: VolumeBackfacePB
        })
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
        if (dataset) {
            let bb = dataset.header.normalizedBB;
            let vertices = createCuboidVertices(bb.width, bb.height, bb.depth);
            this.bufferManager.createBufferInfoFromArrays(vertices, 'VolumeBB');
        }

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

        this.notifySubviewsNeedFullUpdate();
        this.requestAnimationFrame();
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

    renderVolumePickingBuffer(id) {
        if (id === 'GLOBAL')
            id = Object.keys(this.subviews)[0];

        this.uniformManagerVolume.updateAll();

        this.subviews[id].renderSpecific('Volume3DPicking');
    }

    renderSlicerPickingBuffersV2(id, bufferNames) {
        if (id === 'GLOBAL')
            id = Object.keys(this.subviews)[0];

        this.uniformManagerSlicer.updateAll();

        for (let bufferName in bufferNames)
            this.subviews[id].renderSpecific(bufferName);
    }

    renderSelectedPoints() {
        // 1. Get all subviews displaying points
        // 2. call
        let toRender = this._getAllSubviewsShowingPoints();

        for (let subviewID of toRender) {
            this.subviews[subviewID].renderSpecific('VolumePointRenderer', true);
        }
        //this._notifySubviewsNeedUpdate('VolumePointRenderer', toRender, true);
        //this.requestAnimationFrame();
    }

    renderVolumeRay(subviewID) {
        //this.uniformManagerVolume.updateAll();
        //for (let subviewID in this.subviews) {
        //    this.viewManager.notifyNeedsUpdateForModel(Models.CAMERA.name, this.localControllerSelectedSubviewID, ['Volume']);
        //    //this._renderVolumeRayForSubview(subviewID);
        //}
        this.notifyShowRayDidChange(true, subviewID);
        //this.requestAnimationFrame();
    }

    _renderVolumeRayForSubview(subviewID) {
        this.subviews[subviewID].renderSpecific('VolumeRayRender', true);
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

    notifyCameraSettingsDidChangeAtEditor(key, args) {
        console.log("notifyCameraSettingsDidChangeAtEditor");
        console.log(key);
        console.log(args);
        // 1. Get active model
        // 2. Apply the changes

        let activeModel = this.modelSyncManager.getActiveModel(Models.CAMERA.name, this.localControllerSelectedSubviewID);
        activeModel.changeState(args);

        this.notifyNeedsUpdateForModel(Models.CAMERA.name, this.localControllerSelectedSubviewID, ['Volume', 'Slicer']);
        this.requestAnimationFrame();
    }

    notifyDatasetDidChange() {
        this._init();
        this.env.notifyDatasetWasRead();
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
            let activeModelID = this.modelSyncManager.getActiveModelSubviewID(Models.TRANSFER_FUNCTION.name, subviewID);


            // 2. Get the texture associated to the active model
            return this.FBAndTextureManager.getTransferFunction2DTexture(activeModelID);
        });
        this.uniformManagerVolume.addUnique('u_IsoMinMax', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.THRESHOLDS.name, subviewID).getMinMaxInt16(); // TEMP, change to local
            //return this.modelSyncManager.getModel(Models.THRESHOLDS.name, 'GLOBAL').getMinMaxInt16();
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
        this.uniformManagerVolume.addUnique('u_DirectionalLight', (subviewID) => {
            return {
                kA: 0.1,
                kD: 0.2,
                kS: 0.8,
                specExp: 17.0,
                I: 0.1,
                dir: [1.0, 1.0, 1.0]
            };
        });
        this.uniformManagerVolume.addUnique('u_kA', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).ambient;
        });
        this.uniformManagerVolume.addUnique('u_kD', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).diffuse;
        });
        this.uniformManagerVolume.addUnique('u_kS', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).specular;
        });
        this.uniformManagerVolume.addUnique('u_n', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).specularExponent;
        });
        this.uniformManagerVolume.addUnique('u_Il', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).intensity;
        });
        this.uniformManagerVolume.addUnique('u_lightDir', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).direction;
        });
        this.uniformManagerVolume.addUnique('u_isovalueLightingRange', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).getGradientMagnitudeLightingRange();

        });
        this.uniformManagerVolume.addUnique('u_belowGMagLightThresholdOpacityMultiplier', (subviewID) => {
            return this.modelSyncManager.getActiveModel(Models.LIGHTS.name, subviewID).gradientMagBelowThresholdOpacityMultiplier;
        });
        this.uniformManagerVolume.addUnique('u_viewDir', (subviewID) => {
            let camera = this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID);
            return camera.eye;
        });




        this.uniformManagerVolume.addShared('u_RayOrigin_M', () => {
            return this.selectionManager.getRaySelection().start;
        });
        this.uniformManagerVolume.addShared('u_RayDirection_M', () => {
            return this.selectionManager.getRaySelection().direction;
        });
        this.uniformManagerVolume.addShared('u_RayRadius_M', () => {
            return this.selectionManager.getRaySelection().radius;
        });
        this.uniformManagerVolume.addShared('u_NonSelectedVisibilityMultiplier', () => {
            return this.selectionManager.getNonSelectedOpacity();
        });
        this.uniformManagerVolume.addUnique('u_Eye_M', (subviewID) => {
            let eye = this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID).getEyePosition();

            // Transform to model space
            let nbb = this.uniformManagerVolume._getSharedUniform('u_BoundingBoxNormalized');

            let eyeModelSpace = v3.add(v3.divide(eye, nbb), v3.create(0.5, 0.5, 0.5));
            //            return eyeModelSpace;
            return eyeModelSpace;
        });
        this.uniformManagerVolume.addUnique('u_DoRenderRay', (subviewID) => {
            //return this.selectionManager.isRaySelected();
            return this.modelSyncManager.getActiveModel(Models.SELECTION_DISPLAY.name, subviewID).displayRay;
        });

        this.uniformManagerVolume.addShared('u_SelectedPoints', () => {
            return this.selectionManager.getSelectedPoints();
        });
        /*this.uniformManagerVolume.addShared('u_SelectedPointsDisplayMode', () => {
            return this.selectionManager.getPointDisplayMode();
        });*/
        this.uniformManagerVolume.addShared('u_SelectedPointsRadius', () => {
            return this.selectionManager.getPointRadius();
        });
        this.uniformManagerVolume.addShared('u_NumSelectedPoints', () => {
            return this.selectionManager.getNumPoints();
        });

        this.uniformManagerVolume.addShared('u_GradientDelta', () => {
            let h = this.env.getActiveDataset('GLOBAL').header;

            return [
                h.spacing.x / h.cols,
                h.spacing.y / h.rows,
                h.spacing.z / h.slices
            ];

            return this.selectionManager.getNumPoints();
        });

        this.uniformManagerVolume.addUnique('u_GMagWeighting', (subviewID) => {
            //return this.selectionManager.isRaySelected();
            return this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID).gradientMagnitudeWeighting;
        });

        this.uniformManagerVolume.addUnique('u_OverallOpacity', (subviewID) => {
            //return this.selectionManager.isRaySelected();
            return this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID).overallOpacity;
        });
    }

    setConfigurationModeForSubview(category, mode, subviewID) {
        this.configurationManager.configureSubview(subviewID, {
            [category]: mode
        });
    }


    linkChanged(modelKey) {
        this.modelSyncManager.updateSyncForModelKey(modelKey);

        if (modelKey === Models.CAMERA.name  ||  modelKey === Models.SLICER.name) { // Repoint slicer cameras!
            this._syncSlicerAndVolumeCameras();
        }

        // re-render all subviews

        this.notifySubviewsNeedFullUpdate();
        this.requestAnimationFrame();
    }

    _syncSlicerAndVolumeCameras() {
        this.modelSyncManager.call(Models.CAMERA.name, 'killSlaves');

        for (let subviewID in this.subviews) {
            let volumeCamera = this.modelSyncManager.getActiveModel(Models.CAMERA.name, subviewID);

            let slicerModel = this.modelSyncManager.getActiveModel(Models.SLICER.name, subviewID);

            slicerModel.linkCameraPhiAndThetaTo(volumeCamera);
        }
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

        this.configurationManager.configureSubview(id, initialConfigurations);

        this.syncWithLayout();
        this._syncSlicerAndVolumeCameras();

        this._notifySubviewsNeedUpdate('Volume', Object.keys(this.subviews), true);

        this.requestAnimationFrame();
    }


    /**
     * Removes a subview
     *
     * @param {number} id
     * @returns {bool} wasSelected whether or not the removed subview was selected locally.
     */
    removeView(id) {
        delete this.subviews[id];
        this.modelSyncManager.removeSubview(id);
        this.uniformManagerVolume.removeSubview(id);
        this.uniformManagerSlicer.removeSubview(id);

        this.syncWithLayout();
        this._syncSlicerAndVolumeCameras();
        this.requestAnimationFrame();


        if (this.localControllerSelectedSubviewID === id) {
            this.localControllerSelectedSubviewID = Object.keys(this.subviews)[0];
            return true;
        }
        return false;
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

        this.refreshLastStep();
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

    refreshLastStep() {
        this.uniformManagerSlicer.updateAll();
        this.uniformManagerVolume.updateAll();

        for (let subviewID in this.subviews) {

            //this._updateTextures(subviewID);
            let view = this.subviews[subviewID];
            //this._debugRotateCube(subviewID);

            if (!view)
                continue;

            view.lastStepRender();
        }

    }

    notifySubviewsNeedFullUpdate() {
        for (let subviewID in this.subviews) {
            let view = this.subviews[subviewID];
            view.notifyNeedsUpdate('Volume', true);
            view.notifyNeedsUpdate('Slicer', true);
        }
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

    notifyLightSettingsDidChangeAtEditor(editorKey, args) {
        let toUpdateSubviewID = null;
        if (editorKey === 'GLOBAL') {
            toUpdateSubviewID = 'GLOBAL';
        } else {
            toUpdateSubviewID = this.localControllerSelectedSubviewID;
        }

        this.modelSyncManager.getActiveModel(Models.LIGHTS.name, toUpdateSubviewID).update(args);

        this.notifyNeedsUpdateForModel(Models.LIGHTS.name, toUpdateSubviewID, ['Volume']);
        this.requestAnimationFrame();
    }

    notifyGradientMagnitudeWeightingChanged(editorKey, newValue) {
        let toUpdateSubviewID = null;
        if (editorKey === 'GLOBAL') {
            toUpdateSubviewID = 'GLOBAL';
        } else {
            toUpdateSubviewID = this.localControllerSelectedSubviewID;
        }

        this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, toUpdateSubviewID).gradientMagnitudeWeighting = newValue;
        this.notifyNeedsUpdateForModel(Models.TRANSFER_FUNCTION.name, toUpdateSubviewID,   ['Volume']);
        this.requestAnimationFrame();
    }

    notifyOverallOpacityChanged(editorKey, newValue) {
        let toUpdateSubviewID = null;
        if (editorKey === 'GLOBAL') {
            toUpdateSubviewID = 'GLOBAL';
        } else {
            toUpdateSubviewID = this.localControllerSelectedSubviewID;
        }

        this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, toUpdateSubviewID).overallOpacity = newValue;
        this.notifyNeedsUpdateForModel(Models.TRANSFER_FUNCTION.name, toUpdateSubviewID,   ['Volume']);
        this.requestAnimationFrame();
    }

    notifyTransferFunctionDidChangeAtEditor(tfEditorKey) {
        if (Object.keys(this.subviews).length === 0)
            return;

        console.log("Updating TF tex... src: " + tfEditorKey);

        // Edits go to the master TF not necessarily the local TF itself.
        // Depends on links
        let masterSubviewKey = this.modelSyncManager.getActiveModelSubviewID(Models.TRANSFER_FUNCTION.name, this.localControllerSelectedSubviewID);

        this.FBAndTextureManager.createTransferFunction2DTexture(tfEditorKey, masterSubviewKey);

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

    notifyLocalControllerSelectionDidChange(newSubview) {
        this.localControllerSelectedSubviewID = newSubview;
    }

    notifyShowRayDidChange(showRay, subviewID) {
        if (Object.keys(this.subviews).length === 0)
            return;

        let model = this.modelSyncManager.getModel(Models.SELECTION_DISPLAY.name, subviewID || this.localControllerSelectedSubviewID);
        model.displayRay = showRay;
        //this._updateAndRefreshVolumeViewForSubviewID(subviewID || this.localControllerSelectedSubviewID);
        if (showRay)
            this._updateAndRefreshVolumeViewForSubviewIDsShowingRay();
        else
            this._updateAndRefreshVolumeViewForSubviewID(this.localControllerSelectedSubviewID);
    }

    _updateAndRefreshVolumeViewForLocalSubviewID() {
        this._updateAndRefreshVolumeViewForSubviewID(this.localControllerSelectedSubviewID);
    }

    _updateAndRefreshVolumeViewForSubviewID(subviewID) {
        this.uniformManagerVolume.updateAll();
        this._notifySubviewsNeedUpdate('Volume', [subviewID], true);
        this.requestAnimationFrame();
    }

    notifyShowPointsDidChange(showPoints) {
        if (Object.keys(this.subviews).length === 0)
            return;

        let model = this.modelSyncManager.getModel(Models.SELECTION_DISPLAY.name, this.localControllerSelectedSubviewID);

        model.displayPoints = showPoints;
        this.uniformManagerVolume.updateAll();
        this._updateAndRefreshVolumeViewForLocalSubviewID();
    }

    notifyClearRay(editorKey) {
        // temp just let it be global by default, ignore editor key
        this.selectionManager.unselectRay();
        this.uniformManagerVolume.updateAll();
        this._updateAndRefreshVolumeViewForSubviewIDsShowingRay();
    }

    notifyClearPoints(editorKey) {
        this.selectionManager.unselectPoints();
        this.uniformManagerVolume.updateAll();
        this._updateAndRefreshVolumeViewForSubviewIDsShowingPoints();
    }

    _updateAndRefreshVolumeViewForSubviewIDsShowingRay() {
        let models = this.modelSyncManager.getAllDefaultModels(Models.SELECTION_DISPLAY.name);

        let toUpdate = [];

        for (let subviewID in this.subviews) {
            if (models[subviewID].displayRay)
                toUpdate.push(subviewID);
        }

        this.uniformManagerVolume.updateAll();
        this._notifySubviewsNeedUpdate('Volume', toUpdate, true);
        this.requestAnimationFrame();
    }

    _updateAndRefreshVolumeViewForSubviewIDsShowingPoints() {
        let models = this.modelSyncManager.getAllDefaultModels(Models.SELECTION_DISPLAY.name);

        let toUpdate = this._getAllSubviewsShowingPoints();

        this.uniformManagerVolume.updateAll();
        this._notifySubviewsNeedUpdate('Volume', toUpdate, true);
        this.requestAnimationFrame();
    }

    _getAllSubviewsShowingPoints() {
        let models = this.modelSyncManager.getAllDefaultModels(Models.SELECTION_DISPLAY.name);

        let showingPoints = [];

        for (let subviewID in this.subviews) {
            if (models[subviewID].displayPoints)
                showingPoints.push(subviewID);
        }

        return showingPoints;
    }

    _updateAndRefreshVolumeViewForSubviewIDsShowingPointsOrRay() {
        let models = this.modelSyncManager.getAllDefaultModels(Models.SELECTION_DISPLAY.name);

        let toUpdate = [];

        for (let subviewID in this.subviews) {
            if (models[subviewID].displayPoints || models[subviewID].displayRay)
                toUpdate.push(subviewID);
        }

        this.uniformManagerVolume.updateAll();
        this._notifySubviewsNeedUpdate('Volume', toUpdate, true);
        this.requestAnimationFrame();
    }

    notifyRayRadiusDidChange(editorKey, newRadius) {
        this.selectionManager.setRayRadius(newRadius);
        this.uniformManagerVolume.updateAll();
        //this._updateAndRefreshVolumeViewForLocalSubviewID();
        this._updateAndRefreshVolumeViewForSubviewIDsShowingRay();
    }

    notifyPointRadiusDidChange(editorKey, newRadius) {
        this.selectionManager.setPointRadius(newRadius);
        this.uniformManagerVolume.updateAll();
        //this._updateAndRefreshVolumeViewForLocalSubviewID();
        this._updateAndRefreshVolumeViewForSubviewIDsShowingPoints();
    }

    notifyNonSelectedOpacityDidChange(editorKey, value01) {
        // Let it be global for now ...
        this.selectionManager.setNonSelectedOpacity(value01);
        this._updateAndRefreshVolumeViewForSubviewIDsShowingPointsOrRay();
    }

    notifyViewTypeChanged(subviewID, newType) {
        //TODO change shader config upon change
        let presets = PRESETS[newType];
        this.modelSyncManager.applyPresetsToSubview(presets, subviewID);
        this._notifySubviewsNeedUpdate('Volume', Object.keys(this.subviews), true);
        this.requestAnimationFrame();
    }

    _notifyNeedsUpdate(name, subviewID) {
        for (let theSubviewID in this.subviews) {
            this.subviews[theSubviewID].notifyNeedsUpdate(name);
        }
    }

    requestAnimationFrame(renderers, subviewID) {
        window.requestAnimationFrame(this.refresh.bind(this));
    }



    /*_updateTextures(subviewID) {
        let TFModelID = this.modelSyncManager.getActiveModel(Models.TRANSFER_FUNCTION.name, subviewID);

        let check = Environment.TransferFunctionManager.checkNeedsUpdate(TFModelID);
        if (check) {

            this.FBAndTextureManager.createTransferFunction2DTexture('GLOBAL');
        }
    }*/

    __DEBUGRefreshView0() {
        console.log("__DEBUGRefreshView0()");
        this.subviews[0].refresh();
    }
}


module.exports = ViewManager;
