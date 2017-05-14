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
uniform vec3 u_GradientDelta;
uniform float u_AlphaCorrectionExponent; // Calculate it @ CPU
uniform float u_SamplingRate;
uniform ivec2 u_IsoMinMax;
//uniform vec3 u_ViewDir;

uniform float u_GMagWeighting;
uniform float u_OverallOpacity;

uniform float u_kA;  // Ambient
uniform float u_kD; // Diffuse
uniform float u_kS; // Specular
uniform float u_n; // Specular exponent
uniform float u_Il; // light intensity
uniform vec3 u_lightDir; // direction

uniform float u_gradientMagnitudeLightingThreshold;
uniform vec2 u_isovalueLightingRange;

uniform vec3 u_viewDir;
uniform float u_belowGMagLightThresholdOpacityMultiplier;



uniform vec3 u_RayOrigin_M; // [0,1]
uniform vec3 u_RayDirection_M; // [0,1]
uniform float u_RayRadius_M; // [0,1]
uniform bool u_DoRenderRay;

uniform float u_NonSelectedVisibilityMultiplier;


//float u_kA = 0.1;
//float u_kD = 0.2;
//float u_kS = 0.8;
//float u_n = 17.0;
//float u_Il = 0.1;
//vec3 u_lightDir = normalize(vec3(1.0, 1.0, 1.0));
//float u_gradientMagnitudeLightingThreshold = 0.2;

in vec3 v_gridPosition; // Same as ray start position
in vec4 v_projPosition;
in vec2 v_screenCoord;

out vec4 outColor;

const int MAX_STEPS = 1000;

/*bool isWithinRayRange(vec3 modelPosition) {
    vec3 x0 = modelPosition;
    vec3 x1 = u_RayOrigin_M;
    vec3 x2 = x1 + u_RayDirection_M;

    vec3 x2x1 = x2 - x1;
    float len_x2x1 = length(x2x1);

    float dist = length( cross(x0 - x1, x0 - x2) ) / len_x2x1;

    return dist < u_RayRadius_M;
}*/

float isWithinRayRange(vec3 modelPosition) {
    vec3 x0 = modelPosition;
    vec3 x1 = u_RayOrigin_M;
    vec3 x2 = x1 + u_RayDirection_M;

    vec3 x2x1 = x2 - x1;
    float len_x2x1 = length(x2x1);

    float dist = length( cross(x0 - x1, x0 - x2) ) / len_x2x1;

    return u_RayRadius_M - dist;
}

bool isWithinLightingRange(float gmag) {
    //return true;
    bool aboveMin = u_isovalueLightingRange.x <= gmag;
    bool belowMax = gmag <= u_isovalueLightingRange.y;
    //bool aboveMin = u_isovalueLightingRangeMIN <= gmag;
    //bool belowMax = gmag <= u_isovalueLightingRangeMAX;
    return aboveMin && belowMax;
}


bool isWithinMinMax(int isovalue) {
    return u_IsoMinMax.x <= isovalue && isovalue <= u_IsoMinMax.y;
}

float getNormalizedIsovalue(vec3 modelPosition) {
    //vec3 gridPosition = (modelPosition, u_BoundingBoxNormalized);
    int iso = int(texture(u_ModelXYZToIsoValue, modelPosition).r);

    if(isWithinMinMax(iso))
        return float(iso) / 32736.0;
    else
        return -1.0;
}

vec2 getNormalizedIsovalueAndGradientMagnitude(vec3 modelPosition) {
    //vec3 gridPosition = (modelPosition, u_BoundingBoxNormalized);
    ivec2 isoAndGMag = texture(u_ModelXYZToIsoValue, modelPosition).rg;
    int iso = isoAndGMag.r;
    int gmag = isoAndGMag.g;

    float isoN = -1.0;
    float gmagN = 0.0;

    if(!isWithinMinMax(iso))
        return vec2(isoN, gmag);

    isoN = float(iso) / 32736.0;
    gmagN = float(gmag) / 32736.0;

    return vec2(isoN, gmagN);
}

vec3 getGradientAt(vec3 mPos, vec3 d) {
    float left = getNormalizedIsovalue(vec3(mPos.x - d.x, mPos.yz));
    float right = getNormalizedIsovalue(vec3(mPos.x + d.x, mPos.yz));

    float top = getNormalizedIsovalue(vec3(mPos.x, mPos.y + d.y, mPos.z));
    float bottom = getNormalizedIsovalue(vec3(mPos.x, mPos.y - d.y, mPos.z));

    float front = getNormalizedIsovalue(vec3(mPos.xy, mPos.z + d.z));
    float back = getNormalizedIsovalue(vec3(mPos.xy, mPos.z - d.z));

    vec3 gradient = vec3(right - left, top - bottom, front - back);
    return gradient;
}

vec2 calculateLighting(vec3 gradient, float gmag, vec3 halfV) {
    // 1. check if gradient magnitude is below threshold

    // 2. If yes, get normal, if no just return 1
    vec3 gradientN = normalize(-gradient);

    // 3. Get half-vector
    float specularExponent = u_n;

    float ambient = u_kA;
    float diffuse = u_Il * u_kD * abs(dot(u_lightDir, gradientN));
    float specular = u_Il * u_kS * pow(abs(dot(halfV,gradientN)), specularExponent);

    return vec2(ambient + diffuse, specular);
}






void main() {
    // Why not have light direction be at a half angle


    vec3 halfV = normalize(u_viewDir + u_lightDir);
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
    float gmag;

    vec3 gradient;
    vec3 gDelta = u_BoundingBoxNormalized*delta; // gdelta is supposed to be the length of the gradient of a real world sampling grid
    // So... delta is supposed to be one cell of movement in float
    // I.e if grid is 200x300x400 one delta step will be (1/200, 1/300, 1/400) ignore spacing

    vec2 light;
    vec3 color;
    highp float alpha;
    highp float alphaIn;
    vec4 isoRGBA;
    // GRADIENT STEP SIZE TEX
    float alphaCorrection = 0.1;

    // Hardcoded halo for the ray
    vec3 halo = vec3(0.0);
    float haloThreshold = 0.011;
    float haloThresholdDistanceMultiplier = 25.0;

//    for(int i = 0; i < u_Steps; i++) {
    for(int i = 0; i < MAX_STEPS; i++) {
        //vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
/*        if(u_DoRenderRay && !isWithinRayRange(currentPos)) {
            currentPos += deltaRay;
            accumulatedLength += delta;
            continue;
        }*/


        vec2 isoAndGMag = getNormalizedIsovalueAndGradientMagnitude(currentPos);

        isovalue = isoAndGMag.r;//getNormalizedIsovalue(currentPos);
        gmag = isoAndGMag.g;//getGradientAt(currentPos,gDelta);


        if(isovalue == -1.0) {
            currentPos += deltaRay;
            accumulatedLength += delta;
            continue; // Skip isovalue because threshold!
        }


        //gradientMagnitude = isoAndGradientMag.g;

        // find color&Opacity via TF
        isoRGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));

//u_GMagWeighting
//u_OverallOpacity

        //alpha = min(1.0, pow(1.0 + gmag,3.0) * pow(isoRGBA.a, u_AlphaCorrectionExponent));

        float magWeight = (u_OverallOpacity) * pow(gmag, u_GMagWeighting);

      /*  alpha = min(1.0,
                    pow((u_OverallOpacity/100.0) + gmag,(u_GMagWeighting/100.0)) * pow(isoRGBA.a, u_AlphaCorrectionExponent));
      */
        alpha = min(1.0,
                    magWeight * pow(isoRGBA.a, u_AlphaCorrectionExponent));

        /*if(u_DoRenderRay) { // Dim the stuff outside ray by u_NonSelectedVisibilityMultiplier
            if(isWithinRayRange(currentPos)) {
                gradient = getGradientAt(currentPos, gDelta);
                light = 2.0 * calculateLighting(gradient, gmag, halfV);
            } else if(isWithinLightingRange(isovalue)) { // Outside ray but within range
                gradient = getGradientAt(currentPos, gDelta);
                light = 1.0 * calculateLighting(gradient, gmag, halfV);
                alpha *= u_NonSelectedVisibilityMultiplier;
            } else { // Outside ray and outside lighting range
                alpha *= u_NonSelectedVisibilityMultiplier;
            }
        } else if(isWithinLightingRange(isovalue)) {
            gradient = getGradientAt(currentPos, gDelta);
            light = calculateLighting(gradient, gmag, halfV);
        } else {
            // Do nothing
            light = 1.0;
        }*/

        if(isWithinLightingRange(isovalue)) {
            //gradient = getGradientAt(currentPos, gDelta);
            gradient = getGradientAt(currentPos, u_GradientDelta);
            light = calculateLighting(gradient, gmag, halfV);
        } else {
            light = vec2(0.1, 0.0);
        }

        /*if(u_DoRenderRay) {// Distribute alpha only if ray render is enabled
            if(!isWithinRayRange(currentPos)) {
            /*    alpha *= 1.2;
            } else {
                alpha *= u_NonSelectedVisibilityMultiplier;
            }
        }*/

        if(u_DoRenderRay) {// Distribute alpha only if ray render is enabled
            float distFromRay = isWithinRayRange(currentPos);

            // Positive means within, outside means without

            //if(distFromRay >= haloThreshold) {// within range
            if(distFromRay >= 0.0) {// within range
                // do nothing
            } else if(distFromRay < -(haloThreshold + 0.08))  { // Outside range
                alpha *= u_NonSelectedVisibilityMultiplier;
            } else if(distFromRay < -haloThreshold) {
                alpha = 0.0; // Hide the stuff in the area around the ray
            }
            /*else { // Outer silhouette
                //halo = vec3(haloThresholdDistanceMultiplier * (haloThreshold - abs(distFromRay)));
                alpha *= u_NonSelectedVisibilityMultiplier;
            }*/

           /*
            if(!isWithinRayRange(currentPos)) {
                alpha *= 1.2;
            } else {
                alpha *= u_NonSelectedVisibilityMultiplier;
            }   */
        }

        color = min(vec3(1.0),light.x*isoRGBA.rgb + light.y + halo);

        // Accumulate color and opacity
        accumulatedAlpha += alpha;
        accumulatedColor += (1.0 - accumulatedAlpha) * color * alpha;

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
    //if(accumulatedAlpha == 0.0)
    //    discard;

    outColor = vec4(
        min(vec3(1.0), accumulatedColor * accumulatedAlpha),
        min(1.0, accumulatedAlpha)
    );
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
