uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;

uniform float fov;

uniform bool enableShadows;
uniform float shadowHardness;

#define CAMERA_NEAR         0.000001
#define CAMERA_FAR          1000.0

const float epsilon = 0.00002;

float sdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position) {
    vec2 h = vec2(epsilon, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy), sdf(position + h.yxy) - sdf(position - h.yxy), sdf(position + h.yyx) - sdf(position - h.yyx)));
}

uniform vec3 sunDirection;
uniform float sunStrength;
uniform float ambientLightStrength;
uniform float ambientOcclusionStrength;
uniform vec3 color;

const int maximumRaySteps = 512;

float shadowRay(vec3 position, vec3 normal) {
    float minDist = 1.0;

    float totalDistance = 2.0 * epsilon;
    for(int steps = 0; steps < maximumRaySteps; steps++) {
        vec3 p = position + totalDistance * (-sunDirection);
        if(totalDistance > 100.0)
            return max(dot(normal, -sunDirection), 0.0) * minDist;

        float dist = sdf(p);
        totalDistance += dist;

        minDist = min(shadowHardness * dist / totalDistance, minDist);

        if(dist < 0.000001 && steps > 4)
            return 0.0;
    }

    return max(dot(normal, -sunDirection), 0.0) * minDist;
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

vec2 seed = vec2(0);

vec2 rand2n() {
    seed += vec2(-1, 1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453), fract(cos(dot(seed.xy, vec2(4.898, 7.23))) * 23421.631));
}

struct MarchData {
    bool hit;
    vec3 position;
    vec3 normal;
    vec3 color;
};

MarchData march(vec3 direction) {
    MarchData data;

    float totalDistance = 0.0;
    for(int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 p = cameraPos + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float dist = sdf(p);
        totalDistance += (steps < 4 ? rand(gl_FragCoord.xy / resolution * 100.0) * dist : dist);

        if(dist < epsilon) {
            vec3 position = cameraPos + totalDistance * direction;
            vec3 normal = calculateNormal(position);

            float diffuse = (enableShadows ? shadowRay(position, normal) : max(dot(normal, -sunDirection), 0.0)) * sunStrength;

            float ao = 1.0 / (float(steps) + dist / epsilon) / ambientOcclusionStrength;

            const int samples = 4;

            vec3 bg = vec3(0);
            for(int i = 0; i < samples; ++i) {
                bg += background(normalize(vec3(rand2n(), rand2n().x)));
            }

            vec3 pixel = diffuse * color + ao * (bg / float(samples)) * color * ambientLightStrength;

            data.hit = true;
            data.position = position;
            data.normal = normal;
            data.color = pixel;

            return data;
        }
    }

    data.hit = false;
    data.color = background(direction);

    return data;
}

mat3 cameraMatrix() {
    vec3 cw = cameraDirection;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

vec3 ray(int x, int y) {
    mat3 view = cameraMatrix();

    vec2 uv = ((gl_FragCoord.xy + vec2(x, y)) / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));
}

void main() {
    MarchData center = march(ray(0, 0));

    /*gl_FragColor = vec4(center.color, 1);*/

    vec3 cn = center.normal;
    vec3 cp = center.position;

    bool white = false;

    float diff = 0.0;

    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            MarchData nearby = march(ray(x, y));
            vec3 nn = nearby.normal;
            vec3 np = nearby.position;

            float dist = length(np - cp);
            vec3 towards = normalize(np - cp);

            float nd = length(cameraPos - nearby.position);

            if(dot(cn, nn) < 0.9 && cn != vec3(0) || dot(cn, towards) < -0.1 && dist > 2.0 * epsilon)
                white = true;
        }
    }

    gl_FragColor = vec4(white ? vec3(1) : vec3(0), 1);

    /*float factor = 10.0;

    center.color.x = floor(center.color.x * factor) / factor;
    center.color.y = floor(center.color.y * factor) / factor;
    center.color.z = floor(center.color.z * factor) / factor;
    gl_FragColor = vec4(center.color, 1);*/
}
