#version 300 es
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
void main() {
v_texCoord = a_texcoord;
v_position = (u_worldViewProjection * a_position);
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
gl_Position = v_position;
}
