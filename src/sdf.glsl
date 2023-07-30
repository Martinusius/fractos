const _ANIMATION = "clamp(step - (steps -= 1.0), 0.0, 1.0)";
const _STEPS = [];

function float(arg) {
  return String(arg).replace(/(?<![a-zA-Z\.\d])(\d+)(?![\.\d])/g, "$1.0");
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/*function union(objects, radius = 0) {
  if (!isNumber(radius)) throw new Error("Union: Radius must be a number");
  if (radius < 0) throw new Error("Union: Radius must be greater than or equal to 0");

  const invalid = objects.findIndex((object) => typeof object !== "string" || !object.startsWith(_VERIFY));

  if (invalid !== -1) {
    throw new Error("Union: Invalid object at index ${invalid}");
  }

  if (objects.length === 1) throw new Error("Intersection requires at least 2 objects");
  if (objects.length === 2) return radius > 0 ? `smoothUnion(${objects[0]}, ${objects[1]}, ${float(radius)} / data.s)` : `_union(${objects[0]}, ${objects[1]})`;

  const [firstObject, ...otherObjects] = objects;

  if (otherObjects.length === 0) return firstObject;

  return _VERIFY + (radius > 0 ? `smoothUnion(${firstObject}, ${union(otherObjects)}, ${float(radius)} / data.s)` : `_union(${firstObject}, ${union(otherObjects)})`);
}

function intersection(objects, radius = 0) {
  if (!isNumber(radius)) throw new Error("Intersection: Radius must be a number");
  if (radius < 0) throw new Error("Intersection: Radius must be greater than or equal to 0");

  const invalid = objects.findIndex((object) => typeof object !== "string" || !object.startsWith(_VERIFY));

  if (invalid !== -1) {
    throw new Error("Union: Invalid object at index ${invalid}");
  }

  if (objects.length === 1) throw new Error("Intersection requires at least 2 objects");
  if (objects.length === 2) return radius > 0 ? `smoothIntersection(${objects[0]}, ${objects[1]}, ${float(radius)} / data.s)` : `intersection(${objects[0]}, ${objects[1]})`;

  const [firstObject, ...otherObjects] = objkects;

  if (otherObjects.length === 0) return firstObject;

  return _VERIFY + (radius > 0 ? `smoothIntersection(${firstObject}, ${intersection(otherObjects)}, ${float(radius)} / data.s)` : `intersection(${firstObject}, ${intersection(otherObjects)})`);
}

function difference(objects, radius = 0) {
  if (!isNumber(radius)) throw new Error("Difference: Radius must be a number");
  if (radius < 0) throw new Error("Difference: Radius must be greater than or equal to 0");

  const invalid = objects.findIndex((object) => typeof object !== "string" || !object.startsWith(_VERIFY));

  if (invalid !== -1) {
    throw new Error("Union: Invalid object at index ${invalid}");
  }

  if (objects.length !== 2) throw new Error("Difference requires exactly 2 objects");

  return _VERIFY + (radius > 0 ? `smoothDifference(${objects[0]}, ${objects[1]}, ${float(radius)} / data.s)` : `difference(${objects[0]}, ${objects[1]})`);
}*/

function shape(u) {
  _STEPS.push(`dist = min(dist, ${u})`);
}

function sphere(properties = {}) {
  properties.radius = properties.radius ?? 1;

  shape(`sphere(data.z, ${float(properties.radius)}) * data.s`);
}

function tetrahedron(properties = {}) {
  properties.radius = properties.radius ?? 1;

  shape(`tetrahedron(data.z, ${float(properties.radius)}) * data.s`);
}

function box(properties = {}) {
  properties.size = properties.size ?? [1, 1, 1];

  shape(`box(data.z, vec3(${properties.size
    .map((coord) => `${float(coord)}`)
    .join(", ")})) * data.s`);
}

function cube(properties = {}) {
  properties.center = properties.center ?? [0, 0, 0];
  properties.size = properties.size ?? 1;

  box({ center: properties.center, size: [properties.size, properties.size, properties.size] });
}

function torus(properties = {}) {
  properties.center = properties.center ?? [0, 0, 0];
  properties.radius = properties.radius ?? 1;
  properties.tube = properties.tube ?? 0.25;

  shape(`torus(data.z, vec2(${float(properties.radius)}, ${float(properties.tube)})) * data.s`);
}

function scale(value) {
  if(arguments.length !== 1) throw new Error("Scale: Requires 1 argument");

  _STEPS.push(`scale(data, ${float(value)}, ${_ANIMATION})`);
}

function translate(x, y, z) {
  if(arguments.length !== 3) throw new Error("Translate: Requires 3 arguments");

  _STEPS.push(`translate(data, ${float(x)}, ${float(y)}, ${float(z)}, ${_ANIMATION})`);
}

function translateX(value) {
  if(arguments.length !== 1) throw new Error("TranslateX: Requires 1 argument");

  _STEPS.push(`translateX(data, ${float(value)}, ${_ANIMATION})`);
}

function translateY(value) {
  if(arguments.length !== 1) throw new Error("TranslateY: Requires 1 argument");

  _STEPS.push(`translateY(data, ${float(value)}, ${_ANIMATION})`);
}

function translateZ(value) {
  if(arguments.length !== 1) throw new Error("TranslateZ: Requires 1 argument");

  _STEPS.push(`translateZ(data, ${float(value)}, ${_ANIMATION})`);
}

function rotateX(value) {
  if(arguments.length !== 1) throw new Error("RotateX: Requires 1 argument");

  _STEPS.push(`rotateX(data, ${float(value)}, ${_ANIMATION})`);
}

function rotateY(value) {
  if(arguments.length !== 1) throw new Error("RotateY: Requires 1 argument");

  _STEPS.push(`rotateY(data, ${float(value)}, ${_ANIMATION})`);
}

function rotateZ(value) {
  if(arguments.length !== 1) throw new Error("RotateZ: Requires 1 argument");

  _STEPS.push(`rotateZ(data, ${float(value)}, ${_ANIMATION})`);
}

function mirror(nx, ny, nz) {
  if(arguments.length !== 3) throw new Error("Mirror: Requires 3 arguments");

  const s = Math.sqrt(nx * nx + ny * ny + nz * nz);

  _STEPS.push(`mirror(data, ${float(nx / s)}, ${float(ny / s)}, ${float(nz / s)}, ${_ANIMATION})`);
}

function mirrorUp() {
  mirror(0, 1, 0);
}

function mirrorDown() {
  mirror(0, -1, 0);
}

function mirrorLeft() {
  mirror(-1, 0, 0);
}

function mirrorRight() {
  mirror(1, 0, 0);
}

function mirrorFront() {
  mirror(0, 0, 1);
}

function mirrorBack() {
  mirror(0, 0, -1);
}