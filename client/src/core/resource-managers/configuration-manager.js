let VolumeViewTypes = {
    '3D View': 'Basic',
    'Slice View': 'Slice',
    'Surface View': 'Surface'
};

let DEFAULT_CONFIG = require('../settings').Views.ViewManager.DefaultViewConfig;
/*

let DEFAULT_CONFIG = {
    'Volume': 'Basic',
    'Volume3DPicking': 'Default',
    'VolumeSlicePicking': 'Default',
    'Slicer': 'Basic',
    'SlicerPicking': 'Basic',
    'SlicerPickingSlices': 'Default',
    'SlicerPickingRails': 'Default',
    'SlicerPickingCubeFaces': 'Default'
}
*/


/**
 * Manages all rendering scheme configurations
 *
 * @constructor
 * @memberof module:Core/ResourceManagers
 */
class ConfigurationManager {
    /**
     * Constructs a new config manager
     *
     * @param {module:Core/View} viewManager the parent view manager of the config manager
     * @constructor
     */
    constructor(viewManager) {
        this.VM = viewManager;

        this.activeConfigurations = {
            0: DEFAULT_CONFIG
        }

        this.configurations = {
            Volume: {
                'Basic': (id) => {
                    return this._generateBasicVolumeConfigForSubview(id);
                },
                'SelectionOnly': (id) => {
                    return this._generateSelectionOnlyVolumeConfigForSubview(id);
                },
                'HighlightSelection': (id) => {
                    return this._generateHighlightSelectionVolumeConfigForSubview(id);
                },
                'Basic_PrecomputedGMag': (id) => {
                    return this._generateBasicPrecomputedGMagVolumeConfigForSubview(id);
                },
                'Slice': (id) => {
                    return this._generateBasicVolumeConfigForSubview(id);
                },
                'Surface': (id) => {
                    return this._generateBasicVolumeConfigForSubview(id);
                }
            },
            Volume3DPicking: {
                'Default': (id) => {
                    return this._generateVolume3DPickingConfigForSubview(id);
                }
            },
            VolumeRayRender: {
                'Default': (id) => {
                    return this._generateVolumeRayRenderForSubview(id);
                }
            },
            VolumePointRenderer: {
                'Default': (id) => {
                    return this._generateVolumePointRenderForSubview(id);
                }
            },
            Slicer: {
                'Basic': (id) => {
                    return this._generateBasicSlicerConfigForSubview(id);
                },
            },
            SlicerPicking: {
                'Basic': (id) => {
                    return this._generateSlicerPickingBufferConfigForSubview(id);
                }
            },
            SlicerPickingRails: {
                'Default': (id) => {
                    return this._generateSlicerRailsPBConfigForSubview(id);
                }
            },
            SlicerPickingSlices: {
                'Default': (id) => {
                    return this._generateSlicerSlicesPBConfigForSubview(id);
                }
            },
            SlicerPickingCubeFaces: {
                'Default': (id) => {
                    return this._generateSlicerCubeFacesPBConfigForSubview(id);
                }
            },
            Sphere: {

            }
        }
    }

    setVolumeViewTypeForSubview(newType, subviewID) {
        let configName = VolumeViewTypes[newType];
        this.configureSubview(subviewID, {
            'Volume': configName
        });
    }

    _getConfigurationForSubview(category, name, subviewID) {
        if (this.configurations.hasOwnProperty(category) &&
            this.configurations[category].hasOwnProperty(name)) {
            return this.configurations[category][name](subviewID);
        } else
            console.error("Unknown category or name " + category + ", " + name);
    }

    /**
     *
     * @typedef {Object} RenderingSchemeOption
     * @property {string} Volume - name of volume configuration. Available options: {'Basic'} (optional)
     * @property {string} Slicer - name of volume configuration. Available options: {'Basic'} (optional)
     * @property {string} SlicerPicking - name of volume configuration. Available options: {'Basic'} (optional)
     * @property {string} Sphere - name of sphere configuration. Available options: {'Basic'} (optional)
     *
     * @memberof module:Core/ResourceManagers
     *
     **/

    /**
     * Configures a subview
     *
     * @param {number} id
     * @param {module:Core/ResourceManagers.RenderingSchemeOption} configurations
     */
    configureSubview(id, configurations) {
        let VM = this.VM;

        if (!configurations)
            configurations = DEFAULT_CONFIG;

        let subview = VM.subviews[id];
        for (let category in configurations) {
            let configName = configurations[category];
            let config = this._getConfigurationForSubview(category, configName, id);
            subview.configureRenderer(category, config);
        }
    }

    initializeSubviewToDefault(id) {
        this.configureSubview(id, DEFAULT_CONFIG);
    }

    configureOffscreenSubview(id, configurations) {
        let VM = this.VM;

        let subview = VM.offscreenSubviews[id];
        for (let category in configurations) {
            let configName = configurations[category];
            let config = this._getConfigurationForSubview(category, configName, id);
            subview.configureRenderer(category, config);
        }
    }

    addSubview(id) {
        for (let category in this.configurations) {
            let configName = this.configurations[category];
            let config = this._getConfigurationForSubview(category, configName, id);
            subview.configureRenderer(category, config);
        }
    }

    _generateBasicSlicerConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;

        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);
        let uniforms = VM.uniformManagerSlicer.getUniformBundle(subviewID);
        let fullScreenQuadBuffer = VM.bufferManager.getBufferInfo('FullScreenQuadBuffer');

        let SlicerImageFB = VM.FBAndTextureManager.getFrameBuffer('SlicerImageTexture' + subviewID);

        let BasicSlicerConfig = {

            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerBasic'),
                    frameBufferInfo: null, //SlicerImageFB,
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST, gl.BLEND],
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.CULL_FACE],
                        blendFunc: [gl.SRC_ALPHA, gl.ONE],
                    }
                }
            ]
        };



        return BasicSlicerConfig;
    }
    /* SlicerRails
     SlicerCubeFace
     SlicerSlices*/

    _generateSlicerRailsPBConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);

        let PickingConfig = {
            alias: 'SlicerPBRails',
            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPickingRails'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerRailPBBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST, gl.CULL_FACE],
                        disable: [gl.BLEND],
                        depthFunc: [gl.LEQUAL],
                        cullFace: [gl.BACK],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                }
            ]
        };

        return PickingConfig;
    }

    _generateSlicerCubeFacesPBConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);

        let PickingConfig = {
            alias: 'SlicerPBCubeFaces',
            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPickingCubeFaces'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
                        disable: [gl.BLEND, gl.CULL_FACE],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                }
            ]
        };

        return PickingConfig;
    } //TODO add renderers to subview one for each of these configs

    _generateSlicerSlicesPBConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);

        let PickingConfig = {
            alias: 'SlicerPBSlices',
            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPickingSlices'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
                        disable: [gl.BLEND, gl.CULL_FACE],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                }
            ]
        };

        return PickingConfig;
    }
    _generateSlicerPickingBufferConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);

        let PickingConfig = {
            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    glSettings: {
                        enable: [gl.DEPTH_TEST],
                        cullFace: [gl.BACK],
                        depthFunc: [gl.LESS],
                        disable: [gl.BLEND, gl.CULL_FACE],
                        clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    //                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerRailBuffer'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerRailPBBuffer'),
                    //bufferInfo: VM.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    glSettings: { // Same as before...
                        enable: [gl.DEPTH_TEST, gl.CULL_FACE],
                        clear: [gl.DEPTH_BUFFER_BIT],
                        cullFace: [gl.BACK],
                        depthFunc: [gl.LESS],
                        disable: [gl.BLEND],
                    }
                },
                /*{
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('SlicerPicking'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerSliceBuffer'),
                    //bufferInfo: VM.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
//                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerBuffer'),
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
    _generateBasicPrecomputedGMagVolumeConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');
        let fullScreenQuadBuffer = VM.bufferManager.getBufferInfo('FullScreenQuadBuffer');
        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let VolumeImageFB = VM.FBAndTextureManager.getFrameBuffer('VolumeImageTexture' + subviewID);


        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('VolumeImageTexture' + subviewID);
        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('DebugTex' + subviewID);

        let BasicVolumeConfig = {
            uniforms: uniforms,
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolume_PrecomputedGMag'),
                    frameBufferInfo: VolumeImageFB, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT, gl.COLOR_BUFFER_BIT],
                        cullFace: [gl.BACK]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: fullScreenQuadBuffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                }
            ]
        };

        return BasicVolumeConfig;
    }

    _generateBasicVolumeConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');
        let fullScreenQuadBuffer = VM.bufferManager.getBufferInfo('FullScreenQuadBuffer');
        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let VolumeImageFB = VM.FBAndTextureManager.getFrameBuffer('VolumeImageTexture' + subviewID);


        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('VolumeImageTexture' + subviewID);
        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('DebugTex' + subviewID);

        let BasicVolumeConfig = {
            uniforms: uniforms,
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolume'),
                    frameBufferInfo: VolumeImageFB, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT, gl.COLOR_BUFFER_BIT],
                        cullFace: [gl.BACK]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: fullScreenQuadBuffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                }
            ]
        };

        return BasicVolumeConfig;
    }

    _generateSelectionOnlyVolumeConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');
        let fullScreenQuadBuffer = VM.bufferManager.getBufferInfo('FullScreenQuadBuffer');
        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let VolumeImageFB = VM.FBAndTextureManager.getFrameBuffer('VolumeImageTexture' + subviewID);


        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('VolumeImageTexture' + subviewID);
        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('DebugTex' + subviewID);

        let BasicVolumeConfig = {
            uniforms: uniforms,
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolumeSelectionOnly'),
                    frameBufferInfo: VolumeImageFB, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT, gl.COLOR_BUFFER_BIT],
                        cullFace: [gl.BACK]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: fullScreenQuadBuffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                }
            ]
        };

        return BasicVolumeConfig;
    }

    _generateHighlightSelectionVolumeConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');
        let fullScreenQuadBuffer = VM.bufferManager.getBufferInfo('FullScreenQuadBuffer');
        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let VolumeImageFB = VM.FBAndTextureManager.getFrameBuffer('VolumeImageTexture' + subviewID);


        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('VolumeImageTexture' + subviewID);
        uniforms.u_VolumeImageTexture = VM.FBAndTextureManager.getTexture('DebugTex' + subviewID);

        let BasicVolumeConfig = {
            uniforms: uniforms,
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolumeHighlightSelection'),
                    frameBufferInfo: VolumeImageFB, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT, gl.COLOR_BUFFER_BIT],
                        cullFace: [gl.BACK]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: fullScreenQuadBuffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                }
            ]
        };

        return BasicVolumeConfig;    }


    _generateVolume3DPickingConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');

        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let pickingBufferFB = VM.FBAndTextureManager.getFrameBuffer('VolumePicking');
        let pickingShaderProgram = VM.shaderManager.getProgramInfo('Volume3DPicking');


        let Config = {
            uniforms: uniforms,
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('VolumeBackfacePicking'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: pickingShaderProgram,
                    frameBufferInfo: pickingBufferFB,
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.BACK]
                    }
                },
                ]
        };

        return Config;
    }


    _generateVolumeRayRenderForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');

        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let pickingBufferFB = VM.FBAndTextureManager.getFrameBuffer('VolumePicking');
        let pickingShaderProgram = VM.shaderManager.getProgramInfo('Volume3DPicking');


        let Config = {
            uniforms: uniforms,
            steps: [
                {   // Project ray onto proj texture
                    programInfo: VM.shaderManager.getProgramInfo('RayProjection'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('RayProjectionTexture'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.BACK]
                    }
                },
                { // Render volume to screen (assumes volume is already rendered)
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null,
                    bufferInfo: VM.bufferManager.getBufferInfo('FullScreenQuadBuffer'),
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                },
                {   // Render the ray on top of the volume image
                    programInfo: VM.shaderManager.getProgramInfo('VolumeRayRender'),
                    frameBufferInfo: null,
                    bufferInfo: buffer,
                    glSettings: {
                        // Preserve color buffer to overlay
                        //clear: [gl.COLOR_BUFFER_BIT],
                    }
                }
                ]
        };

        return Config;
    }

        _generateVolumePointRenderForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');

        let uniforms = VM.uniformManagerVolume.getUniformBundle(subviewID);

        let Config = {
            uniforms: uniforms,
            steps: [
                {   // Project point onto proj texture
                    programInfo: VM.shaderManager.getProgramInfo('PointProjection'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('PointProjectionTexture'),
                    bufferInfo: buffer,
                    glSettings: {
                        //clear: [gl.COLOR_BUFFER_BIT],
                        clear: [gl.DEPTH_BUFFER_BIT |  gl.COLOR_BUFFER_BIT],
                        disable: [gl.BLEND],
                        enable: [gl.CULL_FACE, gl.DEPTH_TEST],
                        cullFace: [gl.BACK]
                    }
                },
                { // Render volume to screen (assumes volume is already rendered)
                    programInfo: VM.shaderManager.getProgramInfo('VolImage2Quad'),
                    frameBufferInfo: null,
                    bufferInfo: VM.bufferManager.getBufferInfo('FullScreenQuadBuffer'),
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        clear: [gl.DEPTH_BUFFER_BIT],
                        disable: [gl.BLEND, gl.CULL_FACE]
                    }
                },
                {   // Render the points on top of the volume image
                    programInfo: VM.shaderManager.getProgramInfo('VolumePoints'),
                    frameBufferInfo: null,
                    bufferInfo: buffer,
                    glSettings: {
                        // Preserve color buffer to overlay
                        //clear: [gl.COLOR_BUFFER_BIT],
                    }
                }
                ]
        };

        return Config;
    }
}

module.exports = ConfigurationManager;
