uniform int sdf_iterations;
uniform float sdf_scale;

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

        z *= sdf_scale;
        z += vec3(-2, -2, 0);

        //if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;

    }

    return box(z * pow(sdf_scale, float(-sdf_iterations)), vec3(pow(sdf_scale, float(-sdf_iterations))));
}