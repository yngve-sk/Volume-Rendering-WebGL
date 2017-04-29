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

        this.configurations = {
            Volume: {
                'Basic': (id) => {
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
            Sphere: {

            }
        }
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


    _generateBasicSlicerConfigForSubview(subviewID) {
        let VM = this.VM;
        let gl = VM.masterContext;

        let model = VM.modelSyncManager.getActiveModel('Slicer', subviewID);
        let uniforms = VM.uniformManagerSlicer.getUniformBundle(subviewID);
        uniforms.u_QuadTexture = VM.FBAndTextureManager.getTexture('UnitQuadTexture');

        let BasicSlicerConfig = {
            uniforms: VM.uniformManagerSlicer.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('SlicerBasic'),
                    frameBufferInfo: null,
                    //frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('UnitQuadTexture'),
                    //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerBuffer'),
                    //                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerCubeFaceBuffer'),
                    //                    bufferInfo: VM.bufferManager.getBufferInfo('SlicerSliceBuffer'),
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
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');
        let BasicVolumeConfig = {
            uniforms: VM.uniformManagerVolume.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer, // The bounding box!
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer, // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolume'),
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

    _generateDebugConfigurationForSubview(subviewID) {
        let VM = this.VM;
        let buffer = VM.bufferManager.getBufferInfo('VolumeBB');

        let DebugConfig = {
            uniforms: VM.uniformManagerVolume.getUniformBundle(subviewID),
            steps: [
                {
                    programInfo: VM.shaderManager.getProgramInfo('PositionToRGB'),
                    frameBufferInfo: VM.FBAndTextureManager.getFrameBuffer('BackFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        cullFace: 'FRONT'
                    }
                },
                {
                    programInfo: VM.shaderManager.getProgramInfo('BasicVolume'),
                    frameBufferInfo: null, //VM.FBAndTextureManager.getFrameBuffer('FrontFace'),
                    bufferInfo: buffer,
                    //bufferInfo: VM.bufferManager.getBufferInfo('DebugCubeBuffer'), // The bounding box!
                    glSettings: {
                        cullFace: 'BACK'
                    }
                },
            ]
        };

        return DebugConfig;
    }

}

module.exports = ConfigurationManager;
