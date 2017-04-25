#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D u_TexCoordToRayEndPoint;

in vec3 v_gridPosition;
in vec2 v_screenCoord;

out vec4 outColor;

void main() {

    vec3 backPosRGB = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;
    vec3 front2back = backPosRGB - v_gridPosition;

    outColor = vec4(front2back, 1.0);
}
