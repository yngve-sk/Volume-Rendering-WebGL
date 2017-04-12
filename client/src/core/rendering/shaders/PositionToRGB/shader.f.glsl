#version 300 es
precision mediump float;

#pragma glslify: World2NormalizedBBCoord_0_to_1 = require(../GLSLShared/World2NormalizedBBCoord_0_to_1.glsl)

//in vec4 v_bbPosition;
//uniform vec3 u_BoundingBoxNormalized;

out vec4 outColor;

void main() {
    //vec3 gridCoord3D_0_to_1 = World2NormalizedBBCoord_0_to_1(
    //    v_bbPosition.xyz,
    //    u_BoundingBoxNormalized
    //);

    outColor = vec4(0.8,0.8,0.8,1.0);//vec4(gridCoord3D_0_to_1, 1.0);
}
