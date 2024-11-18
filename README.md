# Fractos

### JavaScript 3D fractal renderer

- Create highly customizable 3D fractals
- Specialized ray marcher allows the fractals to be rendered in real time
- Use the built-in path tracer to create photorealistic images

### Basic Usage

Fractos depends on [Three.js](https://raw.githubusercontent.com/mrdoob/three.js). Install it using npm or include a script tag in your html.

##### Realtime renderer setup

```ts
// Initialize fractos with the canvas inside the body element
Fractos.init("body"); // Any css selector can be used

// Scene background
const background = new Fractos.ColorBackground(
  new THREE.Color("rgb(255, 80, 60)")
);

// Menger sponge
const fractal = new Fractos.Menger(6 /* Number of iterations */);

const renderer = new Fractos.RealtimeRenderer(fractal, background);

/* Renderer configuration (default values) */
renderer.color = new THREE.Color(
  "rgb(255, 255, 255)" /* Color of the fractal */
);
renderer.sunColor = new THREE.Color("rgb(255, 255, 255)");
renderer.sunDirection = new THREE.Vector3(-0.5, -2, -1);
renderer.enableShadows = true;

/* Configure the camera (THREE.PerspectiveCamera) */
Fractos.camera.fov = 90;

renderer.start();
```

##### Path tracer setup

```ts
// Initialize fractos with the canvas inside the body element
Fractos.init("body");

// Scene background
const background =
  new Fractos.ImageBackground(/* Insert your own THREE.CubeTexture here */);

// Sierpinski tetrahedron
const fractal = new Fractos.Sierpinski(12 /* Number of iterations */);

const pathTracer = new Fractos.PathTracer(fractal, background);
pathTracer.color = new THREE.Color(
  "rgb(255, 255, 255)" /* Color of the fractal */
);
pathTracer.sunDirection = new THREE.Vector3(-0.5, -2, -1);

// Every pixel will be split into 8x8 subpixels (one sample each) which will be averaged to get the final pixel color
pathTracer.pixelDivisions = 8; // This number is effectively the square root of the amount of samples per pixel

// Render the image (1080x1080 pixels)
pathTracer.renderImage(1080, 1080);
```

### Custom fractals

You can also create your own custom fractals. Use a simple javascript syntax to describe the steps to create the fractal. For example this is how you could create the Menger sponge:

```ts
const fractal = new Fractos.SDF(() => {
  cube();

  for (let i = 0; i < 5; i++) {
    scale(1 / 3);
    translate(0, 0, -1 / 3);
    mirror(0, 0, 1);
    translate(0, 0, 1 / 3);

    translate(-2 / 3, 2 / 3, 0);

    mirror(0, -1, 1);
    mirror(1, 0, 1);
    mirror(0, 0, -1);
    mirror(1, 0, 0);
    mirror(0, -1, 0);
  }
});
```

First we create a cube using the `cube()` function. We can then describe the fractal iteration and execute it multiple times using a simple for loop. You can use transformation functions such as `translate(x, y, z)`, `translateX(x)`, `translateY(y)`, `translateZ(z)`, `rotateX(degrees)`, `rotateY(degrees)`, `rotateZ(degrees)` and `scale(s)`. These transformations are applied to all objects currently in the scene.

The same applies to the `mirror` functions. You can use those to duplicate existing objects in the scene. The mirror is defined by a plane (represented by it's normal vector) and it mirrors objects from one side to another. The objects are mirrored in the direction of the plane normal vector.

You can either call the `mirror` function with it's corresponding normal vector coordinates, `mirror(nx, ny, nz)`, or you can use these handy aliases: `mirrorLeft()`, `mirrorRight()`, `mirrorUp()`, `mirrorDown()`, `mirrorFront()`, `mirrorBack()`.

The `cube()` call can also be replaced with other shapes such as: `sphere()`, `tetrahedron()`, `torus()`. You can also adjust these shapes by providing parameters to their corrresponding functions: `cube({ size: 2})`, `sphere({ radius: 0.5 })`, `tetrahedron({ radius: 0.69 })`, `torus({ radius: 2 / 3, tube: 1 / 5 })`. The amount of shapes you can create at the same time is unlimited and they can be created at any point during the fractal creation process.

To give one more example, this is how you could create the Sierpinski tetrahedron:

```ts
const fractal = new Fractos.SDF(() => {
  tetrahedron();

  for (let i = 0; i < 10; i++) {
    translate(-1, -1, -1);
    scale(1 / 2);

    mirror(1, 1, 0);
    mirror(1, 0, 1);
    mirror(0, 1, 1);
  }
});
```

The fractal creation function can also be provided in the form of a string:

```ts
const fractal = new Fractos.SDF(`
  tetrahedron();

  for (let i = 0; i < 10; i++) {
    translate(-1, -1, -1);
    scale(1 / 2);

    mirror(1, 1, 0);
    mirror(1, 0, 1);
    mirror(0, 1, 1);
  }
`);
```

WARNING: The provided code needs to be evaluated first before the fractal can be rendered. If the code contains an infinite loop, the entire page will stop responding. In situations where you cannot verify whether the code does or does not contain an infinite loop, you can create the fractal safely like this:

```ts
const fractal =
  await Fractos.SDF.createInSandbox(/* function or code string */);
```

The code will terminate after the function execution time exceeds 100ms. In that case an error is thrown.

### Post processing

Fractos also includes a simple post processing setup. The most common use case is to apply tone mapping to the image, however it is also able to perform some basic color adjustments such as changing the contrast, brightness or saturation.

##### With realtime renderer

```ts
const renderer = new Fractos.RealtimeRenderer(fractal, background);

// Apply filmic tone mapping and increase the contrast by 50%
renderer.postprocess = ["filmic()", "contrast(1.5)"];
```

##### With path tracer

```ts
const pathTracer = new Fractos.PathTracer(fractal, background);

// Apply filmic tone mapping and increase the contrast by 50%
pathTracer
  .renderImage(1080, 1080)
  .then((image) => image.postprocess("filmic()", "contrast(1.5)"));
```

### Example Images (Path Traced)

![Fractos image](./images/image0.jpg)
![Fractos image](./images/image1.jpg)
![Fractos image](./images/image2.jpg)
![Fractos image](./images/image3.jpg)
