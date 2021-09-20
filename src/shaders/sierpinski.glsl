uniform int sdf_iterations;
uniform float sdf_scale;
uniform vec3 sdf_rotate;
uniform bool sdf_absX;


float sdf(vec3 z) {
    //trap = vec3(1);

    for(int i = 0; i < sdf_iterations; ++i) {
        if(sdf_absX)
            z.x = abs(z.x);

        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);

        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z *= sdf_scale;
        z -= sdf_scale - 1.0;

        //trap += z;//normalize(z);
    }

    return tetrahedron(z * pow(sdf_scale, -float(sdf_iterations)), pow(sdf_scale, -float(sdf_iterations)));
}