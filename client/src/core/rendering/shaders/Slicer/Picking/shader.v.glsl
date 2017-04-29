#version 300 es
precision highp float;
precision mediump int;

#pragma glslify: Model2NormalizedBBCoord_0_to_1 = require(../../GLSLShared/Model2NormalizedBBCoord_0_to_1.glsl)

uniform mat4 u_WorldViewProjection;
uniform float u_SliceOffsets[6]; // [x1,x2,y1,y2,z1,z2]
uniform float u_Size;
uniform int u_ActiveDragRailID;

in vec4 a_position;
in int a_id;
in int a_direction;

out vec3 v_position01;
out vec3 v_position;

flat out int v_id;
flat out int v_discardMe;
flat out int v_direction;

bool isSlice() {
    return 0 <= a_id && a_id <= 5;
}

vec3 translateSlice() {
    float offset01 = u_SliceOffsets[a_id]; // Start pos: [-size/2, -size/2, -size/2]
    float offset = offset01 * u_Size; // [0,1] -> [-size/2, size/2]

    if(a_id < 2) // X, YZ plane, i.e translate along X-axis
        return vec3(offset, 0.0, 0.0);
    else if(a_id < 4) // Y, XZ plane, translate along Y axis
        return vec3(0.0, offset, 0.0);
    else // Z, XY plane, translate along Z axis
        return vec3(0.0, 0.0, offset);
}


void main() {
    v_id = a_id;
    v_direction = a_direction;
    v_position01 = Model2NormalizedBBCoord_0_to_1(a_position.xyz, vec3(u_Size));

    if(u_ActiveDragRailID > 11 && u_ActiveDragRailID != a_id) {
        v_discardMe = 1;
    }

    if(isSlice()) { // Slice, then displace by offset.

        if(u_SliceOffsets[a_id] < 0.0) {
            v_discardMe = 1;
        } else {
            vec3 translateByOffset = translateSlice();

            vec4 tpos = a_position + vec4(translateByOffset, 0.0);

            gl_Position = u_WorldViewProjection * tpos;
            v_position = vec3(tpos);
        }
    }
    else {
        gl_Position = u_WorldViewProjection * a_position;
        v_position = vec3(a_position);
    }
}

