uniform vec2 resolution;
uniform vec3 cameraPosition;
uniform vec3 cameraDirection;

uniform sampler2D previousFrame;
uniform int samplesPerFrame;
uniform int sampleIndex;

uniform float fov;
uniform float time;


const float epsilon = 0.0002;


float sdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position) {
    vec2 h = vec2(epsilon, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
}

uniform int rayDepth;
uniform float roughness;
uniform vec3 sunDirection;
uniform float sunStrength;
uniform vec3 color;

const float renderDistance = 100.0;

bool march(vec3 from, vec3 direction, out vec3 hit, out vec3 normal) {
    float totalDistance = 0.0;
    for (int steps = 0; steps < 256; ++steps) {
        vec3 p = from + totalDistance * direction;

        if(length(p) > 100.0)
            break;

        float dist = sdf(p);
        totalDistance += dist;

        if (dist < epsilon) {
            hit = from + totalDistance * direction;
            normal = calculateNormal(hit);

            return true;
        }
    }

    return false;
}


#define PI 3.141592653589

vec2 seed = vec2(0);

vec2 rand2n() {
    seed += vec2(-1, 1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
        fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

vec3 ortho(vec3 v) {
    //  See : http://lolengine.net/blog/2013/09/21/picking-orthogonal-vector-combing-coconuts
    return abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)  : vec3(0.0, -v.z, v.y);
}

vec3 getSampleBiased(vec3  dir, float power) {
    dir = normalize(dir);
    vec3 o1 = normalize(ortho(dir));
    vec3 o2 = normalize(cross(dir, o1));
    vec2 r = rand2n();
    r.x = r.x * 2.0 * PI;
    r.y = pow(r.y,1.0/(power+1.0));
    float oneminus = sqrt(1.0-r.y*r.y);
    return cos(r.x)*oneminus*o1+sin(r.x)*oneminus*o2+r.y*dir;
}


vec3 getCosineWeightedSample(vec3 dir) {
    return getSampleBiased(dir, 1.0);
}

vec3 trap;

vec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {
    map = abs(map);
    map /= (map.r + map.g + map.b);
    return (color1 * map.r + color2 * map.g + color3 * map.b);
}


const float albedo = 1.0;

vec3 raytrace(vec3 from, vec3 dir) {
    vec3 hit = vec3(0.0);
    vec3 direct = vec3(0.0);
    vec3 normal = vec3(0.0);
        
    vec3 luminance = vec3(1.0);
    for (int i = 0; i < rayDepth; i++) {
        if (march(from, dir, hit, normal)) {
            // Roughness calculation
            if(rand2n().x < roughness) {
                dir = getCosineWeightedSample(normal);
                luminance *= color * albedo;
            }
            else {
                dir = reflect(dir, normal);
                luminance *= color * max(0.0, dot(dir, normal));
            }

            from = hit + normal * epsilon * 2.0;

            // Direct light
            vec3 nil;
            
            vec3 sunSampleDir = normalize(-sunDirection);
            float sunLight = dot(normal, sunSampleDir);

            if (sunLight > 0.0 && !march(from, sunSampleDir, nil, nil)) {
                direct += luminance * sunLight * sunStrength;
            }
        } else {
            return direct + luminance * background(dir);
        }
    }
    return vec3(0.0);
}

mat3 cameraMatrix() {
    vec3 cw = cameraDirection;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}



void main() {
    vec2 uv = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;

    mat3 view = cameraMatrix();

    vec3 rayDirection = view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));

    // Trace
    seed = (10.0 * gl_FragCoord.xy) * (1.0 + float(sampleIndex));
    vec3 pixelColor = raytrace(cameraPosition, rayDirection);

    // Average samples
    vec3 previousColor = texture2D(previousFrame, gl_FragCoord.xy / resolution).xyz;
    vec3 averageColor = previousColor * float(sampleIndex) / float(sampleIndex + 1) + pixelColor / float(sampleIndex + 1);
   
    gl_FragColor = vec4(averageColor, 1);
}
