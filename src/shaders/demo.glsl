uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float aoStrength;
uniform bool enableShadows;
uniform float roughness;

uniform vec3 color;

struct Operation {
    int type;
    vec3 value;
}

float calculateDirectLight(vec3 position, vec3 normal, float epsilon) {
    if(enableShadows) {
        Ray shadowRay = raycastEpsilon(position + normal * 2.0 * epsilon, -sunDirection, epsilon);
        return shadowRay.hit ? 0.0 : max(dot(normal, -sunDirection), 0.0);
    } else {
        return max(dot(normal, -sunDirection), 0.0);
    }
}

float statixAO(vec3 p, vec3 n, float k, float delta) {
    float sum = 0.0;
    for(int i = 1; i <= 5; ++i) {
        float fi = float(i);
        sum += pow(2.0, -fi) * (fi * delta - sdf(p + n * fi * delta));
    }
    return k * sum;
}

float tracerAO(vec3 position, vec3 normal, float epsilon) {

    float luminance = 1.0;

    for(int i = 0; i < 5; ++i) {
        Ray tracer = raycastEpsilon(position + normal * 2.0 * epsilon, normal, epsilon);

        if(!tracer.hit)
            break;

        luminance *= 0.5;
        position = tracer.position;
        normal = normalize(tracer.normal);
    }

    return luminance;

}

float intersectPlane(vec3 rayOrigin, vec3 rayDir, vec3 planeNormal, vec3 planePoint) {
    float d = dot(planeNormal, planePoint);
    float t = (d - dot(planeNormal, rayOrigin)) / dot(planeNormal, rayDir);
    return t;
}

float pdist(vec3 p, vec4 n) {
    return dot(p, n.xyz) + n.w;
}

vec2 plane(vec3 ro, vec3 rd, vec3 pn, vec3 po, float size) {
    pn = normalize(pn);

    float t = intersectPlane(ro, rd, pn, po);
    vec3 p = ro + rd * t;

    vec3 l = normalize(cross(pn, vec3(0, 1, 0)));
    float dl = pdist(p, vec4(l, 0));

    return vec2(t, max(abs(dl), abs(p.y) / length(pn.xz)) < size ? 1.0 : 0.0);
}

vec3 shading() {
    Ray ray = pixelRaycast();

    vec2 plan = plane(ray.origin, ray.direction, vec3(1, 1, 1), vec3(0), 2.0);

    if(ray.hit) {
        if(ray.steps == 0.0) {
            return vec3(0);
        }

        const int samples = 4;
        vec3 backgroundAverage = vec3(0);
        float lerpFactor = roughness * roughness;

        for(int i = 0; i < samples; ++i) {
            vec3 random = normalize(rand3() * 2.0 - 1.0); // TODO: Fix non-uniformness
            vec3 reflected = reflect(ray.direction, ray.normal);
            backgroundAverage += background(normalize(mix(reflected, random, lerpFactor))) * mix(max(dot(reflected, ray.normal), 0.0), 1.0, lerpFactor);
        }

        //float ao = 1.0 / (ray.steps) / ambientOcclusionStrength;
        vec3 scolor = clamp(color, 0.0, 1.0);

        vec3 indirect = (backgroundAverage / float(samples)) * scolor * pow(ray.steps, -0.2);
        vec3 direct = calculateDirectLight(ray.position, ray.normal, ray.epsilon) * sunColor * scolor;

        vec3 additional = length(ray.position - cameraPos) < plan.x ? vec3(1) : vec3(1, 1, 0.5);

        return (indirect + direct) * mix(vec3(1), additional, plan.y);
    } else {
        return background(ray.direction) * mix(vec3(1), vec3(1, 1, 0.5), plan.y);
    }
}