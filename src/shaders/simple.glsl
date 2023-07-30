uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float aoStrength;
uniform bool enableShadows;
uniform float roughness;

uniform vec3 color;

float calculateDirectLight(vec3 position, vec3 normal, float epsilon) {
    if(enableShadows) {
        Ray shadowRay = raycastEpsilon(position + normal * 2.0 * epsilon, -sunDirection, epsilon);
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
        sum += pow(2.0, -fi) * (fi * delta - sdf(p + n * fi * delta));
    }
    return 1.0 - k * sum;
}

/*float tracerAO(vec3 position, vec3 normal, float epsilon) {

    float luminance = 1.0;

    for(int i = 0; i < 5; ++i) {
        Ray tracer = raycastEpsilon(position + normal * 2.0 * epsilon, normal, epsilon);

        if(!tracer.hit) break;

        luminance *= 0.5;
        position = tracer.position;
        normal = normalize(tracer.normal);
    }

    return luminance;
    

}*/

uniform int pixelDivisions;

vec3 shading() {
    vec3 total = vec3(0);

    for(int x = 0; x < pixelDivisions; x++) {
        for(int y = 0; y < pixelDivisions; y++) {
            seed = subpixelCoord(x, y, pixelDivisions);
            vec3 rayDirection = subpixelDirection(x, x, pixelDivisions);

            Ray ray = raycast(cameraPos, rayDirection);

            if(ray.hit) {
                if(ray.steps == 0.0) {
                    return vec3(0);
                }

                const int samples = 4;
                vec3 backgroundAverage = vec3(0);
                float lerpFactor = roughness * roughness;

                vec3 reflected = reflect(ray.direction, ray.normal);

                for(int i = 0; i < samples; ++i)  {
                    vec3 random = normalize(rand3() * 2.0 - 1.0); // TODO: Fix non-uniformness
                    backgroundAverage += linear(background(normalize(mix(reflected, random, lerpFactor)))) * mix(max(dot(reflected, ray.normal), 0.0), 1.0, lerpFactor);
                }

                vec3 scolor = linear(color);


                vec3 indirect = (backgroundAverage / float(samples)) * scolor * pow(ray.steps, -0.6);
                vec3 direct = calculateDirectLight(ray.position, ray.normal, ray.epsilon) * scolor;
            
                total += indirect + direct;
            }
            else {
                total += background(ray.direction);
            }
        }
    }

    return total / float(pixelDivisions * pixelDivisions);
    
    //Ray ray = pixelRaycast();
    
    
}