uniform sampler2D positionTexture;
uniform sampler2D normalTexture;

uniform vec3 backgroundColor;
uniform vec3 lineColor;

struct Pixel {
    vec3 position;
    vec3 normal;
};

Pixel pixel(int x, int y) {
    vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / resolution;

    Pixel pixel;
    pixel.position = texture2D(positionTexture, uv).xyz;
    pixel.normal = texture2D(normalTexture, uv).xyz;

    return pixel;
}

vec3 shading() {
    //return texture2D(positionTexture, gl_FragCoord.xy / resolution).xyz;

    Pixel center = pixel(0, 0);

    if(length(center.position - cameraPos) < 2.0 * epsilon) return backgroundColor; 

    bool edge = false;

    for(int x = 0; x <= 1; ++x) {
        for(int y = 0; y <= 1; ++y) {
            Pixel nearby = pixel(x, y);

            float dist = length(nearby.position - center.position);
            vec3 towards = normalize(nearby.position - center.position);

            if(
                dot(center.normal, nearby.normal) < 0.9 && center.normal != vec3(0)||
                abs(dot(center.normal, towards)) > 0.1 && dist > 2.0 * epsilon ||
                center.normal == vec3(0) && nearby.normal != vec3(0)
            )
                edge = true;
        }
    }

    
    return edge ? lineColor : backgroundColor;
}