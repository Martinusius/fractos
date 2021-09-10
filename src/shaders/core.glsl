uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;
uniform float fov;
uniform float epsilon;
uniform float time;


const int maximumRaySteps = 1024;

float sdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position) {
    vec2 h = vec2(epsilon, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
}

vec2 seed = vec2(0);

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
    bool hit;
    vec3 position;
    vec3 normal;
    float steps;
};

mat3 cameraMatrix() {
    vec3 cw = cameraDirection;
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

vec3 pixelDirection(vec2 coord) {
    mat3 view = cameraMatrix();
    vec2 uv = (coord / resolution) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    return view * normalize(vec3(uv, 1.0 / tan(fov / 2.0)));
}

Ray raycast(vec3 origin, vec3 direction) {
    Ray data;

    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 currentPosition = origin + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float currentDistance = sdf(currentPosition);

        // Antibanding
        totalDistance += (steps < 1 ? rand() * currentDistance : currentDistance);
       
        if(currentDistance < epsilon) {
            data.hit = true;
            data.position = origin + totalDistance * direction;
            data.normal = calculateNormal(data.position);
            data.steps = float(steps) + currentDistance / epsilon;

            return data;
        }
    }

    data.hit = false;
    return data;
}

Ray pixelRaycast(vec2 coord) {
    return raycast(cameraPos, pixelDirection(coord));
}


vec3 shading();

void main() {        
    gl_FragColor = vec4(shading(), 1);
}


/*uniform vec3 sunDirection;
uniform float sunStrength;
uniform float ambientLightStrength;
uniform float ambientOcclusionStrength;
uniform vec3 color;
uniform bool enableShadows;
uniform float shadowHardness;

vec3 shading() {
    Ray ray = pixelRaycast();
    if(ray.hit) {
        float diffuse = (enableShadows ? shadowRay(ray.normal, normal) : max(dot(normal, -sunDirection), 0.0)) * sunStrength;
        float ao = 1.0 / (steps) / ambientOcclusionStrength;

        const int samples = 4;
        vec3 backgroundAverage = vec3(0);
        for(int i = 0; i < samples; ++i)
            backgroundAverage += background(normalize(vec3(rand2n(), rand2n().x)));

        return diffuse * color + ao * (backgroundAverage / float(samples)) * color * ambientLightStrength;
    }
    else {
        return;
    }
}*/