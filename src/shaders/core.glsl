uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;
uniform float fov;
uniform float time;

uniform bool adaptiveEpsilon;
uniform float epsilonScale;
uniform float epsilon;

const float PI = 3.1415926535897932384626433832795;
const float DEG_TO_RAD = PI / 180.0;


const int maximumRaySteps = 2048;

float sdf(vec3 position);
vec3 csdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position, float minDist) {
    vec2 h = vec2(minDist, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
}

vec3 trap;

vec2 seed = vec2(0);
float rand() { 
    seed += vec2(-0.1, 0.1);
    return fract(sin(dot(seed, vec2(12.9898, 4.1414))) * 43758.5453);
}

/*float seed = 10.0;

float PHI = 1.61803398874989484820459;

float rand() {
    vec2 xy = gl_FragCoord.xy;
    seed += 1.0;
    return fract(tan(distance(xy * PHI, xy) * seed) * xy.x);
}*/

vec2 rand2() {
    return vec2(rand(), rand());
}

vec3 rand3() {
    return vec3(rand(), rand(), rand());
}

vec3 sphericalRand() {
    float z = rand() * 2.0 - 1.0;
    float rxy = sqrt(1.0 - z * z);
    float phi = rand() * 2.0 * PI;
    float x = rxy * cos(phi);
    float y = rxy * sin(phi);

    return vec3(x, y, z);
}



struct Ray {
    vec3 origin;
    vec3 direction;

    float closest;

    bool hit;
    vec3 position;
    vec3 normal;
    float steps;

    float epsilon;
};

mat3 cameraMatrix(vec3 direction) {
    vec3 cw = direction;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

vec2 subpixelCoord(int x, int y, int divisions) {
    float subpixelSize = 1.0 / float(divisions);
    vec2 offset = vec2(subpixelSize * (float(x) + 0.5) - 0.5, subpixelSize * (float(y) + 0.5) - 0.5);
    return gl_FragCoord.xy + offset;
}

vec3 subpixelDirection(int x, int y, int divisions) {
    mat3 view = cameraMatrix(cameraDirection);
    vec2 uv = (subpixelCoord(x, y, divisions) / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));
}


vec3 pixelDirection() {
    mat3 view = cameraMatrix(cameraDirection);
    vec2 uv = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));
}

vec2 directionPixel(vec3 position, vec3 cameraPos, vec3 cameraDir) {
    mat3 inverseView = inverse(cameraMatrix(cameraDir));
    vec3 toPos = normalize(position - cameraPos);
    vec3 fromCameraDir = inverseView * toPos;

    float zDistance = 1.0 / tan(fov / 2.0);
    vec2 uv = (fromCameraDir * zDistance / fromCameraDir.z).xy;
    uv /= resolution.x / resolution.y;
    return (uv + 1.0) / 2.0;
}



uniform int orbitSampler;
uniform int orbitMapping;

vec3 sampleOrbit(vec3 a, vec3 b) {
    switch (orbitSampler) {
    case 0:
        return min(a, b);
    case 1:
        return max(a, b);
    case 2:
        return a + b;
    case 3:
        return min(abs(a), abs(b));
    case 4:
        return max(abs(a), abs(b));
    case 5:
        return abs(a) + abs(b);
    }
}

float mapOrbit(float x) {
    switch (orbitMapping) {
    case 0:
        return 1.0/3.0;
    case 1:
        return x;
    case 2:
        return 1.0 / (1.0 + pow(2.71828182846, -x));
    case 3:
        return x / (x + 1.0);
    }
}

vec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {
    return (mapOrbit(map.x) * color1 + mapOrbit(map.y) * color2 + mapOrbit(map.z) * color3);
}

// vec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {
//     return (sigmoid(map.x) * color1 + sigmoid(map.y) * color2 + sigmoid(map.z) * color3);
// }


Ray raycast(vec3 origin, vec3 direction) {
    Ray data;
    data.origin = origin;
    data.direction = direction;

    if(!adaptiveEpsilon)
        data.epsilon = epsilon;

    float totalDistance = 0.0;
    float closest = 100.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 currentPosition = origin + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float currentDistance = sdf(currentPosition);
        closest = min(closest, currentDistance);

        // Antibanding
        totalDistance += max(0.0, (steps < 1 ? rand() * currentDistance : currentDistance));

        if(steps == 0) {
            if(currentDistance < 0.0) {
                data.hit = true;
                data.position = origin;
                data.normal = vec3(0);
                data.steps = 0.0;

                return data;
            }

            if(adaptiveEpsilon)
                data.epsilon = currentDistance * epsilonScale;
        }
        else if(currentDistance < data.epsilon) {
            data.hit = true;
            data.position = origin + totalDistance * direction;
            data.normal = calculateNormal(data.position, data.epsilon);
            data.steps = float(steps) + currentDistance / data.epsilon;

            return data;
        }
    }

    data.closest = closest;
    data.hit = false;
    return data;
}

Ray raycastEpsilon(vec3 origin, vec3 direction, float epsilon) {
    Ray data;
    data.origin = origin;
    data.direction = direction;
    data.epsilon = epsilon;

    float totalDistance = 0.0;
      float closest = 100.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 currentPosition = origin + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float currentDistance = sdf(currentPosition);
        closest = min(closest, currentDistance);

        // Antibanding
        totalDistance += max(0.0, (steps < 1 ? rand() * currentDistance : currentDistance));

        if(steps == 0) {
            if(currentDistance < 0.0) {
                data.hit = true;
                data.position = origin;
                data.normal = vec3(0);
                data.steps = 0.0;

                return data;
            }

        }
        else if(currentDistance < data.epsilon) {
            data.hit = true;
            data.position = origin + totalDistance * direction;
            data.normal = calculateNormal(data.position, data.epsilon);
            data.steps = float(steps) + currentDistance / data.epsilon;

            return data;
        }
    }

    data.closest = closest;
    data.hit = false;
    return data;
}

Ray pixelRaycast() {
    return raycast(cameraPos, pixelDirection());
}


vec3 shading();

void main() {        
    gl_FragColor = vec4(shading(), 1);
}


