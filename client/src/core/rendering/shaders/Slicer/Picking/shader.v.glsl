#version 300 es
precision highp float;
precision mediump int;

uniform mat4 u_WorldViewProjection;

in vec4 a_position;
in int a_id;

out vec3 v_position;

flat out int v_id;

void main() {
    v_id = a_id;
    v_position = vec3(a_position);

    gl_Position = u_WorldViewProjection * a_position;
}

