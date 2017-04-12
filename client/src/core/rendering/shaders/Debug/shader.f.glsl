#version 300 es
precision mediump float;
precision mediump sampler2D;


in vec4 v_position;
out vec4 outColor;

void main() {
    outColor = vec4(0.7,0.1,0.9,1.0);//v_position;
}
