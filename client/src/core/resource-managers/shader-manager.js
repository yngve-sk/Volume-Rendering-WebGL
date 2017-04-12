let glsl = require('glslify');
let twgl = require('twgl.js');


// Naming convention: u_TheUniformName
let SHADER_UNIFORM_NAMES = {
    u_WorldViewProjection: 'u_WorldViewProjection',
    u_IsoValueToColorOpacity: 'u_IsoValueToColorOpacity',
    u_TexCoordToRayOrigin: 'u_TexCoordToRayOrigin',
    u_TexCoordToRayEndPoint: 'u_TexCoordToRayEndPoint',
    u_BoundingBoxNormalized: 'u_BoundingBoxNormalized',
    u_SamplingRate: 'u_SamplingRate',
    u_AspectRatio: 'u_AspectRatio'

};

// Naming convention: a_attributeName
let VSHADER_ATTR_NAMES = {
    a_position: 'a_position',
};

// Naming convention: v_attributeName, i.e shit passed from v-shader to f-shader!
let FSHADER_ATTR_NAMES = {
    v_bbPosition: 'v_bbPosition',
    v_projectedPosition: 'v_projectedPosition'
};

let BUILTIN_PROGRAMS = {
    BasicVolume: 'BasicVolume',
    PositionToRGB: 'PositionToRGB',
    DebugCube: 'DebugCube',
    DebugVolume: 'DebugVolume',
    TextureToBBColor: 'TextureToBBColor',
    TextureBackMinusFront : 'TextureBackMinusFront'
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
        this.vertexShaders['BasicVolume'] = glsl.file('../rendering/shaders/BasicVolume/shader.v.glsl');
        this.fragmentShaders['BasicVolume'] = glsl.file('../rendering/shaders/BasicVolume/shader.f.glsl');

        this.vertexShaders['PositionToRGB'] = glsl.file('../rendering/shaders/PositionToRGB/shader.v.glsl');
        this.fragmentShaders['PositionToRGB'] = glsl.file('../rendering/shaders/PositionToRGB/shader.f.glsl');

        this.vertexShaders['DebugCube'] = glsl.file('../rendering/shaders/Debug/shader.cube.v.glsl');
        this.fragmentShaders['DebugCube'] = glsl.file('../rendering/shaders/Debug/shader.cube.f.glsl');

        this.vertexShaders['DebugVolume'] = glsl.file('../rendering/shaders/Debug/shader.v.glsl');
        this.fragmentShaders['DebugVolume'] = glsl.file('../rendering/shaders/Debug/shader.f.glsl');

        this.vertexShaders['TextureToBBColor'] = glsl.file('../rendering/shaders/TextureToBBColor/shader.v.glsl');
        this.fragmentShaders['TextureToBBColor'] = glsl.file('../rendering/shaders/TextureToBBColor/shader.f.glsl');

        this.vertexShaders['TextureBackMinusFront'] = glsl.file('../rendering/shaders/TextureBackMinusFront/shader.v.glsl');
        this.fragmentShaders['TextureBackMinusFront'] = glsl.file('../rendering/shaders/TextureBackMinusFront/shader.f.glsl');



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
        let shaders = [
                this.vertexShaders[detail.vShaderName],
                this.fragmentShaders[detail.fShaderName]
            ];

        this.programs[detail.name] = twgl.createProgramInfo(
            this.gl, [
                this.vertexShaders[detail.vShaderName],
                this.fragmentShaders[detail.fShaderName]
            ]);
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
