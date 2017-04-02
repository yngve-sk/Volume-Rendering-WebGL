let glsl = require('glslify');

let canvas = document.getElementById('webgl-canvas-0');
gl = canvas.getContext("webgl2");


let vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.5,
         ];

let indices = [0, 1, 2, 3];

// Create empty vertex buffer
let vb = gl.createBuffer();

// Bind array buffer to vb
gl.bindBuffer(gl.ARRAY_BUFFER, vb);

// Pass data in
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// UNBIND buffer (hence the NULL).
gl.bindBuffer(gl.ARRAY_BUFFER, null);

// Create empty buffer object to store index buffer
let ib = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);

// Pass data in
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// UNBIND
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

// Shaders/

let vertCode = glsl.file('./shaders/test-v-shader.glsl');
console.log(vertCode);
let vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

let fragCode = glsl.file('./shaders/test-f-shader.glsl');
console.log(fragCode);
let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

let shaderProgram = gl.createProgram();

gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);

gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

gl.bindBuffer(gl.ARRAY_BUFFER, vb);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);

let coord = gl.getAttribLocation(shaderProgram, "coordinates");
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(coord);

gl.clearColor(0.5, 0.5, 0.5, 0.9);

gl.enable(gl.DEPTH_TEST);

gl.clear(gl.COLOR_BUFFER_BIT);

gl.viewport(0,0,canvas.width, canvas.height);

gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

