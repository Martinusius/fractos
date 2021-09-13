uniform float lineWidth;
uniform vec3 lineColor;
uniform vec3 backgroundColor;
uniform sampler2D linesTexture;

vec3 pixel(int x, int y) {
    return texture2D(linesTexture, (gl_FragCoord.xy + vec2(x, y)) / resolution).xyz;
}

vec3 shading() {
    float radius = max(0.0, (min(lineWidth, 10.0) - 1.0) * 0.5);
    int grid = int(ceil(radius));

    for(int x = -grid; x <= grid; ++x) {
        for(int y = -grid; y <= grid; ++y) {
            if(sqrt(float(x * x + y * y)) <= radius && pixel(x, y) == lineColor) {
                return lineColor;
            } 
        }
    }
    return backgroundColor;
}