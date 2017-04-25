#version 300 es
precision highp float;
precision mediump int;

const float MAX_IDS = 50.0;

uniform vec3 u_PickingRayOrigin;
uniform vec3 u_RayDir;

flat in int v_id;
in vec3 v_position;

out vec4 outColor;

void main() {

    float r = float(v_id) / MAX_IDS;

    vec3 vpos01 = ((v_position / vec3(1.41)) / 2.0) + vec3(0.5);

    vec3 v01 = v_position - u_PickingRayOrigin;
    vec3 v02 = v_position - (u_PickingRayOrigin + 1.41*u_RayDir);
    vec3 v21 = (1.41*u_RayDir);

    float dist = length(cross(v01, v02))/length(v21);


    // Encode ID into the red component
    outColor = vec4(r,0.0,0.0,1.0);

    if(dist < 0.08)
        outColor = vec4(0.5,1.0,1.0,1.0);

}
