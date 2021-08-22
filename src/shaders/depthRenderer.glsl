#include <packing>

uniform vec2 resolution;
uniform vec3 cameraPosition;
uniform vec3 cameraDirection;

uniform float fov;

uniform bool enableShadows;
uniform float shadowHardness;
uniform float epsilonScale;

uniform bool farIsBlack;

uniform float time;

float sdf(vec3 position);

const int maximumRaySteps = 2048;

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}


vec3 march(vec3 direction) {
    float minDist = 0.0;

    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 p = cameraPosition + totalDistance * direction;

        if(length(p) > 100.0)
            break;
        
        float dist = sdf(p);
        totalDistance += (steps < 1 ? rand(gl_FragCoord.xy / resolution * 100.0) * dist : dist);
       
        if(steps == 0) {
            if(dist < 0.0) return vec3(farIsBlack ? 1.0 : 0.0);
            minDist = dist * epsilonScale;
        }
        else if(dist < minDist) {
            float depth = 1.0 / totalDistance;

            return vec3(farIsBlack ? depth : 1.0 - depth);
        }
    }   
    return vec3(farIsBlack ? 0.0 : 1.0);
}

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

    vec3 color = march(rayDirection);

    gl_FragColor = vec4(color.xyz, 1);
}
