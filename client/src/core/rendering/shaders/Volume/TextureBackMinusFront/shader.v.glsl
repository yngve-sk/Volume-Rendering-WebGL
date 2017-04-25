#version 300 es
precision mediump float;

#pragma glslify: Model2NormalizedBBCoord_0_to_1 = require(../../GLSLShared/Model2NormalizedBBCoord_0_to_1.glsl)
#pragma glslify: Proj2ScreenCoords_0_to_1 = require(../../GLSLShared/Proj2ScreenCoords_0_to_1.glsl)

uniform mat4 u_WorldViewProjection;
uniform vec3 u_BoundingBoxNormalized;
uniform float u_AspectRatio;

in vec4 a_position;
out vec3 v_gridPosition; // [0,1] position within the bounding box coords
out vec2 v_screenCoord;

void main() {

    vec3 gridCoord3D_0_to_1 = Model2NormalizedBBCoord_0_to_1(a_position.xyz, u_BoundingBoxNormalized);

    v_gridPosition = gridCoord3D_0_to_1;

    vec4 projPos = (u_WorldViewProjection * a_position);
    projPos.x /= u_AspectRatio;

    v_screenCoord = Proj2ScreenCoords_0_to_1(projPos);


    gl_Position = projPos;
}
