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
Fractos.init('body'); // Any css selector can be used

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
// Initialize fractos with the canvas inside the body element
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
One of the ways to create an interesting fractal shape is to take an already existing fractal (such as the Menger sponge or the Sierpinski tetrahedron) and to apply some transformations (such as translation, rotation and scaling) during its iterations. This is how you do it with Fractos:

```ts
const fractal = new Fractos.Menger(8);

// Rotate 15 degrees around the x axis then translate 0.1 along the y axis
fractal.transform = ['rotateX(15)', 'translate(0, 0.1, 0)'];

// There's often more than one part of the iteration where transformations can be applied
fractal.transform2 = ['scale(1, 1, 0.8)'];
```
For the most part it is not easy to tell what a particular set of transformations is going to look like. Usually the best way to find one that produces an interesting shape is by trial and error.

WARNING: When scaling it's recommended to choose numbers lower or equal to 1 otherwise rendering artifacts might appear.

The full list of transformations is:

`translate(x, y, z)` `rotateX(angle)` `rotateY(angle)` `rotateZ(angle)` `rotate(axisX, axisY, axisZ, angle)` `scale(x, y, z)`

`absX()` `absY()` `absZ()` `abs()`


### Post processing

Fractos also includes a simple post processing setup. The most common use case is to apply tone mapping to the image, however it is also able to perform some basic color adjustments such as changing the contrast, brightness or saturation.


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

