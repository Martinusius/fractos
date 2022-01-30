

float merge(float a, float b, float k){
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float merge(float a, float b) {
    return min(a, b);
}

float subtract(float a, float b) {
    return max(a, -b);
}

float intersect(float a, float b) {
    return max(a, b);
}


float sphere(vec3 p, float r) {
    return length(p) - r;
}

float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);
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

vec3 rotate(vec3 z, float axisX, float axisY, float axisZ, float angle) {
    vec4 u = vec4(z, 1);
    u *= rotationMatrix(vec3(axisX, axisY, axisZ), angle * DEG_TO_RAD);
    return u.xyz;
}

vec3 rotateX(vec3 z, float angle) {
    return (vec4(z, 1) * rotationMatrix(vec3(1, 0, 0), angle * DEG_TO_RAD)).xyz;
}
vec3 rotateY(vec3 z, float angle) {
    return (vec4(z, 1) * rotationMatrix(vec3(0, 1, 0), angle * DEG_TO_RAD)).xyz;
}
vec3 rotateZ(vec3 z, float angle) {
    return (vec4(z, 1) * rotationMatrix(vec3(0, 0, 1), angle * DEG_TO_RAD)).xyz;
}

vec3 absX(vec3 z) {
    return vec3(abs(z.x), z.y, z.z);
}
vec3 absY(vec3 z) {
    return vec3(z.x, abs(z.y), z.z);
}
vec3 absZ(vec3 z) {
    return vec3(z.x, z.y, abs(z.z));
}

vec3 translate(vec3 p, float x, float y, float z) {
    return p + vec3(x, y, z);
}

vec3 scale(vec3 p, float x, float y, float z) {
    return p * vec3(x, y, z);
}

vec3 scale(vec3 p, float s) {
    return p * s;
}


float tetrahedron(vec3 p, float r) {
    float md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z),
              max(-p.x + p.y + p.z, p.x - p.y + p.z));
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