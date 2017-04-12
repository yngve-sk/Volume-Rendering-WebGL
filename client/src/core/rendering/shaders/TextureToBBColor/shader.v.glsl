#version 300 es
precision mediump float;

uniform mat4 u_WorldViewProjection;
uniform vec3 u_BoundingBoxNormalized;
uniform float u_AspectRatio;

in vec4 a_position;
out vec4 v_projPosition;

void main() {

    vec4 projPos = (u_WorldViewProjection * a_position);
    projPos.x /= u_AspectRatio;

    v_projPosition = projPos;

    gl_Position = projPos;//vec4(projPos.x/u_AspectRatio, projPos.y, projPos.z, projPos.w);
}
