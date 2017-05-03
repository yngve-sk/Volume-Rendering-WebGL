let VolumeViewTypes = {
    '3D View': 'Basic',
    'Slice View': 'Slice',
    'Surface View': 'Surface'
};

let DEFAULT_CONFIG = {
    'Volume': 'Basic',
    'Slicer': 'Basic',
    'SlicerPicking': 'Basic',
    'SlicerPickingSlices': 'Default',
    'SlicerPickingRails': 'Default',
    'SlicerPickingCubeFaces': 'Default'
}


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
                'Slice': (id) => {
                    return this._generateBasicVolumeConfigForSubview(id);
                },
                'Surface': (id) => {
                    return this._generateBasicVolumeConfigForSubview(id);
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
                }/*,
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerImage2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: fullScreenQuadBuffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        enable: [gl.CULL_FACE],
                        //disable: [gl.BLEND],
                        cullFace: [gl.BACK]
                    }
                }*/
                /*{ // Render the picking buffer into a subview..
                    programInfo: VM.shaderManager.getProgramInfo('SlicerPicking'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('UnitQuadTexture'), //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerBuffer'),
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
                    programInfo: VM.shaderManager.getProgramInfo('Texture2Quad'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: VM.bufferManager.getBufferInfo('FullScreenQuadBuffer'),
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
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerRailBuffer'),
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
                        clear: [gl.DEPTH_BUFFER_BIT  |  gl.COLOR_BUFFER_BIT],
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
              /*  {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null,
                    bufferInfo: buffer,
                    subViewport: {
                        x0: 0.05,
                        y0: 0.7,
                        width: 0.3,
                        height: 0.3
                    },
                    glSettings: {
                        cullFace: [gl.FRONT]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null,
                    bufferInfo: buffer,
                    subViewport: {
                        x0: 0.35,
                        y0: 0.7,
                        width: 0.3,
                        height: 0.3
                    },
                    glSettings: {
                        cullFace: [gl.BACK]
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('TextureBackMinusFront'),
                    frameBufferInfo: null,
                    bufferInfo: buffer,
                    subViewport: {
                        x0: 0.65,
                        y0: 0.7,
                        width: 0.3,
                        height: 0.3
                    },
                    glSettings: {
                        cullFace: [gl.BACK]
                    }
                },*/
            ]
        };

        return BasicVolumeConfig;
    }
}

module.exports = ConfigurationManager;
