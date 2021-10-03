uniform int sdf_iterations;
uniform float sdf_scale;
uniform vec3 sdf_rotate;
uniform vec3 sdf_translate;
uniform bool sdf_absX;
uniform int sdf_coloringIterations;


float sdf(vec3 z) {

    for(int i = 0; i < sdf_iterations; ++i) {
        if(sdf_absX)
            z.x = abs(z.x);

        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);

        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z *= sdf_scale;
        z += vec3(1, 1, 1) + sdf_translate - sdf_scale;
    }

    return tetrahedron(z * pow(sdf_scale, -float(sdf_iterations)), pow(sdf_scale, -float(sdf_iterations)));
}

vec3 csdf(vec3 z) {
    vec3 trap = abs(z);

    for(int i = 0; i < sdf_coloringIterations; ++i) {
        if(sdf_absX)
            z.x = abs(z.x);

        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);

        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z *= sdf_scale;
        z += vec3(1, 1, 1) + sdf_translate - sdf_scale;

        trap = sampleOrbit(trap, z);
    }

    return trap;
}