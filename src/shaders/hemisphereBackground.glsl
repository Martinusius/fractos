uniform vec3 bg_top;
uniform vec3 bg_bottom;
uniform float bg_blendAngle;

vec3 background(vec3 direction) {
    float angle = atan(direction.y / length(direction.xz));
    return mix(bg_bottom, bg_top, clamp((angle + bg_blendAngle) / 2.0 / bg_blendAngle, 0.0, 1.0));
}