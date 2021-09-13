uniform vec3 sunDirection;
uniform float sunStrength;
uniform float ambientLightStrength;
uniform float ambientOcclusionStrength;
uniform vec3 color;
uniform bool enableShadows;

float calculateDiffuse(vec3 position, vec3 normal) {
    if(enableShadows) {
        Ray shadowRay = raycast(position + normal * 2.0 * epsilon, normal);
        return shadowRay.hit ? 0.0 : max(dot(normal, -sunDirection), 0.0);
    }
    else {
        return max(dot(normal, -sunDirection), 0.0);
    }
}

vec3 shading() {
    Ray ray = pixelRaycast();
    
    if(ray.hit) {
        float diffuse = calculateDiffuse(ray.position, ray.normal) * sunStrength;
        float ao = 1.0 / (ray.steps) / ambientOcclusionStrength;

        const int samples = 4;
        vec3 backgroundAverage = vec3(0);
        for(int i = 0; i < samples; ++i)
            backgroundAverage += background(normalize(rand3())); // TODO: Fix non-uniformness

        return diffuse * color + ao * (backgroundAverage / float(samples)) * color * ambientLightStrength;
    }
    else {
        return background(pixelDirection());
    }
}