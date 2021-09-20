uniform int sdf_iterations;
uniform float sdf_offset;
uniform vec3 sdf_scale;
uniform vec3 sdf_translate;
uniform vec3 sdf_rotate;
uniform vec3 sdf_rotate2;

/*float sdf(vec3 z) {


    for(int i = 0; i < sdf_iterations; ++i) {
        z = abs(z);

        if(sdf_rotation.x != 0.0 || sdf_rotation.y != 0.0 || sdf_rotation.z != 0.0)
            z = rotate(z, sdf_rotation);


        if(z.x - z.y < 0.0) z.xy = z.yx;
        if(z.x - z.z < 0.0) z.xz = z.zx;
        if(z.y - z.z < 0.0) z.zy = z.yz;
        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        if(sdf_rotation2.x != 0.0 || sdf_rotation2.y != 0.0 || sdf_rotation2.z != 0.0)
            z = rotate(z, sdf_rotation2);

        z *= vec3(3.0, 3.0, 3.0);
        z -= vec3((sdf_scale - 1.0) * sdf_offset.x, (sdf_scale - 1.0) * sdf_offset.y, 0.0);

        if(z.z > 0.5 * sdf_offset.z * (sdf_scale - 1.0)) z.z -= sdf_offset.z * (sdf_scale - 1.0);   
    }


    

    return box(z * pow(sdf_scale, float(-sdf_iterations)), vec3(pow(sdf_scale, float(-sdf_iterations))));
}*/

float sdf(vec3 z) {
    const float scale = 3.0;

    for(int i = 0; i < sdf_iterations; ++i) {
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

        // 3 3 1
        // 2 2 1

        z *= vec3(3, 3, 3) * sdf_scale;
        z += vec3(-2, -2, 0) + sdf_translate;

        if(z.z > 1.0 * sdf_offset) z.z -= 2.0 * sdf_offset;
    }

    return box(z * pow(scale, float(-sdf_iterations)), vec3(pow(scale, float(-sdf_iterations))));
}
