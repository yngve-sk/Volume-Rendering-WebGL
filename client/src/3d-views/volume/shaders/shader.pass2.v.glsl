#version 300 es
precision highp float;

uniform mat4 u_worldViewProjection;

in vec4 a_position;
out vec4 v_bbPosition;
out vec4 v_projected_position;


void main() {
    // Displace to fit RGB color space
    v_bbPosition = a_position; //vec4( ((vec3(a_position) + vec3(1.0)) / 2.0),1.0);
    vec4 projected_position = u_worldViewProjection * a_position;
    v_projected_position = projected_position; //+ vec4(0.5,0.5,0.5,0.0);
    gl_Position = projected_position;
}
