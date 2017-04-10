vec2 ProjectedPositionToTexCoord(vec4 projectedPosition) {
    vec2 texCoord = projectedPosition.xy / projectedPosition.w;
    texCoord.x = 0.5 * texCoord.x + 0.5;
    texCoord.y = 0.5 * texCoord.y + 0.5;
    return texCoord;
}

#pragma glslify: export(ProjectedPositionToTexCoord)
