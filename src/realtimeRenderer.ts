import * as THREE from "three";
import { createShader, render, renderer, setResolution, Utils } from "./setup";

// @ts-ignore
import simple from "./shaders/simple.glsl";

import Queue, { setAutoResize } from "./queue";
import { Background, ColorBackground } from "./background";
import { core } from "./core";

import { TemporaryImage } from "./postprocessing";
import Timer from "./timer";
import SDF from "./sdf";

function normalize(vector: THREE.Vector3) {
  vector.normalize();
  return vector;
}

export class RealtimeRenderer {
  private shader: THREE.ShaderMaterial;
  private target: THREE.WebGLRenderTarget;

  public set sdf(value: SDF) {
    this._sdf = value;

    this.step = value.stepCount;

    this.shader.fragmentShader = core + simple + this._sdf.glsl + this._background.glsl;
    this.shader.needsUpdate = true;
  }

  public set background(value: Background) {
    this._background = value;
    this.shader.fragmentShader = core + simple + this._sdf.glsl + this._background.glsl;
    this.shader.needsUpdate = true;
  }

  public get sdf() {
    return this._sdf;
  }

  public get background() {
    return this._background;
  }

  private _background: Background;
  private _sdf: SDF;

  public enableShadows = true;
  public aoStrength = 1.0;
  public sunDirection = new THREE.Vector3(-0.5, -2, -1);
  public sunColor = new THREE.Vector3(1, 1, 1);
  public roughness = 1.0;

  public epsilon = 0.0001;
  public adaptiveEpsilon = true;
  public epsilonScale = 0.0005;

  public color = new THREE.Color(1, 1, 1);

  public pixelDivisions = 1;

  // Animation timer
  public timer = new Timer();
  public animationDuration: number = 1;

  public get time() {
    return this.timer.get();
  }

  public set time(value: number) {
    this.timer.set(value);
  }

  public lastImage: TemporaryImage | null = null;

  // Postprocessing steps
  public postprocess: string[] = [];

  public step: number;

  constructor(
    fractal: SDF = new SDF("cube()"),
    background: Background = new ColorBackground(new THREE.Color("white"))
  ) {
    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

    this._sdf = fractal;
    this._background = background;

    this.step = this._sdf.stepCount;
    this.shader = this.initShader();
  }

  private initShader() {
    return createShader(core + simple + this._sdf.glsl + this._background.glsl, {
      rasterizerColor: { value: null },
      rasterizerDepth: { value: null },
      sunDirection: { value: normalize(this.sunDirection) },
      time: { value: 0 },
      ...Utils.createUniformsFromVariables<RealtimeRenderer>(
        this,
        "enableShadows",
        "aoStrength",
        "sunColor",
        "sunDirection",
        "epsilon",
        "adaptiveEpsilon",
        "epsilonScale",
        "roughness",
        "color",
        "step",
        "pixelDivisions"
      ),
      ...Utils.objectToUniforms(this._background, "bg_"),
    });
  }

  renderImage(width: number, height: number, time = 0) {
    Queue.cancel();
    setAutoResize(false);
    setResolution(width, height);

    const targetSize = new THREE.Vector2(width, height);
    const textureSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);

    if (!targetSize.equals(textureSize)) {
      this.target.dispose();

      this.target = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      });
    }

    Utils.setUniformsFromObject(this.shader, this.background, "bg_");

    this.shader.uniforms.time.value = time;
    this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);

    Utils.setUniformsFromVariables<RealtimeRenderer>(
      this.shader,
      this,
      "enableShadows",
      "aoStrength",
      "sunColor",
      "sunDirection",
      "epsilon",
      "adaptiveEpsilon",
      "epsilonScale",
      "roughness",
      "color",
      "step",
      "pixelDivisions"
    );

    render(this.shader, this.target);

    this.lastImage = new TemporaryImage(this.target);
    return this.lastImage;
  }

  start(onFrame = () => {}) {
    setAutoResize(true);

    Queue.loop(() => {
      onFrame();

      const size = new THREE.Vector2();
      renderer.getSize(size);
      const targetSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);

      if (!size.equals(targetSize)) {
        this.target.dispose();
        this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
      }

      Utils.setUniformsFromObject(this.shader, this.background, "bg_");

      this.shader.uniforms.time.value = this.time / this.animationDuration;
      this.shader.uniforms.rasterizerColor.value = this.target.texture;
      this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);

      Utils.setUniformsFromVariables<RealtimeRenderer>(
        this.shader,
        this,
        "enableShadows",
        "aoStrength",
        "sunColor",
        "sunDirection",
        "epsilon",
        "adaptiveEpsilon",
        "epsilonScale",
        "roughness",
        "color",
        "step",
        "pixelDivisions"
      );

      render(this.shader, this.target);

      this.lastImage = new TemporaryImage(this.target);
      this.lastImage.postprocess("sRGB", ...this.postprocess).show();
    });
  }
}
