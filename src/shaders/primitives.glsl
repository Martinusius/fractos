

float smoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float smoothDifference( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d1+d2)/k, 0.0, 1.0 );
    return mix( d1, -d2, h ) + k*h*(1.0-h);
}

float smoothIntersection( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) + k*h*(1.0-h);
}

float _union(float a, float b) {
    return min(a, b);
}

float difference(float a, float b) {
    return max(a, -b);
}

float intersection(float a, float b) {
    return max(a, b);
}

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



// Transitions

float between(float a, float b) {
    return mix(a, b, mod(time, 1.0));
}

vec3 between(vec3 a, vec3 b) {
    return mix(a, b, mod(time, 1.0));
}



// Shapes

float sphere(vec3 p, float r) {
    return length(p) - r;
}

float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);
}

float cube(vec3 p, float b) {
    return box(p, vec3(b));
}

float torus(vec3 p, vec2 t){
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}


float tetrahedron(vec3 p, float r) {
    float md = max(max(-p.x + p.y - p.z, p.x - p.y - p.z),
              max(-p.x - p.y + p.z, p.x + p.y + p.z));
    return (md - r) / sqrt(3.0);
}

float octahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
        if(3.0 * p.x < m) q = p.xyz;
    else if(3.0 * p.y < m) q = p.yzx;
    else if(3.0 * p.z < m) q = p.zxy;
    else return m*0.57735027;
        
    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s); 
    return length(vec3(q.x, q.y - s + k, q.z - k)); 
}


struct SDF {
    vec3 z;
    float s;
};

void translate(inout SDF sdf, float x, float y, float z, float animation) {
    sdf.z += animation * vec3(x, -y, z);
}

void translateX(inout SDF sdf, float x, float animation) {
    sdf.z.x += animation * x;
}

void translateY(inout SDF sdf, float y, float animation) {
    sdf.z.y -= animation * y;
}

void translateZ(inout SDF sdf, float z, float animation) {
    sdf.z.z += animation * z;
}

void scale(inout SDF sdf, float v, float animation) {
    sdf.z /= mix(1.0, v, animation);
    sdf.s *= mix(1.0, v, animation);
}

void mirror(inout SDF sdf, float x, float y, float z, float animation) {
    vec3 n = vec3(x, -y, z);

    float d = min(0.0, dot(sdf.z, n));
    sdf.z = sdf.z - animation * 2.0 * d * n;
}

void rotateX(inout SDF sdf, float angle, float animation) {
    sdf.z = (vec4(sdf.z, 1) * rotationMatrix(vec3(1, 0, 0), angle * DEG_TO_RAD * animation)).xyz;
}
void rotateY(inout SDF sdf, float angle, float animation) {
    sdf.z = (vec4(sdf.z, 1) * rotationMatrix(vec3(0, 1, 0), angle * DEG_TO_RAD * animation)).xyz;
}
void rotateZ(inout SDF sdf, float angle, float animation) {
    sdf.z = (vec4(sdf.z, 1) * rotationMatrix(vec3(0, 0, 1), angle * DEG_TO_RAD * animation)).xyz;
}

void rotate(inout SDF sdf, float ax, float ay, float az, float angle, float animation) {
    vec3 a = normalize(vec3(ax, ay, az));
    sdf.z = (vec4(sdf.z, 1) * rotationMatrix(a, angle * DEG_TO_RAD * animation)).xyz;
}