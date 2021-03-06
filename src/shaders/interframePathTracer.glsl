uniform vec2 offset;
uniform vec2 size;

uniform sampler2D previousFrame;
uniform sampler2D pixelMemory;
uniform sampler2D positions;
uniform int sampleIndex;
uniform int samplesPerDrawCall;

uniform int rayDepth;
uniform float roughness;
uniform vec3 sunDirection;
uniform float sunStrength;
uniform vec3 color;
uniform float backgroundMultiplier;


uniform vec3 oldCameraPos;
uniform vec3 oldCameraDir;


#define PI 3.141592653589

vec3 ortho(vec3 v) {
    return abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)  : vec3(0.0, -v.z, v.y);
}

vec3 getSampleBiased(vec3 dir, float power) {
    dir = normalize(dir);
    vec3 o1 = normalize(ortho(dir));
    vec3 o2 = normalize(cross(dir, o1));
    vec2 r = rand2();
    r.x = r.x * 2.0 * PI;
    r.y = pow(r.y, 1.0 / (power + 1.0));
    float oneminus = sqrt(1.0 - r.y * r.y);
    return cos(r.x) * oneminus * o1 + sin(r.x) * oneminus * o2 + r.y * dir;
} 

vec3 getCosineWeightedSample(vec3 dir) {
    return getSampleBiased(dir, 1.0);
}


const float albedo = 1.0;

vec3 raytrace(vec3 from, vec3 dir) {
    vec3 direct = vec3(0.0);
    vec3 emission = vec3(0.0);
    vec3 luminance = vec3(1.0);

    for (int i = 0; i < rayDepth; i++) {
        Ray ray = raycast(from, dir);

        if(ray.hit) {
            // Roughness calculation
            vec3 reflected = reflect(dir, ray.normal);
            vec3 sampleDir = getCosineWeightedSample(ray.normal);
            float lerpFactor = pow(roughness, 2.0);

            dir = normalize(mix(reflected, sampleDir, lerpFactor)); 

            luminance *= color * albedo * mix(max(dot(ray.normal, dir), 0.0), 1.0, lerpFactor);
            

            from = ray.position + ray.normal * epsilon * 2.0;

            // Direct light
            vec3 sunSampleDir = normalize(-sunDirection);
            float sunLight = dot(ray.normal, sunSampleDir);

            Ray directLightRay = raycast(from, sunSampleDir);

            if (sunLight > 0.0 && !directLightRay.hit) {
                direct += luminance * sunLight * sunStrength;
            }
        }
        else {
            return direct + luminance * background(dir) * backgroundMultiplier;
        }
    }
    return vec3(0.0);
}

vec3 shading() {
    vec3 previousColor = texture2D(previousFrame, gl_FragCoord.xy / resolution).xyz;

    if(
        gl_FragCoord.x < offset.x ||
        gl_FragCoord.y < offset.y ||
        gl_FragCoord.x > offset.x + size.x ||
        gl_FragCoord.y > offset.y + size.y
    ) {
        return previousColor;
    }

    vec3 rayDirection = pixelDirection();

    Ray ray = raycast(cameraPos, rayDirection);
    
    vec2 uv = directionPixel(ray.position, oldCameraPos, oldCameraDir);

    int r = 3;

    float minLength = 1000.0;
    vec3 minColor;

    for(int x = -r; x <= r; ++x) {
        for(int y = -r; y <= r; ++y) {
            vec3 cached = texture2D(positions, uv + (vec2(x, y) / resolution)).xyz;
            if(length(cached - ray.position) < minLength) {
                minLength = length(cached - ray.position);
                minColor = texture2D(pixelMemory, uv + (vec2(x, y) / resolution)).xyz;
            }
        }
    }

    if(minLength < 0.001) {
        return minColor;
    }

    // Trace
    
    vec3 pixelColor = vec3(0);

    for(int i = 0; i < samplesPerDrawCall; ++i) {
        seed = (1.0 * gl_FragCoord.xy) * (1.0 + float(sampleIndex + i) * 0.1);
        pixelColor += raytrace(cameraPos, rayDirection);
    }

    // Average samples
    return previousColor * float(sampleIndex) / float(sampleIndex + samplesPerDrawCall) + pixelColor / float(sampleIndex + samplesPerDrawCall);
}