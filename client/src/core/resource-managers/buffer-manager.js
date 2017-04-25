let twgl = require('twgl.js');
let createCuboidVertices = require('../../geometry/box');

class BufferManager {
    constructor(gl) {
        this.gl = gl;
        this.bufferObjects = {};
    }

    createBoundingBoxBufferInfo(name, width, height, depth) {
        let arrays = createCuboidVertices(width, height, depth);
        this.bufferObjects[name] = twgl.createBufferInfoFromArrays(this.gl, arrays);
    }

    getBufferInfo(name) {
        return this.bufferObjects[name];
    }

    createBufferInfoFromArrays(arrays, name) {
        this.bufferObjects[name] = twgl.createBufferInfoFromArrays(this.gl, arrays);
    }
}

module.exports = BufferManager;
