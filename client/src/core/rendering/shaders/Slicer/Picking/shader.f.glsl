#version 300 es
precision highp float;
precision mediump int;

const float MAX_IDS = 255.0;

//uniform vec3 u_PickingRayOrigin;
//uniform vec3 u_RayDir;
//uniform float u_Size;

in vec3 v_position01;
in vec3 v_position;

flat in int v_id;
flat in int v_discardMe;
flat in int v_direction;

out vec4 outColor;

bool isRail() {
    return v_id > 11;
}

float getRailOffset() {
    return v_position01[v_direction];
}

void main() {
    if(v_discardMe == 1)
        discard;

    float r = float(v_id + 1) / 255.0; // offset it by 1 to avoid having 0 be highlighted by default.
    float g = 0.0;

    if(isRail()) {
        g = getRailOffset();
    }

/* // Debug only, will show mouse loc @ output
    vec3 vpos01 = ((v_position / vec3(u_Size)) / 2.0) + vec3(0.5);

    vec3 v01 = v_position - u_PickingRayOrigin;
    vec3 v02 = v_position - (u_PickingRayOrigin + u_Size*u_RayDir);
    vec3 v21 = (u_Size*u_RayDir);

    float dist = length(cross(v01, v02))/length(v21);
*/


    // Encode ID into the red component
    outColor = vec4(r,g,0.0,1.0);

    // DEBUG ONLY!!!
    //if(dist < 0.08)
    //    outColor = vec4(0.5,1.0,1.0,1.0);

}
