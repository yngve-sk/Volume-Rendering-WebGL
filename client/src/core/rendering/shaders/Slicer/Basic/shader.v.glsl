#version 300 es
precision highp float;
precision mediump int;

/*
const int NONE = -1;
const int BB_FACE = 0;
const int RAIL = 1;
const int Slice = 2;

const int X_DIR = 0;
const int Y_DIR = 1;
const int Z_DIR = 2;
*/

uniform mat4 u_WorldViewProjection;

// TODO make into uniforms
const vec3 u_DirectionColors[3] = vec3[3](
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0)
);

//DISCARD!

const vec2 u_SelectionModeOpacities = vec2(0.5, 1.0); //[unselected, selected]

/*
uniform int u_HighlightedType; // -1, 0, 1 or 2
// -1 = NONE
// 0 = BB face
// 1 = rail
// 2 = Slice
*/
uniform float u_Size;
uniform int u_HighlightID;
uniform float u_SliceOffsets[6]; // [x1,x2,y1,y2,z1,z2]
//uniform int u_SliceOffsetIndices[6]; // [0,5] id(index) -> offset index [0,5]
// If offset index is -1, means it is not in use at the moment
// Slice id is from 0 to 5

in vec4 a_position;
//in int a_type;
in int a_direction;
in int a_id; // id of BB face / rail / Slice,
//NOTE: max 6 Slices, id in range [0,5]

//out int v_direction;
flat out vec4 v_color; // calc color here! No interpolation needed (nor allowed in glsl es3)
flat out int v_direction;
flat out int v_id;
flat out int v_discardMe;
out vec3 v_position;

bool isSlice() {
    return 0 <= a_id && a_id <= 5;
}

bool isFace() {
    return 6 <= a_id && a_id <= 11;
}


// Slice base position is always at the most negative coord allowed on respective axis
/*
mat4 displaceSlice() {
    //int offsetIndex = u_SliceOffsetIndices[id];


    // Assume start pos is [0,0,0]
    float offset01 = u_SliceOffsets[a_id]; // Start pos: [-size/2, -size/2, -size/2]
    float offset = offset01; // [0,1] -> [-size/2, size/2]

    if(a_id < 2) // X, YZ plane, i.e translate along X-axis
        return mat4(
            1.0, 0.0, 0.0, offset,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        );
    else if(a_id < 4) // Y, XZ plane, translate along Y axis
        return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, offset,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        );
    else // Z, XY plane, translate along Z axis
        return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, offset,
            0.0, 0.0, 0.0, 1.0
        );
}
*/

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
    v_direction = a_direction;
    v_id = a_id;
    v_discardMe = 0; // default: do not discard the Slice

    // 2. Set position
    if(isSlice()) { // Slice, then displace by offset.

        if(u_SliceOffsets[a_id] < 0.0) {
            v_discardMe = 1;
        } else {
/*
            mat4 displaceByOffset = displaceSlice();
*/
            vec3 translateByOffset = translateSlice();

            vec4 tpos = a_position + vec4(translateByOffset, 0.0);

            gl_Position = u_WorldViewProjection * tpos;
            v_position = vec3(tpos);

            //gl_Position = u_WorldViewProjection * displaceByOffset * a_position;
            //v_position = vec3(displaceByOffset * a_position);
        }

    } else if(isFace() && u_HighlightID != a_id) {
        v_discardMe = 1; // hide faces
/*
        gl_Position = u_WorldViewProjection * a_position;
        v_position = vec3(a_position);
*/
    }
    else {
        gl_Position = u_WorldViewProjection * a_position;
        v_position = vec3(a_position);
    }
}

