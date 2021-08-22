uniform vec2 resolution;
uniform sampler2D data;

void main() {
    gl_FragColor = texture(data, gl_FragCoord.xy / resolution);
}
