uniform float bakeScale;

float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdf(vec3 position);

void main() {
    int index = int(gl_FragCoord.x) + 4096 * int(gl_FragCoord.y);

    vec3 position = vec3(index % 256, index % (256 * 256) / 256, index / 256 / 256);
    position = (position / 128.0 - 1.0) * bakeScale;

    gl_FragColor = vec4(sdf(position), 0, 0, 1);
}