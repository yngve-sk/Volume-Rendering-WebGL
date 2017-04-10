#version 300 es
precision highp float;

uniform mat4 u_WorldViewProjection;

in vec4 a_position;
out vec4 v_position;
out vec4 v_projectedPosition;

void main() {
    vec4 projectedPosition = u_WorldViewProjection * a_position;

    v_position = a_position;
    v_projectedPosition = projectedPosition;

    gl_Position = projectedPosition;
}
