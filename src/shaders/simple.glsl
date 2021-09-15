uniform vec3 sunDirection;
uniform float sunStrength;
uniform float ambientLightStrength;
uniform float ambientOcclusionStrength;
uniform vec3 color;
uniform bool enableShadows;
uniform float roughness;

float calculateDirectLight(vec3 position, vec3 normal) {
    if(enableShadows) {
        Ray shadowRay = raycast(position + normal * 2.0 * epsilon, normal);
        return shadowRay.hit ? 0.0 : max(dot(normal, -sunDirection), 0.0);
    }
    else {
        return max(dot(normal, -sunDirection), 0.0);
    }
}


float statixAO(vec3 p, vec3 n, float k, float delta) {
    float sum = 0.0;
    for(int i = 1; i <= 5; ++i) {
        float fi = float(i);
        sum += pow(2.0, -fi) * fi * delta - sdf(p + n * fi * delta);
    }
    return k * sum;
}

vec3 shading() {
    Ray ray = pixelRaycast();
    
    if(ray.hit) {
        const int samples = 4;
        vec3 backgroundAverage = vec3(0);
        float lerpFactor = roughness * roughness;

        for(int i = 0; i < samples; ++i)  {
            vec3 random = normalize(rand3() * 2.0 - 1.0); // TODO: Fix non-uniformness
            vec3 reflected = reflect(ray.direction, ray.normal);
            backgroundAverage += background(normalize(mix(reflected, random, lerpFactor))) * mix(max(dot(reflected, ray.normal), 0.0), 1.0, lerpFactor);
        }

        //float ao = 1.0 / (ray.steps) / ambientOcclusionStrength;
        float ao = statixAO(ray.position, ray.normal, 0.3, 0.1) + 0.3;

        vec3 indirect = ((backgroundAverage / float(samples)) - ao) * color;

        vec3 direct = calculateDirectLight(ray.position, ray.normal) * indirect;
      
        return indirect + direct;
    }
    else {
        return background(ray.direction);
    }
}