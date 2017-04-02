#version 300 es
precision highp float;

uniform mat4 u_worldViewProjection;

in vec4 a_position;
out vec4 v_position;
out vec4 v_projected_position;

void main() {
    // Displace to fit RGB color space
    vec4 projectedPosition = u_worldViewProjection * a_position;

    v_position = a_position;
    v_projected_position = projectedPosition;

    gl_Position = projectedPosition;
}
