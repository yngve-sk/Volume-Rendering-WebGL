#version 300 es
precision highp float;

#pragma glslify: ext_WorldCoordToTexCoord = require(./modules/world-coord-to-tex-coord.glsl)

in vec4 v_bbPosition;
uniform vec3 u_BoundingBoxNormalized;

out vec4 outColor;

void main() {
    vec3 gridCoord = ext_WorldCoordToTexCoord(v_bbPosition.xyz, u_BoundingBoxNormalized);
    outColor = vec4(gridCoord, 1.0);
}
