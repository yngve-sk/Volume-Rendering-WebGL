#version 300 es
uniform mat4 u_WorldViewProjection;
uniform vec3 u_LightWorldPos;
uniform mat4 u_World;
uniform mat4 u_ViewInverse;
uniform mat4 u_WorldInverseTranspose;
uniform float u_AspectRatio;

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
    v_position = (u_WorldViewProjection * a_position);
    v_normal = (u_WorldInverseTranspose * vec4(a_normal, 0)).xyz;
    v_surfaceToLight = u_LightWorldPos - (u_World * a_position).xyz;
    v_surfaceToView = (u_ViewInverse[3] - (u_World * a_position)).xyz;
    gl_Position = vec4(v_position.x/u_AspectRatio, v_position.y, v_position.z, v_position.w);
}
