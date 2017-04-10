#version 300 es
precision highp float;

uniform mat4 u_worldViewProjection;

in vec4 a_position; // The position of the vertex in space [-1,1]
//out vec4 v_bbPosition;


void main() {
    // Displace to fit RGB color space
    //v_bbPosition = a_position;
    gl_Position = u_worldViewProjection * a_position;
}
