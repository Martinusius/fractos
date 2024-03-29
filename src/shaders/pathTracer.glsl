uniform vec2 offset;
uniform vec2 size;

uniform sampler2D previousFrame;
uniform int sampleIndex;
uniform int pixelDivisions;

uniform int rayDepth;
uniform float roughness;
uniform vec3 sunDirection;
uniform float sunStrength;
uniform float backgroundMultiplier;

uniform vec3 color;

uniform vec3 emissionR;
uniform vec3 emissionG;
uniform vec3 emissionB;

#define PI 3.141592653589
#define E 2.718281828459

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

vec3 sampleBiased(vec3 normal) {
    return normalize(normal + sphericalRand());
}

vec3 sampleUnbiased(vec3 normal) {
    while(true) {
        vec3 dir = sphericalRand();
        if(dot(normal, dir) > 0.0) return dir;
    }

    return vec3(0);
}



vec3 raytrace(vec3 from, vec3 direction) {
    vec3 direct = vec3(0.0);
    vec3 luminance = vec3(1.0);

    for (int i = 0; i < rayDepth; i++) {
        Ray ray = raycast(from, direction);

        if(ray.hit) {
            // Roughness calculation
            vec3 reflected = reflect(direction, ray.normal);
            vec3 sampleDir = sampleBiased(ray.normal);//normalize(ray.normal + sphericalRand());
            float lerpFactor = roughness * roughness;

            vec3 c = linear(color);

            direction = normalize(mix(reflected, sampleDir, lerpFactor)); 
            luminance *= clamp(c, 0.0, 1.0) * mix(max(dot(ray.normal, direction), 0.0), 1.0, lerpFactor);

            from = ray.position + ray.normal * epsilon;

            // Direct light
            vec3 sunSampleDir = normalize(-sunDirection);
            float sunLight = dot(ray.normal, sunSampleDir);

            Ray directLightRay = raycast(from, sunSampleDir);

            if (sunLight > 0.0 && !directLightRay.hit) {
                direct += luminance * sunLight * sunStrength;
            }
        }

        else {
            return direct + luminance * linear(background(direction));
        }
    }
    return direct;
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

   

    int subpixelIndex = sampleIndex % (pixelDivisions * pixelDivisions);
    int subX = subpixelIndex % pixelDivisions;
    int subY = subpixelIndex / pixelDivisions;

    seed = (subpixelCoord(subX, subY, pixelDivisions)) * (1.0 + float(sampleIndex) * 0.001);

    vec3 rayDirection = subpixelDirection(subX, subY, pixelDivisions);

    vec3 pixelColor = raytrace(cameraPos, rayDirection);

    return previousColor * float(sampleIndex) / float(sampleIndex + 1) + pixelColor / float(sampleIndex + 1);

    /*vec3 rayDirection = pixelDirection();

    // Trace
    vec3 pixelColor = vec3(0);

    for(int i = 0; i < samplesPerDrawCall; ++i) {
        seed = (1.0 * gl_FragCoord.xy) * (1.0 + float(sampleIndex) * 0.1);
        pixelColor += raytrace(cameraPos, rayDirection);
    }

    // Average samples
    return previousColor * float(sampleIndex) / float(sampleIndex + samplesPerDrawCall) + pixelColor / float(sampleIndex + samplesPerDrawCall);*/
}