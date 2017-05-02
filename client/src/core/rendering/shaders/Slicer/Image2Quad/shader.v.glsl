#version 300 es

precision highp float;

#pragma glslify: Proj2ScreenCoords_0_to_1 = require(../../GLSLShared/Proj2ScreenCoords_0_to_1.glsl)

in vec4 a_position;
out vec2 v_screenPosition;


void main() {
    v_screenPosition = Proj2ScreenCoords_0_to_1(vec4(a_position.xyz, 1.0));

    gl_Position = a_position;
}

