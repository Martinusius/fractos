uniform samplerCube bg_image;

vec3 background(vec3 direction) {
    return texture(bg_image, direction).xyz;
}