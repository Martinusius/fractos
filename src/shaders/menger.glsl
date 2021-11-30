uniform int sdf_iterations;
uniform float sdf_offset;
uniform vec3 sdf_scale;
uniform vec3 sdf_translate;
uniform vec3 sdf_rotate;
uniform vec3 sdf_rotate2;
uniform int sdf_coloringIterations;

float sdf(vec3 z) {
    for(int i = 0; i < sdf_iterations; ++i) {
        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);


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

        if(sdf_rotate2.x != 0.0 || sdf_rotate2.y != 0.0 || sdf_rotate2.z != 0.0)
            z = rotate(z, sdf_rotate2);

        z *= vec3(3, 3, 3) * sdf_scale;
        z += vec3(-2, -2, 0) + sdf_translate;

        //if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;

    }

    return box(z * pow(3.0, float(-sdf_iterations)), vec3(pow(3.0, float(-sdf_iterations))));
}

vec3 csdf(vec3 z) {

    trap = abs(z);

    for(int i = 0; i < sdf_coloringIterations; ++i) {
        z = abs(z);

        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);

        if(z.x - z.y < 0.0) z.xy = z.yx;
        if(z.x - z.z < 0.0) z.xz = z.zx;
        if(z.y - z.z < 0.0) z.zy = z.yz;
        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;


        if(sdf_rotate2.x != 0.0 || sdf_rotate2.y != 0.0 || sdf_rotate2.z != 0.0)
            z = rotate(z, sdf_rotate);

        z *= vec3(3, 3, 3) * sdf_scale;
        z += vec3(-2, -2, 0) + sdf_translate;

        if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;

        trap = sampleOrbit(trap, z);
    }

    return trap;
}

