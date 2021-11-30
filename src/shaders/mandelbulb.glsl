uniform int sdf_iterations;
uniform float sdf_power;

/*float sdf(vec3 pos) {
    const int sdf_iterations = 6;
    const float sdf_power = 4.0;

    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;

    for (int i = 0; i < sdf_iterations; ++i) {
        r = length(z);
        if (r > 2.0) break;
        
        // convert to polar coordinates
        float theta = acos(z.z/r);
        float phi = atan(z.y,z.x);
        dr = pow(r, sdf_power - 1.0) * sdf_power * dr + 1.0;
        
        // scale and rotate the point
        float zr = pow(r, sdf_power);
        theta = theta * sdf_power;
        phi = phi * sdf_power;
        
        // convert back to cartesian coordinates
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += pos;
    }

    return 0.5 * log(r) * r / dr;//;
}*/

float sdf(vec3 position) {
    vec3 z = position;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < sdf_iterations; i++) {
        r = length(z);
        if (r > 2.0) break;
        
        // convert to polar coordinates
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr =  pow(r, sdf_power - 1.0) * sdf_power * dr + 1.0;
        
        // scale and rotate the point
        float zr = pow(r, sdf_power);
        theta = theta * sdf_power;
        phi = phi * sdf_power;
        
        // convert back to cartesian coordinates
        z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
        z += position;
    }
    
    return 0.5 * log(r) * r / dr;
}

vec3 csdf(vec3 z) {
    return vec3(1);
}