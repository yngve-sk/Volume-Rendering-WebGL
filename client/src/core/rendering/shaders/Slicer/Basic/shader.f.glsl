#version 300 es
precision highp float;

const vec3 u_DirectionColors[3] = vec3[3](
  vec3(0.3, 0.4, 0.0),
  vec3(0.0, 0.3, 0.4),
  vec3(0.4, 0.0, 0.3)
);

const vec3 u_SliceColors[6] = vec3[6](
  vec3(0.3, 0.4, 0.0),
  vec3(0.3, 0.4, 0.0),
  vec3(0.0, 0.3, 0.4),
  vec3(0.0, 0.3, 0.4),
  vec3(0.4, 0.0, 0.3),
  vec3(0.4, 0.0, 0.3)
);



//DISCARD!

const vec2 u_SelectionModeOpacities = vec2(0.1, 1.0); //[unselected, selected]

/*
uniform int u_HighlightedType; // -1, 0, 1 or 2
// -1 = NONE
// 0 = BB face
// 1 = rail
// 2 = quad
*/
uniform int u_HighlightID;
uniform float u_SliceOffsets[6]; // [x1,x2,y1,y2,z1,z2]
uniform int u_QuadOffsetIndices[6]; // [0,5] id(index) -> offset index [0,5]
uniform float u_Size;

uniform vec3 u_PickingRayOrigin;
uniform vec3 u_RayDir;
uniform vec3 u_IntersectionPointDebug;
uniform ivec2 u_DraggedSliceIndices;

flat in vec4 v_color;

flat in int v_direction;
flat in int v_id;
flat in int v_discardMe;

in vec3 v_position;

out vec4 outColor;

bool isSlice() {
  return 0 <= v_id && v_id <= 5;
}

bool isFace() {
  return 6 <= v_id && v_id <= 11;
}

/*vec2 calculateLighting(vec3 gradient, float gmag, vec3 halfV) {
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

vec3 getNormal() {
  // 0 = x, 1 = y, 2 = z
  // Cross eye with direction vec to get an approx
  if(v_direction == 0) {

  } else if(v_direction == 1) {

  } else {

  }
  vec3 normal = normalize(cross())
}*/

void main() {
  if(v_discardMe == 1)
    discard;

  vec3 myColor = u_DirectionColors[v_direction];

  if(isFace()) {
    myColor = u_SliceColors[v_id - 6];
  }

  bool isHighlighted = v_id == u_HighlightID;

  if(isSlice()) {
    myColor = u_SliceColors[v_id];
    bool isDrag1 = (u_DraggedSliceIndices.x == v_id);
    bool isDrag2 = (u_DraggedSliceIndices.y == v_id);
    isHighlighted = isHighlighted ||isDrag1;
    isHighlighted = isHighlighted ||isDrag2;
  }

  int opacityIndex = isHighlighted ? 1 : 0;

  float myOpacity = u_SelectionModeOpacities[opacityIndex];

  // Debugging only
  vec3 vpos01 = ((v_position / vec3(u_Size)) / 2.0) + vec3(0.5);

  vec3 v01 = v_position - u_PickingRayOrigin;
  vec3 v02 = v_position - (u_PickingRayOrigin + u_Size*u_RayDir);
  vec3 v21 = (u_Size*u_RayDir);

  float dist = length(cross(v01, v02))/length(v21);

  outColor = vec4(myColor, myOpacity);

  //if(dist < 0.04)
  //  outColor = vec4(0.1,1.0,0.6,1.0);
}
