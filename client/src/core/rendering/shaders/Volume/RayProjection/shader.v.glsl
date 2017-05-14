#version 300 es
precision highp float;

#pragma glslify: Model2NormalizedBBCoord_0_to_1 = require(../../GLSLShared/Model2NormalizedBBCoord_0_to_1.glsl)
#pragma glslify: Proj2ScreenCoords_0_to_1 = require(../../GLSLShared/Proj2ScreenCoords_0_to_1.glsl)

uniform mat4 u_WorldViewProjection;
uniform vec3 u_BoundingBoxNormalized;
//uniform float u_AspectRatio;

uniform vec2 u_SliceX;
uniform vec2 u_SliceY;
uniform vec2 u_SliceZ;

in vec4 a_position;
out vec3 v_gridPosition; // [0,1] position within the bounding box coords
out vec2 v_screenCoord;
//out vec3 v_position;

void main() {
    // [0,1] turn into [-1,1] of BB coords]
   // v_position = a_position;

    vec3 sliceMin = vec3(u_SliceX.x, u_SliceY.x, u_SliceZ.x);
    vec3 sliceMax = vec3(u_SliceX.y, u_SliceY.y, u_SliceZ.y);

    // [0,1] -> [-1,1]
    sliceMin *= 2.0;
    sliceMax *= 2.0;

    sliceMin -= vec3(1.0);
    sliceMax -= vec3(1.0);

    sliceMin *= u_BoundingBoxNormalized;
    sliceMax *= u_BoundingBoxNormalized;

    vec3 slicedPos = clamp(a_position.xyz, sliceMin, sliceMax);

//    vec3 gridCoord3D_0_to_1 = Model2NormalizedBBCoord_0_to_1(a_position.xyz, u_BoundingBoxNormalized);
    vec3 gridCoord3D_0_to_1 = Model2NormalizedBBCoord_0_to_1(slicedPos, u_BoundingBoxNormalized);

    v_gridPosition = gridCoord3D_0_to_1;

    vec4 projPos = (u_WorldViewProjection * vec4(slicedPos,1.0));
    //projPos.x /= u_AspectRatio;

    v_screenCoord = Proj2ScreenCoords_0_to_1(projPos);

    gl_Position = projPos;
}

// w/h = w0/h0 = ar => w = h*ar
