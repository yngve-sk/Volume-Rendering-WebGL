#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp isampler3D; // Ints

//uniform sampler2D u_TexCoordToRayOrigin;
uniform sampler2D u_TexCoordToRayEndPoint;

uniform isampler3D u_ModelXYZToIsoValue; // Texcoords -> (x,y,z) coords, start point of rays
uniform sampler2D u_IsoValueToColorOpacity;

uniform vec3 u_BoundingBoxNormalized;
uniform float u_AlphaCorrectionExponent; // Calculate it @ CPU
uniform float u_SamplingRate;
uniform ivec2 u_IsoMinMax;
//uniform vec3 u_ViewDir;

uniform vec3 u_viewDir;
uniform float u_belowGMagLightThresholdOpacityMultiplier;

// World coordinates, unprojected cam coordinates
uniform vec3 u_RayOrigin_M; // [0,1]
uniform vec3 u_RayDirection_M; // [0,1]
uniform float u_RayRadius_M; // [0,1]
uniform vec3 u_Eye_M; // [0,1]

uniform bool u_IsOrtho;
uniform vec3 u_OrthoPlaneNormal; // If ortho this is the eye-direction

// World camera coords

in vec3 v_gridPosition; // [0,1] coords too
in vec4 v_projPosition;
//in vec4 v_position; // [-1,1] coords
in vec2 v_screenCoord;

out vec4 outColor;

float getDistanceV3() {
    return 0.0;
/*    vec3 a0 = u_RayOrigin_M;
    vec3 a1 = u_RayOrigin_M + 1.4 * u_RayDirection_M;

    vec3 backface = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;

    vec3 b0 = v_gridPosition;
    vec3 b1 = backface;

    // Do clamping on B, let A be infinite
    vec3 A = normalize(a1 - a0);
    vec3 B = normalize(b1 - b0);

    vec3 crossAB = cross(A, B);
    float denom = pow(length(cross),2.0);

    // Clamp A0, B0, B1

    // parallel
    if(denom == 0.0) {
        float d0 = dot(A, (b0 - a0));
        float d1 = dot(A, (b1 - a0));

        if(
            (d0 <= 0.0 && 0.0 >= d1) &&
            (abs(d0) < abs(d1))
        ) {
            return length(a0 - b0);
        }

        return length(d0 * A + a0 - b0);
    }

    vec3 t = b0 - a0;


    return null;*/
}

float getDistanceV2() {
    vec3 a0 = u_RayOrigin_M;
    vec3 a1 = u_RayOrigin_M + 1.4 * u_RayDirection_M;

    vec3 backface = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;

    vec3 b0 = v_gridPosition;
    vec3 b1 = backface;

    vec3 v1 = normalize(a1 - a0);
    vec3 v2 = normalize(b1 - b0);

    vec3 v1xv2 = cross(v1, v2);

    float len = length(v1xv2);

    if(len == 0.0)
        return length(b0 - a0); // Parallel, return dist between start points

    float v1xv2_dot_a0b0 = dot(v1xv2, (a0 - b0));

    if(v1xv2_dot_a0b0 == 0.0)
        return 0.0;

    return v1xv2_dot_a0b0 / len;

}

float getDistance() { // calculate it in projection space maybe?
    // Then use only X and Y coords , and check distance between:
    //

    vec3 origin1;
    vec3 ray1;

    vec3 backface = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;

    ray1 = normalize(backface - v_gridPosition);
    origin1 = v_gridPosition;

    vec3 origin2 = u_RayOrigin_M;
    vec3 ray2 = u_RayDirection_M;

    vec3 o1_minus_o2 = origin1 - origin2;
    vec3 r1_cross_r2 = cross(ray1, ray2);
    float len = length(r1_cross_r2);

    if(len == 0.0)
        return 0.0;

    return dot(r1_cross_r2, o1_minus_o2)/len;
}


void main() {

    if(getDistanceV2() <= 0.05)//u_RayRadius_M)
        outColor = vec4(0.2, 0.2, 0.8, 1.0);
    else
        outColor = vec4(0.0, 0.0, 0.0, 1.0);

    /*
    if(length(v_gridPosition - u_RayOrigin_M) < 0.5)
        outColor = vec4(0.5,0.2,0.5,1.0);
    else
        outColor = vec4(0.1, 0.1, 1.0, 1.0);

    float dist = length((v_gridPosition - u_RayOrigin_M));

    if(dist < 0.1) {
        outColor = vec4(0.2, 0.2, 0.8, 1.0);
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }*/
}
