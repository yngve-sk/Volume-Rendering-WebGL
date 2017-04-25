#version 300 es
precision mediump float;
precision mediump int;

const vec3 u_DirectionColors[3] = vec3[3](
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0)
);

//DISCARD!

const vec2 u_SelectionModeOpacities = vec2(0.1, 1.0); //[unselected, selected]

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

uniform vec3 u_PickingRayOrigin;
uniform vec3 u_RayDir;

flat in vec4 v_color;

flat in int v_direction;
flat in int v_id;
flat in int v_discardMe;

in vec3 v_position;

out vec4 outColor;

void main() {
    if(v_discardMe == 1)
        discard;

    vec3 myColor = u_DirectionColors[v_direction];

    bool isHighlighted = v_id == u_HighlightID;

    int opacityIndex = isHighlighted ? 1 : 0;

    float myOpacity = u_SelectionModeOpacities[opacityIndex];

    // Debugging only
    vec3 vpos01 = ((v_position / vec3(1.41)) / 2.0) + vec3(0.5);

    vec3 v01 = v_position - u_PickingRayOrigin;
    vec3 v02 = v_position - (u_PickingRayOrigin + 1.41*u_RayDir);
    vec3 v21 = (1.41*u_RayDir);

    float dist = length(cross(v01, v02))/length(v21);

    outColor = vec4(myColor, myOpacity);

    if(dist < 0.08)
        outColor = vec4(0.5,1.0,1.0,1.0);
    //outColor = v_color;
}
