let glsl = require('glslify');
let twgl = require('twgl.js');

/**---
 *--- HOW TO ADD A SHADER PROGRAM:
 *--- 1. Add the folder to the BUILTIN PROGRAMS as Foldername: 'Foldername'
 *--- 2. Register the vertex and fragment shader with glslify + file path
 *--- Shader program should now be available by calling getProgramInfo(name)
 *---
 *--- FOLDER STRUCTURE: Foldername/shader._.glsl , _ = v or f, or whatever other type
 **/

let BUILTIN_PROGRAMS = {
    BasicVolume: 'BasicVolume',
    BasicVolume_PrecomputedGMag: 'BasicVolume_PrecomputedGMag',
    PositionToRGB: 'PositionToRGB',
    DebugCube: 'DebugCube',
    DebugVolume: 'DebugVolume',
    TextureToBBColor: 'TextureToBBColor',
    TextureBackMinusFront: 'TextureBackMinusFront',
    SlicerBasic: 'SlicerBasic',
    SlicerPicking: 'SlicerPicking',
    Texture2Quad: 'Texture2Quad',
    VolImage2Quad: 'VolImage2Quad',
    SlicerImage2Quad: 'SlicerImage2Quad',
    Volume3DPicking: 'Volume3DPicking',
    RayProjection: 'RayProjection',
    VolumeRayRender: 'VolumeRayRender',
    BasicVolumeSelectionOnly: 'BasicVolumeSelectionOnly',
    BasicVolumeHighlightSelection: 'BasicVolumeHighlightSelection',
    PointProjection: 'PointProjection',
    VolumePoints: 'VolumePoints'
};


/**
 * Manages all shaders, maintains a list of shader sources
 * and will create shader programs from whatever combination
 * of shader sources (note: they must be compatible)
 *
 * @memberof module:Core/Renderer
 **/
class ShaderManager {
    /**
     * Constructs a new shader manager
     * @param {WebGL2Context} gl the webGL context to bind the shader programs to
     * @constructor
     */
    constructor(gl) {
        this.gl = gl;
        this.programs = {};

        this.vertexShaders = {};
        this.fragmentShaders = {};

        // Must be done manually like this due to glslify
        // It does a static code analysis and injects the GLSL
        // file contents as strings, prior to running browserify
        // itself.
        // TLDR: Cannot use glslify dynamically.
        this.vertexShaders['BasicVolume'] = glsl.file('../rendering/shaders/Volume/BasicVolume/shader.v.glsl');
        this.fragmentShaders['BasicVolume'] = glsl.file('../rendering/shaders/Volume/BasicVolume/shader.f.glsl');

        this.vertexShaders['BasicVolume_PrecomputedGMag'] = glsl.file('../rendering/shaders/Volume/BasicVolume_PrecomputedGMag/shader.v.glsl');
        this.fragmentShaders['BasicVolume_PrecomputedGMag'] = glsl.file('../rendering/shaders/Volume/BasicVolume_PrecomputedGMag/shader.f.glsl');


        this.vertexShaders['PositionToRGB'] = glsl.file('../rendering/shaders/Volume/PositionToRGB/shader.v.glsl');
        this.fragmentShaders['PositionToRGB'] = glsl.file('../rendering/shaders/Volume/PositionToRGB/shader.f.glsl');


        this.vertexShaders['DebugCube'] = glsl.file('../rendering/shaders/Debug/shader.cube.v.glsl');
        this.fragmentShaders['DebugCube'] = glsl.file('../rendering/shaders/Debug/shader.cube.f.glsl');

        this.vertexShaders['DebugVolume'] = glsl.file('../rendering/shaders/Debug/shader.v.glsl');
        this.fragmentShaders['DebugVolume'] = glsl.file('../rendering/shaders/Debug/shader.f.glsl');


        this.vertexShaders['TextureToBBColor'] = glsl.file('../rendering/shaders/Volume/TextureToBBColor/shader.v.glsl');
        this.fragmentShaders['TextureToBBColor'] = glsl.file('../rendering/shaders/Volume/TextureToBBColor/shader.f.glsl');

        this.vertexShaders['TextureBackMinusFront'] = glsl.file('../rendering/shaders/Volume/TextureBackMinusFront/shader.v.glsl');
        this.fragmentShaders['TextureBackMinusFront'] = glsl.file('../rendering/shaders/Volume/TextureBackMinusFront/shader.f.glsl');


        this.vertexShaders['SlicerBasic'] = glsl.file('../rendering/shaders/Slicer/Basic/shader.v.glsl');
        this.fragmentShaders['SlicerBasic'] = glsl.file('../rendering/shaders/Slicer/Basic/shader.f.glsl');

        this.vertexShaders['SlicerPicking'] = glsl.file('../rendering/shaders/Slicer/Picking/shader.v.glsl');
        this.fragmentShaders['SlicerPicking'] = glsl.file('../rendering/shaders/Slicer/Picking/shader.f.glsl');

        this.vertexShaders['Texture2Quad'] = glsl.file('../rendering/shaders/Texture2Quad/shader.v.glsl');
        this.fragmentShaders['Texture2Quad'] = glsl.file('../rendering/shaders/Texture2Quad/shader.f.glsl');

        this.vertexShaders['VolImage2Quad'] = glsl.file('../rendering/shaders/Volume/Image2Quad/shader.v.glsl');
        this.fragmentShaders['VolImage2Quad'] = glsl.file('../rendering/shaders/Volume/Image2Quad/shader.f.glsl');

        this.vertexShaders['SlicerImage2Quad'] = glsl.file('../rendering/shaders/Slicer/Image2Quad/shader.v.glsl');
        this.fragmentShaders['SlicerImage2Quad'] = glsl.file('../rendering/shaders/Slicer/Image2Quad/shader.f.glsl');

        this.vertexShaders['Volume3DPicking'] = glsl.file('../rendering/shaders/Volume/3DPicking/shader.v.glsl');
        this.fragmentShaders['Volume3DPicking'] = glsl.file('../rendering/shaders/Volume/3DPicking/shader.f.glsl');

        this.vertexShaders['RayProjection'] = glsl.file('../rendering/shaders/Volume/RayProjection/shader.v.glsl');
        this.fragmentShaders['RayProjection'] = glsl.file('../rendering/shaders/Volume/RayProjection/shader.f.glsl');

        this.vertexShaders['VolumeRayRender'] = glsl.file('../rendering/shaders/Volume/RayRender/shader.v.glsl');
        this.fragmentShaders['VolumeRayRender'] = glsl.file('../rendering/shaders/Volume/RayRender/shader.f.glsl');

        this.vertexShaders['BasicVolumeSelectionOnly'] = glsl.file('../rendering/shaders/Volume/BasicVolumeSelectionOnly/shader.v.glsl');
        this.fragmentShaders['BasicVolumeSelectionOnly'] = glsl.file('../rendering/shaders/Volume/BasicVolumeSelectionOnly/shader.f.glsl');

        this.vertexShaders['BasicVolumeHighlightSelection'] = glsl.file('../rendering/shaders/Volume/BasicVolumeHighlightSelection/shader.v.glsl');
        this.fragmentShaders['BasicVolumeHighlightSelection'] = glsl.file('../rendering/shaders/Volume/BasicVolumeHighlightSelection/shader.f.glsl');

        this.vertexShaders['PointProjection'] = glsl.file('../rendering/shaders/Volume/PointProjection/shader.v.glsl');
        this.fragmentShaders['PointProjection'] = glsl.file('../rendering/shaders/Volume/PointProjection/shader.f.glsl');

        this.vertexShaders['VolumePoints'] = glsl.file('../rendering/shaders/Volume/VolumePoints/shader.v.glsl');
        this.fragmentShaders['VolumePoints'] = glsl.file('../rendering/shaders/Volume/VolumePoints/shader.f.glsl');

        this._initBuiltinPrograms();
    }

    _initBuiltinPrograms() {
        for (let program in BUILTIN_PROGRAMS)
            this.createProgramFromShaders({
                name: program,
                vShaderName: program,
                fShaderName: program
            });
    }


    /**
     * Creates program from shaders, and returns the program
     *
     * @param {module:Core/Renderer.ShaderProgramDetail} detail
     * @return {twgl.ProgramInfo} program info (see twgl.js docs)
     *
     */
    createProgramFromShaders(detail) {
        let gl = this.gl;

        let shaders = [
                this.vertexShaders[detail.vShaderName],
                this.fragmentShaders[detail.fShaderName]
            ];

        let program = twgl.createProgramInfo(
            gl, [
                this.vertexShaders[detail.vShaderName],
                this.fragmentShaders[detail.fShaderName]
            ]);

        let blockSpecs = program.uniformBlockSpec.blockSpecs;

        for (let blockName in blockSpecs) {
            if (!program.blockInfos)
                program.blockInfos = {};

            program.blockInfos[blockName] = twgl.createUniformBlockInfo(gl, program, "name");
        }

        // Create uniform block infos too...


        this.programs[detail.name] = program;
    }

    getProgramInfo(name) {
        return this.programs[name];
    }

    getListOfPrograms() {
        return this.programs.keys();
    }

    getAvailableShadersSets() {
        return BUILTIN_PROGRAMS;
    }

}

module.exports = ShaderManager;
/**
 *
 * @typedef {Object} ShaderProgramDetail
 * @property {string} name name of the shader program
 * @property {string} vShaderName vertex shader name
 * @property {string} fShaderName fragment shader name
 *
 * @memberof module:Core/Renderer
 **/
