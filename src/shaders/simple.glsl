uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float aoStrength;
uniform vec3 color;
uniform bool enableShadows;
uniform float roughness;

float calculateDirectLight(vec3 position, vec3 normal, float epsilon) {
    if(enableShadows) {
        Ray shadowRay = raycastEpsilon(position + (normal) * 2.0 * epsilon, -sunDirection, epsilon);
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
        float ao = statixAO(ray.position, ray.normal, 1.0, 0.01)
            + statixAO(ray.position, ray.normal, 1.0, 0.05);

        vec3 indirect = ((backgroundAverage / float(samples)) - clamp(ao, 0.0, 1.0) * aoStrength) * color;
        vec3 direct = calculateDirectLight(ray.position, ray.normal, ray.epsilon) * sunColor * color;
      
        return indirect + direct;
    }
    else {
        return background(ray.direction);
    }
}