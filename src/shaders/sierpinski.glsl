uniform int sdf_iterations;
uniform float sdf_scale;

float sdf(vec3 z) {

    for(int i = 0; i < sdf_iterations; ++i) {
        TRANSFORM0

        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        TRANSFORM1

        z *= sdf_scale;
        z += 1.0 - sdf_scale;
    }

    return tetrahedron(z * pow(sdf_scale, -float(sdf_iterations)), pow(sdf_scale, -float(sdf_iterations)));
}