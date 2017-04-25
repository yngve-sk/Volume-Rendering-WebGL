#version 300 es
precision mediump float;
precision mediump int;

const int NONE = -1;
const int BB_FACE = 0;
const int RAIL = 1;
const int QUAD = 2;

const int X_DIR = 0;
const int Y_DIR = 1;
const int Z_DIR = 2;

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
// 2 = quad
*/
uniform int u_HighlightID;
uniform float u_QuadOffsets[6]; // [x1,x2,y1,y2,z1,z2]
uniform int u_QuadOffsetIndices[6]; // [0,5] id(index) -> offset index [0,5]
// If offset index is -1, means it is not in use at the moment
// quad id is from 0 to 5

in vec4 a_position;
//in int a_type;
in int a_direction;
in int a_id; // id of BB face / rail / quad,
//NOTE: max 6 quads, id in range [0,5]

//out int v_direction;
flat out vec4 v_color; // calc color here! No interpolation needed (nor allowed in glsl es3)
flat out int v_direction;
flat out int v_id;
flat out int v_discardMe;
out vec3 v_position;

bool isQuad(int id) {
    return 0 <= id && id <= 5;
}

bool isFace(int id) {
    return 6 <= id && id <= 11;
}

mat4 displaceQuad(int id) {
    int offsetIndex = u_QuadOffsetIndices[id];

    if(offsetIndex == -1) {
        // Inactive, discard!
        v_discardMe = 1;
        return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0);
    }

    float offset = u_QuadOffsets[offsetIndex];

    if(id < 2) // X, YZ plane, i.e translate along X-axis
        return mat4(
            1.0, 0.0, 0.0, offset,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        );
    else if(id < 4) // Y, XZ plane, translate along Y axis
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

void main() {
    v_direction = a_direction;
    v_id = a_id;
    v_position = vec3(a_position);

    v_discardMe = 0; // default: do not discard the quad

    // 2. Set position
    if(isQuad(a_id)) { // Quad, then displace by offset.
        mat4 displaceByOffset = displaceQuad(a_id);
        gl_Position = u_WorldViewProjection * displaceByOffset * a_position;
    } else if(isFace(a_id)) {
        //v_discardMe = 1; // hide faces
        gl_Position = u_WorldViewProjection * a_position;
    }
      else {
        gl_Position = u_WorldViewProjection * a_position;
    }
}

