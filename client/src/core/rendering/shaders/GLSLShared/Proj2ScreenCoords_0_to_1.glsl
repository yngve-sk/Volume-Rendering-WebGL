vec2 Proj2ScreenCoords_0_to_1(vec4 projectedPosition) {
    vec2 texCoord = projectedPosition.xy / projectedPosition.w;
    texCoord.x = 0.5 * texCoord.x + 0.5;
    texCoord.y = 0.5 * texCoord.y + 0.5;
    return texCoord;
}

#pragma glslify: export(Proj2ScreenCoords_0_to_1)
