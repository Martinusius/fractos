uniform int sdf_iterations;
uniform float sdf_offset;
uniform vec3 sdf_scale;
uniform vec3 sdf_translate;
uniform vec3 sdf_rotate2;


uniform int sdf_coloringIterations;

float sdf(vec3 z) {
    for(int i = 0; i < sdf_iterations; ++i) {
        
        TRANSFORM0

        z = abs(z);
        
        if(z.x - z.y < 0.0) z.xy = z.yx;
        if(z.x - z.z < 0.0) z.xz = z.zx;
        if(z.y - z.z < 0.0) z.zy = z.yz;
        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z.z -= 1.0 / 3.0;
        z.z = -abs(z.z);
        z.z += 1.0 / 3.0;

        TRANSFORM1

        z *= vec3(3, 3, 3);
        z += vec3(-2, -2, 0);

        //if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;

    }

    return box(z * pow(3.0, float(-sdf_iterations)), vec3(pow(3.0, float(-sdf_iterations))));
}

vec3 csdf(vec3 z) {

    /*trap = abs(z);

    for(int i = 0; i < sdf_coloringIterations; ++i) {
        
        TRANSFORM0

        z = abs(z);
        
        if(z.x - z.y < 0.0) z.xy = z.yx;
        if(z.x - z.z < 0.0) z.xz = z.zx;
        if(z.y - z.z < 0.0) z.zy = z.yz;
        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z.z -= 1.0 / 3.0;
        z.z = -abs(z.z);
        z.z += 1.0 / 3.0;

        TRANSFORM1

        z *= vec3(3, 3, 3);
        z += vec3(-2, -2, 0);

        //if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;
        trap = sampleOrbit(trap, z);
    }

    return trap;*/
    return vec3(1);
}

