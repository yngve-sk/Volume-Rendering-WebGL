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
uniform vec3 u_SelectedPoints[10]; // max 10 points !!!!
// uniform int u_SelectedPointsDisplayMode; // do not need
uniform float u_SelectedPointsRadius_M; // need
uniform int u_NumSelectedPoints; // need

// World camera coords

in vec3 v_gridPosition; // [0,1] coords too
in vec4 v_projPosition;
//in vec4 v_position; // [-1,1] coords
in vec2 v_screenCoord;

out vec4 outColor;

bool isWithinRayRange(vec3 point, vec3 frontface, vec3 backface) {
  vec3 x0 = point;
  vec3 x1 = frontface;
  vec3 x2 = backface;

  vec3 x2x1 = x2 - x1;
  float len_x2x1 = length(x2x1);

  float dist = length( cross(x0 - x1, x0 - x2) ) / len_x2x1;

  return dist <= u_SelectedPointsRadius_M;
}

void main() {
  vec3 backface = texture(u_TexCoordToRayEndPoint, v_screenCoord).rgb;
  vec3 ray = normalize(backface - v_gridPosition);
  vec3 rayOrigin = v_gridPosition;

  float m = 0.25;

  bool hit = false;
 /*  for(int i = 0; i < 10; i++) {
    hit = isWithinRayRange(u_SelectedPoints[i], rayOrigin, ray);
    if(hit)
      break;
  }*/

  hit = isWithinRayRange(u_SelectedPoints[0], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[1], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[2], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[3], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[4], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[5], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[6], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[7], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[8], rayOrigin, backface);
  hit = hit ||isWithinRayRange(u_SelectedPoints[9], rayOrigin, backface);

  hit = isWithinRayRange(vec3(0.5), rayOrigin, backface);

  if(hit)
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
  else
    outColor = vec4(0.0, 1.0, 0.0, 1.0);

  // outColor = vec4(v_gridPosition, 1.0);
  //outColor = vec4(u_SelectedPoints[u_NumSelectedPoints - 1],1.0);
  //outColor = vec4(float(u_NumSelectedPoints)/10.0);

  //outColor = vec4(0.4,0.5,0.5,1.0);
}
