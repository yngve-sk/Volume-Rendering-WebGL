#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp isampler3D; // Ints

#pragma glslify: Proj2ScreenCoords_0_to_1 = require(../GLSLShared/Proj2ScreenCoords_0_to_1)
#pragma glslify: World2NormalizedBBCoord_0_to_1 = require(../GLSLShared/World2NormalizedBBCoord_0_to_1)

uniform sampler2D u_TexCoordToRayOrigin;
uniform sampler2D u_TexCoordToRayEndPoint;

uniform isampler3D u_ModelXYZToIsoValue; // Texcoords -> (x,y,z) coords, start point of rays
uniform sampler2D u_IsoValueToColorOpacity;

uniform vec3 u_BoundingBoxNormalized;
uniform float u_AlphaCorrectionExponent; // Calculate it @ CPU
uniform float u_SamplingRate;

in vec4 v_position; // Same as ray start position
in vec4 v_projectedPosition;

out vec4 outColor;

const int MAX_STEPS = 1000;

float getNormalizedIsovalue(vec3 modelPosition) {
    vec3 gridPosition = World2NormalizedBBCoord_0_to_1(modelPosition, u_BoundingBoxNormalized);
    int iso = int(texture(u_ModelXYZToIsoValue, modelPosition).r);
    return float(iso) / 32736.0;
}


void main() {
    // Transform from [-1,1] to [0,1]
    vec2 texCoord = Proj2ScreenCoords_0_to_1(v_projectedPosition);

    vec3 backfaceGridPos = texture(u_TexCoordToRayEndPoint, texCoord).xyz;
    vec3 frontFaceGridPos = World2NormalizedBBCoord_0_to_1(v_position.xyz, u_BoundingBoxNormalized);
    vec3 front2Back = (backfaceGridPos.xyz - frontFaceGridPos);

    float rayLength = length(front2Back);
    vec3 ray = normalize(front2Back);

    float delta = u_SamplingRate;

    // 2. Start ray casting from pos, blend in alpha and such, output target is texture
    vec3 deltaRay = delta * ray;

    vec3 currentPos = frontFaceGridPos;//(v_position.xyz + vec3(1.0))/2.0; // [-1,1] -> [0,1]

    float accumulatedAlpha = 0.0;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedLength = 0.0;

    float isovalue; // normalized
    float isovalueNormalized; // OK!


    vec3 color;
    highp float alpha;
    highp float alphaIn;
    vec4 isoRGBA;


//    for(int i = 0; i < u_Steps; i++) {
    for(int i = 0; i < MAX_STEPS; i++) {
        //vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
        isovalue = getNormalizedIsovalue(currentPos);
        //gradientMagnitude = isoAndGradientMag.g;

        // find color&Opacity via TF
        isoRGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));

        alpha = isoRGBA.a;
        color = isoRGBA.rgb;
        //
        //alpha *= (1.0 - accumulatedAlpha);
        //alpha *= alphaScaleFactor;

        // Accumulate color and opacity
        //accumulatedColor += color * alpha;
        //accumulatedAlpha += alpha;

        alphaIn = isoRGBA.a;
        alphaIn = 1.0 - pow((1.0 - accumulatedAlpha), u_AlphaCorrectionExponent);

        accumulatedColor = accumulatedColor + (1.0 - accumulatedAlpha) * alpha * color;
        accumulatedAlpha = accumulatedAlpha + (1.0 - accumulatedAlpha) * alpha;

        // Increment step & accumulated length
        currentPos += deltaRay;
        accumulatedLength += delta;

        // Stop if opacity reached
        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0)
            break;
    }

    vec3 isovalueLookup = currentPos - vec3(0.5);
    ///vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
    //isovalue = isoAndGradientMag.r;
    vec4 colorTest = texture(u_IsoValueToColorOpacity, vec2(currentPos.x,0));
    vec3 colorTestRGB = colorTest.rgb;
    float colorTestA = colorTest.a;


    outColor = vec4(accumulatedColor, accumulatedAlpha); // Block...

    //outColor = theDirection;
    //outColor = vec4(texture(u_TexCoordToRayDirection, texCoord).rgb, 1.0);
    //outColor = v_position + vec4(0.5,0.5,0.5,0);
    //outColor = normalize(theDirection);
    //outColor = backface;

    //outColor = colorTest;
    //outColor = texture(u_TexCoordToRayOrigin, texCoord); // WORKS!!!
    //outColor = isohalfRGBA;
    //outColor = vec4(vec3(isovalueNormalized),1); // WORKS!
    //outColor = vec4(xNormalized, yNormalized, 0.5, 1);
    //outColor = vec4(1,1,1,1);
    //outColor = vec4(0.3,0.4,0.2,1);
    //outColor = v_position + vec4(0.5,0.5,0.5,0);
    //outColor = isovalue;
    //outColor = vec4(colorTestRGB, 1);
    //outColor = vec4(rayDirectionNormalized,1);
}
