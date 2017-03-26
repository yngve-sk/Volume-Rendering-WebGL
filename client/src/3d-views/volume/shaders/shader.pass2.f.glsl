#version 300 es
precision highp float;
precision highp sampler2D;

#pragma glslify: ext_WorldCoordToTexCoord = require(./modules/world-coord-to-tex-coord.glsl)
#pragma glslify: ProjectedPositionToTexCoord = require(./modules/projection-to-screen.glsl)


uniform sampler2D u_TexCoordToRayOrigin; // Texcoords -> (x,y,z) coords, start point of rays
uniform float viewportWidth;
uniform float viewportHeight;
uniform vec3 u_BoundingBoxNormalized;

in vec4 v_projected_position;
in vec4 v_bbPosition;


out vec4 outColor;


void main() {
    // Transform from [-1,1] to [0,1]
    vec2 texCoord = ProjectedPositionToTexCoord(v_projected_position);
//    vec2 texCoord = vec2(
//        ((v_projected_position.x / v_projected_position.w) + 1.0 ) / 2.0,
//        ((-1.0*v_projected_position.y / v_projected_position.w) + 1.0 ) / 2.0
//    );

    vec4 frontPos = texture(u_TexCoordToRayOrigin, texCoord); //vec2(xNormalized, yNormalized));

    vec3 backfaceGridPos = ext_WorldCoordToTexCoord(v_bbPosition.xyz, u_BoundingBoxNormalized);

    vec4 ray = vec4(backfaceGridPos,1.0) - frontPos;
    float length = length(ray.xyz);
    vec3 rayNormalized = normalize(ray.xyz);

    outColor = vec4(rayNormalized, length);
    //outColor = vec4(backfaceGridPos, 1.0);
    //outColor = frontPos; // OK!
    // TEST, render the front face onto back face, should appear as front facing
}
