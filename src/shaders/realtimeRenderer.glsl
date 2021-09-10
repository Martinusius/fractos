#include <packing>

uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;

uniform float fov;

uniform bool enableShadows;
uniform float shadowHardness;
uniform float epsilonScale;

uniform float time;

float sdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position, float minDist) {
    vec2 h = vec2(minDist, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
}


uniform vec3 sunDirection;
uniform float sunStrength;
uniform float ambientLightStrength;
uniform float ambientOcclusionStrength;
uniform vec3 color;


const int maximumRaySteps = 2048;

float shadowRay(vec3 position, vec3 normal, float minimum) {
    float minDist = 1.0;

    float totalDistance = 2.0 * minimum;
    for (int steps = 0; steps < maximumRaySteps; steps++) {
        vec3 p = position + totalDistance * (-sunDirection);
        if(length(p) > 100.0)
            break;

        float dist = sdf(p);
        totalDistance += dist;

        minDist = min(shadowHardness * dist / totalDistance, minDist);

       
        if (dist < 0.000001 && steps > 4)
            return 0.0;
    }

    return max(dot(normal, -sunDirection), 0.0) * minDist;
}

float aoRay(vec3 position, vec3 normal, float minDist) {
    float totalDistance = 2.0 * minDist;
    for (int steps = 0; steps < maximumRaySteps; steps++) {
        vec3 p = position + totalDistance * normal;
        if(length(p) > 100.0)
            break;

        float dist = sdf(p);
        totalDistance += dist;

        minDist = min(shadowHardness * dist / totalDistance, minDist);

       
        if (dist < 0.000001 && steps > 4)
            return float(steps);
    }

    return float(maximumRaySteps);
}


float statixAO(vec3 p, vec3 n, float k, float delta) {
    float sum = 0.0;
    for(int i = 1; i <= 5; ++i) {
        float fi = float(i);
        sum += pow(2.0, -fi) * fi * delta - sdf(p + n * fi * delta);
    }
    return 1.0 - k * sum;
}

#define PI 3.141592653589

vec2 seed = vec2(0);

vec2 rand2n() {
    seed += vec2(-1, 1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
        fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}


struct MarchData {
    vec3 color;
    vec3 intersection;
    bool hit;
};

float contrast(float color, float contrast) {
    return (color - 0.5) * max(contrast, 0.0) + 0.5;
}

vec3 trap;

vec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {
    map = abs(map);
    map /= (map.r + map.g + map.b);
    return (color1 * map.r + color2 * map.g + color3 * map.b);
}


MarchData march(vec3 direction) {
    float minDist = 0.0;

    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 p = cameraPos + totalDistance * direction;

        if(length(p) > 100.0)
            break;
        
        float dist = sdf(p);
        totalDistance += (steps < 1 ? rand(gl_FragCoord.xy / resolution * 100.0) * dist : dist);
       
        if(steps == 0) {
            if(dist < 0.0) return MarchData(vec3(0), cameraPos, true);
            minDist = dist * epsilonScale;
        }
        else if(dist < minDist) {
            vec3 position = cameraPos + totalDistance * direction;
            vec3 normal = calculateNormal(position, minDist);

            float diffuse = (enableShadows ? shadowRay(position, normal, minDist) : max(dot(normal, -sunDirection), 0.0)) * sunStrength;

            float ao = 1.0 / (float(steps) + dist / minDist) / ambientOcclusionStrength;

            const int samples = 4;

            vec3 bg = vec3(0);
            for(int i = 0; i < samples; ++i) {
                bg += background(normalize(vec3(rand2n(), rand2n().x)));
            }   

            vec3 pixel = diffuse * color + ao * (bg / float(samples)) * color * ambientLightStrength;


              

            return MarchData(pixel, position, true);
        }
    }

   
    return MarchData(background(direction), vec3(0), false);
}

uniform sampler2D rasterizerColor;

mat3 cameraMatrix() {
    vec3 cw = cameraDirection;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

void main() {        
    vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
    mat3 view = cameraMatrix();

    vec3 rayDirection = view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));

    MarchData data = march(rayDirection);

    vec3 raster = texture(rasterizerColor, gl_FragCoord.xy / resolution).xyz;

    if(raster.x + raster.y + raster.z > 0.0) {
        gl_FragColor = vec4(raster, 1);
    }
    else {
        gl_FragColor = vec4(data.color, 1);
    }
}
