uniform int sdf_iterations;
uniform float sdf_scale;
uniform vec3 sdf_rotate;
uniform bool sdf_absX;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 z, vec3 rotation) {
    vec4 u = vec4(z, 1);
    u *= rotationMatrix(vec3(1, 0, 0), rotation.x);
    u *= rotationMatrix(vec3(0, 1, 0), rotation.y);
    u *= rotationMatrix(vec3(0, 0, 1), rotation.z);
    return u.xyz;
}







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