#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_VolumeImageTexture;

in vec2 v_screenPosition;
out vec4 outColor;

void main() {

    vec4 texColor = texture(u_VolumeImageTexture, v_screenPosition);

    outColor = vec4(texColor.xyz,1.0);
}
