# Fractos
### JavaScript 3D fractal renderer

- Create highly customizable 3D fractals
- Specialized ray marcher allows the fractals to be rendered in real time
- Use the ray tracer to create photorealistic images
- [WIP] Create animations using the ray marcher (or ray tracer if you have)

All of these images were created using fractos

### Usage
Fractos is based on three.js which means some of the parameters are three.js objects such as THREE.Color and THREE.Vector3

```ts
const background = new ColorBackground(new THREE.Color('rgb(255, 80, 60)'));
const fractal = new Menger(6 /* Number of iterations */);

const renderer = new RealtimeRenderer(fractal, background);

/* Renderer configuration (default values) */
renderer.color = new THREE.Color('rgb(255, 255, 255)' /* Color of the fractal */);
renderer.ambientLightStrength = 1.0;
renderer.sunStrength = 1.0;
renderer.sunDirection = new THREE.Vector3(-0.5, -2, -1);
renderer.enableShadows = true;

/* Configure the camera (THREE.PerspectiveCamera) */
camera.fov = 90;
```


