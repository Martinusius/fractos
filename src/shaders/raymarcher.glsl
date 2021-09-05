uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 cameraDirection;

uniform float fov;

uniform bool enableShadows;
uniform float shadowHardness;

#define CAMERA_NEAR         0.000001
#define CAMERA_FAR          1000.0

struct Camera {
    vec3 position;
    vec3 forward;
    vec3 right;
    vec3 up;
    float fov;
    float near;
    float far;
};
Camera createCamera() {
    vec3 right = vec3(0.0);
    vec3 up = vec3(0.0);
    Camera camera = Camera(cameraPos, cameraDirection, right, up, fov, CAMERA_NEAR, CAMERA_FAR);
    camera.right = normalize(vec3(-camera.forward.z, 0.0, camera.forward.x));
    camera.up = normalize(-cross(camera.forward, camera.right));
    return camera;
}


const float epsilon = 0.0002;

const float renderDistance = 100.0;


float sdf(vec3 position);
vec3 background(vec3 direction);

vec3 calculateNormal(vec3 position) {
    vec2 h = vec2(epsilon, 0.0);
    return normalize(vec3(sdf(position + h.xyy) - sdf(position - h.xyy),
                           sdf(position + h.yxy) - sdf(position - h.yxy),
                           sdf(position + h.yyx) - sdf(position - h.yyx)));
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
    for (int steps = 0; steps < maximumRaySteps; steps++) {
        vec3 p = position + totalDistance * (-sunDirection);
        if(totalDistance > 100.0)
            return max(dot(normal, -sunDirection), 0.0) * minDist;

        float dist = sdf(p);
        totalDistance += dist;

        minDist = min(shadowHardness * dist / totalDistance, minDist);

       
        if (dist < 0.000001 && steps > 4)
            return 0.0;
    }

    return max(dot(normal, -sunDirection), 0.0) * minDist;
}



float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}


vec3 march(vec3 direction) {
    float totalDistance = 0.0;
    for (int steps = 0; steps < maximumRaySteps; ++steps) {
        vec3 p = cameraPos + totalDistance * direction;

        if(totalDistance > 100.0)
            break;

        float dist = sdf(p);
        totalDistance += (steps < 4 ? rand(gl_FragCoord.xy / resolution * 100.0) * dist : dist);
       
        if(dist < epsilon) {
            vec3 position = cameraPos + totalDistance * direction;
            vec3 normal = calculateNormal(position);

            float diffuse = (enableShadows ? shadowRay(position, normal) : max(dot(normal, -sunDirection), 0.0)) * sunStrength;

            float ao = ambientLightStrength / (1.0 + (float(steps) + dist / epsilon) * ambientOcclusionStrength);
            diffuse += ao;            

            return diffuse * color;
        }
    }

   
    return background(direction);
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

    vec3 color = march(rayDirection);

    gl_FragColor = vec4(color, 1);
}
