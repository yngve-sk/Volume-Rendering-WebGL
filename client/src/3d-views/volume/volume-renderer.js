/*
    Renders a volume model onto a GL context,
    model is supposed to be treated as _READ ONLY_
    from here.

    To render stuff, the volume renderer needs...
        - A GL context
        - A model of the volume
        - The dataset to render
        ???
        The dataset is the ... model?
*/
let glsl = require('glslify');

class VolumeRenderer {
    constructor(canvas) {

        this.canvas = canvas;
        this.gl = this.canvas.getContext("webgl2");

        this._init();

        this.clippingRectIndices = [];
    }

    _init() {
        this._initShaders();
        this._clear();
        this._resize();
    }

    _resize() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    _draw() {
       // this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    _initShaders() {
        let gl = this.gl; // to not write "this.__" all the fkin time.
        let canvas = this.canvas;
        let vCode = glsl.file('./shaders/shader.v.glsl');
        let vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vCode);
        gl.compileShader(vShader);

        let fragCode = glsl.file('./shaders/shader.f.glsl');
        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        let shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vShader);
        gl.attachShader(shaderProgram, fragShader);

        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);


        let vertices = [
            -1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 1.0, 0.0
         ];

        let indices = [3, 2, 1, 3, 1, 0];

        // Create an empty buffer object to store vertex buffer
        var vertex_buffer = gl.createBuffer();

        // Bind appropriate array buffer to it
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        // Pass the vertex data to the buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Unbind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Create an empty buffer object to store Index buffer
        var Index_Buffer = gl.createBuffer();

        // Bind appropriate array buffer to it
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

        // Pass the vertex data to the buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // Unbind the buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


        // Bind vertex buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        // Bind index buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

        // Get the attribute location
        var coord = gl.getAttribLocation(shaderProgram, "position");

        // Point an attribute to the currently bound VBO
        gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

        // Enable the attribute
        gl.enableVertexAttribArray(coord);

        /*============= Drawing the Quad ================*/

        // Clear the canvas
        gl.clearColor(0.5, 0.5, 0.5, 0.9);

        // Enable the depth test
        gl.enable(gl.DEPTH_TEST);

        // Clear the color buffer bit
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set the view port
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Draw the triangle
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);



        console.log("DID DRAW!");

    }

    _initClippingRect() {
        let gl = this.gl;
        let verts = [
            -1.0, -1.0, 0.0, // bottom left
            -1.0, 1.0, 0.0, // top left
            1.0, -1.0, 0.0, // bottom right
            1.0, 1.0, 0.0 // top right
        ];

        let indices = [
            0, 1, 2,
            2, 3, 4

        ];

        let vb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vb);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        let ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.clippingRectIndices = indices;

    }

    _clear() {
        let gl = this.gl;
        gl.clearColor(0.5, 0.5, 0.5, 0.9);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
    }

    render() {
        //this._clear();
        //this._resize();
        //this._draw();
    }
}


module.exports = VolumeRenderer;
