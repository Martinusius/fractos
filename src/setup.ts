import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";

export const renderer = new THREE.WebGLRenderer({
  antialias: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
export const screenSize = new THREE.Vector2();

renderer.extensions.get("EXT_color_buffer_float");
//renderer.setPixelRatio(window.devicePixelRatio);

let element: HTMLElement | null;
export function init(selector: string) {
  element = document.querySelector(selector);

  if (!element) return;
  renderer.setSize(element.clientWidth, element.clientHeight);
  element.appendChild(renderer.domElement);

  renderer.domElement.style.position = "absolute";

  const observer = new ResizeObserver(() => {
    if (!element) return;
    screenSize.set(element.clientWidth - 1, element.clientHeight - 1);

    const canvasSize = new THREE.Vector2();
    renderer.getSize(canvasSize);

    const divisor = Math.max(canvasSize.x / screenSize.x, canvasSize.y / screenSize.y);
    renderer.domElement.style.width = canvasSize.x / divisor + "px";
    renderer.domElement.style.height = canvasSize.y / divisor + "px";
  });

  observer.observe(element);

  return renderer.domElement;
}

export function fullscreen() {
  init("body");
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  document.documentElement.style.width = "100%";
  document.documentElement.style.height = "100%";
  document.documentElement.style.margin = "0";
  document.documentElement.style.overflow = "hidden";
}

export function setResolution(width: number, height: number, fixed = true) {
  renderer.setSize(width, height);
  effectsComposer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  if (!fixed) return;
  const divisor = Math.max(width / screenSize.x, height / screenSize.y);

  renderer.domElement.style.width = width / divisor + "px";
  renderer.domElement.style.height = height / divisor + "px";
  //effectsComposer.setSize(screenSize.x, screenSize.y);
}

const quadScene = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const camera = new THREE.PerspectiveCamera(90, document.body.clientWidth / document.body.clientHeight, 0.01, 10);
camera.position.set(2, 2, 2);
camera.lookAt(new THREE.Vector3(0, 0, 0));

export const controls = new OrbitControls(camera, renderer.domElement);

const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2, 1, 1)) as THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.ShaderMaterial
>;
quadScene.add(quad);

export function setShader(shader: THREE.ShaderMaterial) {
  quad.material = shader;
}

export function getShader() {
  return quad.material;
}

export function createShader(code: string, uniforms: { [uniform: string]: THREE.IUniform } = {}) {
  const shader = new THREE.ShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2() },
      cameraPos: { value: new THREE.Vector3() },
      cameraDirection: { value: new THREE.Vector3() },
      fov: { value: 0 },
      modelView: { value: new THREE.Matrix4() },
      projection: { value: new THREE.Matrix4() },
      ...uniforms,
    },
    vertexShader: "void main(){\ngl_Position = vec4(position, 1.0);\n}\n",
    fragmentShader: code,
  });

  setShader(shader);
  //renderer.compile(quadScene, ortho);

  return shader;
}

export const effectsComposer = new EffectComposer(renderer);
effectsComposer.addPass(new RenderPass(quadScene, ortho));
effectsComposer.addPass(new SMAAPass(document.body.clientWidth, document.body.clientHeight));

export function render(shader: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null = null) {
  quad.material = shader;
  renderer.setRenderTarget(target);

  renderer.getSize(quad.material.uniforms.resolution.value);
  quad.material.uniforms.cameraPos.value.copy(camera.position);
  camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
  quad.material.uniforms.fov.value = (camera.fov / 180.0) * Math.PI;
  quad.material.uniforms.projection.value = camera.projectionMatrix;
  renderer.render(quadScene, ortho);
}

export function renderAA(shader: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null = null) {
  quad.material = shader;
  renderer.setRenderTarget(target);

  renderer.getSize(quad.material.uniforms.resolution.value);
  quad.material.uniforms.cameraPos.value.copy(camera.position);
  camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
  quad.material.uniforms.fov.value = (camera.fov / 180.0) * Math.PI;
  quad.material.uniforms.projection.value = camera.projectionMatrix;

  effectsComposer.render();
}

export class Utils {
  public static objectToUniforms(object: any, prefix = "") {
    const uniforms: Record<string, any> = {};

    for (const [key, value] of Object.entries(object)) {
      if (value instanceof Array) continue;
      uniforms[prefix + key] = { value };
    }

    return uniforms;
  }

  public static setUniformsFromObject(shader: THREE.RawShaderMaterial, object: any, prefix = "") {
    for (const [key, value] of Object.entries(object)) {
      if (value instanceof Array) continue;
      shader.uniforms[prefix + key] = { value };
    }
  }

  public static createUniformsFromVariables<T>(object: T, ...variables: (keyof T)[]) {
    const uniforms: Record<string, THREE.IUniform> = {};
    variables.forEach((variable) => {
      uniforms[variable as string] = { value: object[variable] };
    });
    return uniforms;
  }

  public static setUniformsFromVariables<T>(shader: THREE.ShaderMaterial, object: T, ...uniforms: (keyof T)[]) {
    uniforms.forEach((uniform) => {
      shader.uniforms[uniform as any].value = object[uniform];
    });
  }
}

const scene = new THREE.Scene();

export function renderRaster(target: THREE.WebGLRenderTarget | null = null) {
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
}
