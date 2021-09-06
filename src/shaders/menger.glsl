uniform int sdf_iterations;
// uniform vec3 sdf_offset;
uniform vec3 sdf_scale;
uniform vec3 sdf_translate;
uniform vec3 sdf_rotate;
uniform vec3 sdf_rotate2;

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

float sphere(vec3 p, float r) {
    return length(p) - r;
}

float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);
}

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

        if(sdf_rotate.x != 0.0 || sdf_rotate.y != 0.0 || sdf_rotate.z != 0.0)
            z = rotate(z, sdf_rotate);

        if(z.x - z.y < 0.0) z.xy = z.yx;
        if(z.x - z.z < 0.0) z.xz = z.zx;
        if(z.y - z.z < 0.0) z.zy = z.yz;
        if(z.x + z.y < 0.0) z.xy = -z.yx;
        if(z.x + z.z < 0.0) z.xz = -z.zx;
        if(z.y + z.z < 0.0) z.zy = -z.yz;

        z = abs(z);

        // 3 3 1
        // 2 2 1

        z *= vec3(3, 3, 3) * sdf_scale;
        z += vec3(-2, -2, 0) + sdf_translate;

        if(z.z > 1.0) z.z -= 2.0;
    }

    return box(z * pow(scale, float(-sdf_iterations)), vec3(pow(scale, float(-sdf_iterations))));
}
