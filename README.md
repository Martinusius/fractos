# Fractos
### JavaScript 3D fractal renderer

- Create highly customizable 3D fractals
- Specialized ray marcher allows the fractals to be rendered in real time
- Use the built-in path tracer to create photorealistic images


### Basic Usage
Fractos depends on [Three.js](https://raw.githubusercontent.com/mrdoob/three.js) and you need to install it before using Fractos.
##### Realtime renderer setup
```ts
// Create fractos canvas inside selector
Fractos.init('body');

// Scene background
const background = new Fractos.ColorBackground(new THREE.Color('rgb(255, 80, 60)'));

// Menger sponge
const fractal = new Fractos.Menger(6 /* Number of iterations */);

const renderer = new Fractos.RealtimeRenderer(fractal, background);

/* Renderer configuration (default values) */
renderer.color = new THREE.Color('rgb(255, 255, 255)' /* Color of the fractal */);
renderer.sunColor = new THREE.Color('rgb(255, 255, 255)');
renderer.sunDirection = new THREE.Vector3(-0.5, -2, -1);
renderer.enableShadows = true;


/* Configure the camera (THREE.PerspectiveCamera) */
Fractos.camera.fov = 90;
```


##### Path tracer setup
```ts
// Create fractos canvas inside selector
Fractos.init('body');

// Scene background
const background = new Fractos.ImageBackground(/* Insert your own THREE.CubeTexture here */);

// Sierpinski tetrahedron
const fractal = new Fractos.Sierpinski(12 /* Number of iterations */);

const pathTracer = new Fractos.PathTracer(fractal, background);
pathTracer.color = new THREE.Color('rgb(255, 255, 255)' /* Color of the fractal */);
pathTracer.sunDirection = new THREE.Vector3(-0.5, -2, -1);

// Every pixel will be split into 8x8 subpixels which will be averaged to get the final pixel color
pathTracer.pixelDivisions = 8;

// Render the image (1080x1080 pixels)
pathTracer.renderImage(1080, 1080);
```


### Fractal transformations
To make interesting fractals you can take an already existing simple fractal (such as Menger sponge or Sierpinski tetrahedron) and apply some transformations (such as translation, rotation and scaling) during its iterations. This is how you do it with Fractos:

```ts
const fractal = new Fractos.Menger(8);

// Rotate 15 degrees then translate along the x coordinate
fractal.transform = ['rotateX(15)', 'translate(0.1, 0, 0)'];

// There's often more than one part of the iteration where transformations can be applied
// Other groups of transformations are then labeled as transform<index>
fractal.transform2 = ['scale(1, 1, 0.8)'];
```

When scaling it's recommended to choose numbers lower or equal to 1 otherwise rendering artifacts might appear

The full list of transformations is:

`translate(x, y, z)` `rotateX(angle)` `rotateY(angle)` `rotateZ(angle)` `rotate(axis, angle)` `scale(x, y, z)`

`absX()` `absY()` `absZ()` `abs()`


### Post processing

Fractos also includes a simple post processing setup. The most common use case is to apply tone mapping to the image however it is also able to perform some basic color adjustments such as contrast, brightness, saturation.


##### With realtime renderer
```ts
const renderer = new Fractos.RealtimeRenderer(fractal, background);

// Apply filmic tone mapping and increase the contrast by 50%
renderer.postprocess = ['filmic()', 'contrast(1.5)'];
```
##### With path tracer
```ts
const pathTracer = new Fractos.PathTracer(fractal, background);

// Apply filmic tone mapping and increase the contrast by 50%
pathTracer.renderImage(1080, 1080).then(image => image.postprocess('filmic()', 'contrast(1.5)'));
```


### Example Images (Path Traced)

![Fractos image](./images/image0.jpg)
![Fractos image](./images/image1.jpg)
![Fractos image](./images/image2.jpg)
![Fractos image](./images/image3.jpg)

