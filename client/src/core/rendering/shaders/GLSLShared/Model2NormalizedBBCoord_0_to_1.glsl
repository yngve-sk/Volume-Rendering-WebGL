// world coords -> bounding box coords -> tex coords
// [-1,1]       -> [-0.5,0.5]          -> [0,1]
vec3 Model2NormalizedBBCoord_0_to_1(vec3 modelPosition, vec3 boundingBox) {
    return (modelPosition / boundingBox) + vec3(0.5);//
}


#pragma glslify: export(Model2NormalizedBBCoord_0_to_1)
