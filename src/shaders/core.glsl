uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;
uniform float fov;
uniform float time;

uniform bool adaptiveEpsilon;
uniform float epsilonScale;
uniform float epsilon;


const int maximumRaySteps = 2048;

float sdf(vec3 position);
void csdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position, float minDist) {
    vec2 h = vec2(minDist, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
}

vec2 seed = vec2(0);
vec3 trap;

float rand() { 
    seed += vec2(-1, 1);
    return fract(sin(dot(seed, vec2(12.9898, 4.1414))) * 43758.5453);
}

vec2 rand2() {
    return vec2(rand(), rand());
}

vec3 rand3() {
    return vec3(rand(), rand(), rand());
}


struct Ray {
    vec3 origin;
    vec3 direction;

    bool hit;
    vec3 position;
    vec3 normal;
    float steps;

    float epsilon;
};

mat3 cameraMatrix() {
    vec3 cw = cameraDirection;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

vec3 pixelDirection() {
    mat3 view = cameraMatrix();
    vec2 uv = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));
}

vec3 mapToChannels(vec3 color1, vec3 color2, vec3 color3, vec3 map) {
    map = abs(map);
    map /= (map.r + map.g + map.b);
    return (color1 * map.r + color2 * map.g + color3 * map.b);
}


Ray raycast(vec3 origin, vec3 direction) {
    Ray data;
    data.origin = origin;
    data.direction = direction;

    if(!adaptiveEpsilon)
        data.epsilon = epsilon;

    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 currentPosition = origin + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float currentDistance = sdf(currentPosition);

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
            csdf(currentPosition);

            data.hit = true;
            data.position = origin + totalDistance * direction;
            data.normal = calculateNormal(data.position, data.epsilon);
            data.steps = float(steps) + currentDistance / data.epsilon;

            return data;
        }
    }

    data.hit = false;
    return data;
}

Ray raycastEpsilon(vec3 origin, vec3 direction, float epsilon) {
    Ray data;
    data.origin = origin;
    data.direction = direction;
    data.epsilon = epsilon;

    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 currentPosition = origin + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float currentDistance = sdf(currentPosition);

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


