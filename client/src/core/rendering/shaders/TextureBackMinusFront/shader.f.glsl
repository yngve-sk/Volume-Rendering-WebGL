#version 300 es
precision mediump float;
precision mediump sampler2D;

#pragma glslify: Proj2ScreenCoords_0_to_1 = require(../GLSLShared/Proj2ScreenCoords_0_to_1.glsl)

uniform sampler2D u_TexCoordToRayOrigin;

in vec4 v_gridPosition;
in vec4 v_projPosition;

out vec4 outColor;

void main() {

    vec2 screenCoord = Proj2ScreenCoords_0_to_1(v_projPosition);
    //outColor = vec4(screenCoord, 0.5, 1.0);//
    vec3 backPosRGB = texture(u_TexCoordToRayOrigin, screenCoord).rgb;
    vec3 frontPosRGB = v_gridPosition.rgb;

    vec3 front2back = backPosRGB - frontPosRGB;

    outColor = vec4(front2back, 1.0); //v_position;
}
