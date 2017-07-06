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

uniform float u_kA; // Ambient
uniform float u_kD; // Diffuse
uniform float u_kS; // Specular
uniform float u_n; // Specular exponent
uniform float u_Il; // light intensity
uniform vec3 u_lightDir; // direction
uniform float u_gradientMagnitudeLightingThreshold;
uniform vec2 u_isovalueLightingRange;

uniform float u_isovalueLightingRangeMIN;
uniform float u_isovalueLightingRangeMAX;


uniform vec3 u_viewDir;
uniform float u_belowGMagLightThresholdOpacityMultiplier;


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
  float left = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.x - d.x, mPos.yz)).r;
  float right = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.x + d.x, mPos.yz)).r;

  float top = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.x, mPos.y + d.y, mPos.z)).r;
  float bottom = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.x, mPos.y - d.y, mPos.z)).r;

  float front = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.xy, mPos.z + d.z)).r;
  float back = getNormalizedIsovalueAndGradientMagnitude(vec3(mPos.xy, mPos.z - d.z)).r;

  vec3 gradient = vec3(right - left, top - bottom, front - back);
  return gradient;
}

float calculateLighting(vec3 gradient, float gMagnitude, vec3 halfV) {
  vec3 gradientN = normalize(gradient);

  // 3. Get half-vector
  float specularExponent = u_n;

  float ambient = u_kA;
  float diffuse = u_Il * u_kD * dot(u_lightDir, gradientN);
  float specular = u_Il * u_kS * pow(dot(halfV, gradientN), specularExponent);

  return ambient + diffuse + specular;
}

void main() {
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
  vec3 gDelta = u_BoundingBoxNormalized*delta;

  float light;
  vec3 color;
  highp float alpha;
  highp float alphaIn;
  vec4 isoRGBA;

  float alphaCorrection = 0.1;

//  for(int i = 0; i < u_Steps; i++) {
  for(int i = 0; i < MAX_STEPS; i++) {
    //vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
    vec2 isoAndGMag = getNormalizedIsovalueAndGradientMagnitude(currentPos);

    isovalue = isoAndGMag.r;
    gmag = isoAndGMag.g;

    if(isovalue == -1.0) {
      currentPos += deltaRay;
      accumulatedLength += delta;
      continue; // Skip isovalue because threshold!
    }

    //gradientMagnitude = isoAndGradientMag.g;

    // find color&Opacity via TF
    isoRGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));

    alpha = isoRGBA.a * alphaCorrection;


    //if(gmag >= u_gradientMagnitudeLightingThreshold) {
    if(gmag >= u_isovalueLightingRangeMAX) {
//    if(isWithinLightingRange(gmag)) {
      // Calculate lighting
      vec3 gradient = getGradientAt(currentPos, gDelta);
      light = calculateLighting(gradient, gmag, halfV);
    } else {
      light = 1.0;
      alpha *= u_belowGMagLightThresholdOpacityMultiplier;
    }


 /*    if(length(gradient) < u_gradientMagnitudeLightingThreshold) {
      light = 10.0;
      alpha *= u_belowGMagLightThresholdOpacityMultiplier;
    } else {
      light = calculateLighting(gradient);
    }*/

    color = light*isoRGBA.rgb;

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
    if(accumulatedLength >= rayLength ||accumulatedAlpha >= 1.0)
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
  if(accumulatedAlpha == 0.0)
    outColor = vec4(0.0, 0.0, 0.0, 0.0);
  else
    outColor = vec4(accumulatedColor, accumulatedAlpha);
  //outColor = vec4(v_gridPosition, 1.0);
  //outColor = vec4(backfaceGridPos, 1.0);
//  outColor = vec4(ray, 1.0);
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
