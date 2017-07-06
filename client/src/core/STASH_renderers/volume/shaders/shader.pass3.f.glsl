#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp isampler3D; // Ints

#pragma glslify: ext_ProjectedPositionToTexCoord = require(./modules/projection-to-screen.glsl)
#pragma glslify: ext_WorldCoordToTexCoord = require(./modules/world-coord-to-tex-coord.glsl)

uniform sampler2D u_TexCoordToRayDirection; // Texcoords -> (x,y,z) coords, start point of rays
uniform sampler2D u_TexCoordToRayEndPoints;
uniform isampler3D u_ModelXYZToIsoValue; // Texcoords -> (x,y,z) coords, start point of rays
//uniform sampler3D u_ModelXYZToGradientMagnitude;

uniform sampler2D u_IsoValueToColorOpacity;
uniform sampler2D u_TexCoordToRayOrigin;

uniform float u_viewportWidth;
uniform float u_viewportHeight;
uniform vec3 u_Spacing;
uniform vec3 u_BoundingBoxNormalized;

uniform float u_OpacityStopThreshold; // Opacity threshold
uniform int u_Steps; // The number of steps for each ray to traverse the entire volume
uniform float u_AlphaCorrection;

const int MAX_STEPS = 887;

in vec4 v_position; // Same as ray start position
in vec4 v_projected_position;

out vec4 outColor;

float getNormalizedIsovalue(vec3 modelPosition) {
  vec3 gridPosition = ext_WorldCoordToTexCoord(modelPosition, u_BoundingBoxNormalized);
  int iso = int(texture(u_ModelXYZToIsoValue, modelPosition).r);
  return float(iso) / 32736.0;
}


void main() {
  // Transform from [-1,1] to [0,1]
  vec2 texCoord = ext_ProjectedPositionToTexCoord(v_projected_position);

  vec4 backfaceGridPos = texture(u_TexCoordToRayEndPoints, texCoord);
  vec3 frontFaceGridPos = ext_WorldCoordToTexCoord(v_position.xyz, u_BoundingBoxNormalized);
  vec4 theDirection = vec4((backfaceGridPos.xyz - frontFaceGridPos).xyz, 1.0); // Should be right

  // 1. Look up ray direction & magnitude from tex coord
  vec4 ray = texture(u_TexCoordToRayDirection, texCoord);

  vec3 rayDirectionNormalized = normalize(theDirection.xyz);
  float rayMagnitude = ray.a;

  // 2. Start ray casting from pos, blend in alpha and such, output target is texture
  float delta = 1.0/float(u_Steps); // OK!
  vec3 deltaRay = delta * rayDirectionNormalized;

  vec3 currentPos = frontFaceGridPos;//(v_position.xyz + vec3(1.0))/2.0; // [-1,1] -> [0,1]

  float accumulatedAlpha = 0.0;
  vec3 accumulatedColor = vec3(0.0);
  float accumulatedLength = 0.0;

  float alphaScaleFactor = 25.6 * delta;

  float isovalue; // normalized
  float isovalueNormalized; // OK!


  float gradientMagnitude;


  vec3 color;
  highp float alpha;
  vec4 isoRGBA;




//  for(int i = 0; i < u_Steps; i++) {
  for(int i = 0; i < MAX_STEPS; i++) {
    //vec2 isoAndGradientMag = getIsovalueAndGradientMagnitude(currentPos);
    isovalue = getNormalizedIsovalue(currentPos);
    //gradientMagnitude = isoAndGradientMag.g;

    // find color&Opacity via TF
    isoRGBA = texture(u_IsoValueToColorOpacity, vec2(isovalue, 0.5));

    alpha = isoRGBA.a * u_AlphaCorrection * alphaScaleFactor;
    color = isoRGBA.rgb;
    //
    //alpha *= (1.0 - accumulatedAlpha);
    //alpha *= alphaScaleFactor;

    // Accumulate color and opacity
    //accumulatedColor += color * alpha;
    //accumulatedAlpha += alpha;

    accumulatedColor = accumulatedColor + (1.0 - accumulatedAlpha) * alpha * color;
    accumulatedAlpha = accumulatedAlpha + (1.0 - accumulatedAlpha) * alpha;

    // Increment step & accumulated length
    currentPos += deltaRay;
    accumulatedLength += delta;

    // Stop if opacity reached
    if(accumulatedLength >= 1.8*rayMagnitude ||accumulatedAlpha >= 1.0)
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
