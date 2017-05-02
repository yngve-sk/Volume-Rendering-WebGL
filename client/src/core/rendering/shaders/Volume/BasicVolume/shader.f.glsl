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

in vec3 v_gridPosition; // Same as ray start position
in vec4 v_projPosition;
in vec2 v_screenCoord;

out vec4 outColor;

const int MAX_STEPS = 1000;

bool isWithinMinMax(int isovalue) {
    return u_IsoMinMax.x <= isovalue && isovalue <= u_IsoMinMax.y;
}

float getNormalizedIsovalue(vec3 modelPosition) {
    //vec3 gridPosition = (modelPosition, u_BoundingBoxNormalized);
    int iso = int(texture(u_ModelXYZToIsoValue, modelPosition).r);

    //if(isWithinMinMax(iso))
        return float(iso) / 32735.0;
    //else
    //    return -1.0;
}


void main() {
    vec3 backfaceGridPos = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;
    vec3 front2Back = (backfaceGridPos - v_gridPosition);

    float rayLength = length(front2Back);
    vec3 ray = normalize(front2Back);

    float delta = u_SamplingRate;
    vec3 deltaRay = delta * ray;

    vec3 currentPos = v_gridPosition;

    float accumulatedAlpha = 0.0;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedLength = 0.0;

    float isovalue; // normalized

    vec3 color;
    highp float alpha;
    highp float alphaIn;
    vec4 isoRGBA;

    float alphaCorrection = 0.1;

//    for(int i = 0; i < u_Steps; i++) {
    for(int i = 0; i < MAX_STEPS; i++) {
        //vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
        isovalue = getNormalizedIsovalue(currentPos);
        if(isovalue == -1.0)
            continue; // Skip isovalue because threshold!
        //gradientMagnitude = isoAndGradientMag.g;

        // find color&Opacity via TF
        isoRGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));

        alpha = isoRGBA.a * alphaCorrection;
        color = isoRGBA.rgb;

        // Accumulate color and opacity
        accumulatedColor += (1.0 - accumulatedAlpha) * color * alpha;
        accumulatedAlpha += alpha;

        //alphaIn = isoRGBA.a;
        //alphaIn = 1.0 - pow((1.0 - accumulatedAlpha), u_AlphaCorrectionExponent);

        //accumulatedColor = accumulatedColor + (1.0 - accumulatedAlpha) * alpha * color;
        //accumulatedAlpha = accumulatedAlpha + (1.0 - accumulatedAlpha) * alpha;

        // Increment step & accumulated length
        currentPos += deltaRay;
        accumulatedLength += delta;

        // Stop if opacity reached
        if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0)
            break;
    }

    //vec3 isovalueLookup = currentPos - vec3(0.5);
    /////vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
    ////isovalue = isoAndGradientMag.r;
    //vec4 colorTest = texture(u_IsoValueToColorOpacity, vec2(currentPos.x,0));
    //vec3 colorTestRGB = colorTest.rgb;
    //float colorTestA = colorTest.a;

    ///isovalue = getNormalizedIsovalue(v_gridPosition);
    /////float alph = iso2RGBA.a;
    ///
    ///alpha = texture(u_IsoValueToColorOpacity, vec2(0.5,0.5)).a;
    ///isovalue = getNormalizedIsovalue(vec3(v_gridPosition.xy, alpha));
    ///
    ///vec4 iso2RGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));
///

    outColor = vec4(accumulatedColor, accumulatedAlpha);
    //outColor = vec4(v_gridPosition, 1.0);
    //outColor = vec4(backfaceGridPos, 1.0);
//    outColor = vec4(ray, 1.0);
    //outColor = iso2RGBA;
    //outColor = vec4(vec3(alph),1.0);
    //outColor = vec4(vec3(isovalue/2.0),1.0);
    //outColor = vec4(texture(u_IsoValueToColorOpacity, vec2(0.2, 0.5)).rg, 0.5, 1.0);
    //outColor = vec4(backfaceGridPos, 1.0);

    //outColor = theDirection;
    //outColor = vec4(texture(u_TexCoordToRayDirection, texCoord).rgb, 1.0);
    //outColor = v_gridPosition + vec4(0.5,0.5,0.5,0);
    //outColor = normalize(theDirection);
    //outColor = backface;

    //outColor = colorTest;
    //outColor = texture(u_TexCoordToRayOrigin, texCoord); // WORKS!!!
    //outColor = isohalfRGBA;
    //outColor = vec4(vec3(isovalueNormalized),1); // WORKS!
    //outColor = vec4(xNormalized, yNormalized, 0.5, 1);
    //outColor = vec4(1,1,1,1);
    //outColor = vec4(0.3,0.4,0.2,1);
    //outColor = v_gridPosition + vec4(0.5,0.5,0.5,0);
    //outColor = isovalue;
    //outColor = vec4(colorTestRGB, 1);
    //outColor = vec4(rayDirectionNormalized,1);
}
