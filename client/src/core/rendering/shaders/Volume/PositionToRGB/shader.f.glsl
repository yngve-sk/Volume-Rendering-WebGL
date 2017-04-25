#version 300 es
precision mediump float;
precision mediump sampler2D;


in vec4 v_gridPosition;
out vec4 outColor;

void main() {
    outColor = v_gridPosition;
}
