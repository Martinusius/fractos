import * as THREE from "three";
import { downloadJSON } from "./util";
import Queue, { setAutoResize } from "./queue";
import {
  createShader,
  renderer,
  render,
  Utils,
  setResolution,
  camera,
} from "./setup";

// @ts-ignore
import pathTracer from "./shaders/pathTracer.glsl";

import { Background, ColorBackground } from "./background";
import { core } from "./core";
import { TemporaryImage } from "./postprocessing";
import SDF from "./sdf";
import { CanvasEncoder } from "@diffusionstudio/core";

function autoBufferSize(width: number, heigth: number) {
  let owidth = width;
  let oheight = heigth;

  let widthDiv = 1;
  let heightDiv = 1;

  while (width * heigth > 1600000) {
    if (width > heigth) {
      width = owidth / ++widthDiv;
    } else {
      heigth = oheight / ++heightDiv;
    }
  }

  return { x: width, y: heigth };
}

function humanReadableTime(ms: number) {
  const milliseconds = Math.floor(ms % 1000);
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((seconds / 60) % 60);
  const hours = Math.floor(minutes / 60);

  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${
    seconds > 0 ? `${seconds}s ` : ""
  }${milliseconds > 0 ? `${milliseconds % 1000}ms` : ""}`;
}

// Recursive path tracer implementation for raymarched scenes
export class PathTracer {
  private textures: THREE.WebGLRenderTarget[] = [];
  private shader: THREE.ShaderMaterial;

  public set sdf(value: SDF) {
    this._sdf = value;
    this.step = value.stepCount;

    this.shader.fragmentShader =
      core + pathTracer + this._sdf.glsl + this._background.glsl;
    this.shader.needsUpdate = true;
  }

  public set background(value: Background) {
    this.shader.fragmentShader =
      core + pathTracer + this._sdf.glsl + this._background.glsl;
    this.shader.needsUpdate = true;
    this._background = value;
  }

  public get sdf() {
    return this._sdf;
  }

  public get background() {
    return this._background;
  }

  private _background: Background;
  private _sdf: SDF;

  public pixelDivisions = 1;
  public roughness = 1;

  public sunDirection = new THREE.Vector3(-0.5, -2, -1);
  public sunStrength = 1;
  public backgroundMultiplier = 1;

  public rayDepth = 5;
  public epsilon = 0.000001;
  public bufferSize?: number;

  public lastImage: TemporaryImage | null = null;

  public color = new THREE.Color(1, 1, 1);

  public step: number;

  constructor(
    sdf: SDF = new SDF("cube()"),
    background: Background = new ColorBackground(new THREE.Color("white"))
  ) {
    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.textures = [
      new THREE.WebGLRenderTarget(size.x, size.y, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }),
      new THREE.WebGLRenderTarget(size.x, size.y, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }),
    ];

    this._sdf = sdf;
    this._background = background;

    this.step = this._sdf.stepCount;

    this.shader = this.initShader();
  }

  private initShader() {
    return createShader(
      core + pathTracer + this._sdf.glsl + this._background.glsl,
      {
        previousFrame: { value: this.textures[0].texture },
        sampleIndex: { value: 0 },
        offset: { value: new THREE.Vector2(0, 0) },
        size: { value: new THREE.Vector2(0, 0) },
        adaptiveEpsilon: { value: false },
        time: { value: 0 },

        ...Utils.createUniformsFromVariables<PathTracer>(
          this,
          "sunDirection",
          "sunStrength",
          "roughness",
          "rayDepth",
          "pixelDivisions",
          "color",
          "epsilon",
          "backgroundMultiplier",
          "step"
        ),
        ...Utils.objectToUniforms(this._background, "bg_"),
      }
    );
  }

  renderImage(width: number, height: number, time = 0) {
    const bufferSize = this.bufferSize
      ? { x: this.bufferSize, y: this.bufferSize }
      : autoBufferSize(width, height);
    const start = performance.now();

    return new Promise<TemporaryImage>((resolve, reject) => {
      setAutoResize(false);
      setResolution(width, height);

      const targetSize = new THREE.Vector2(width, height);
      const textureSize = new THREE.Vector2(
        this.textures[0].texture.image.width,
        this.textures[0].texture.image.height
      );

      if (!targetSize.equals(textureSize)) {
        this.textures[0].dispose();
        this.textures[1].dispose();

        this.textures = [
          new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          }),
          new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          }),
        ];
      }

      renderer.setRenderTarget(this.textures[0]);
      renderer.clear();

      renderer.setRenderTarget(this.textures[1]);
      renderer.clear();

      Utils.setUniformsFromObject(this.shader, this.background, "bg_");

      const widths = Math.ceil(width / bufferSize.x);
      const heights = Math.ceil(height / bufferSize.y);

      let x = 0,
        y = 0;

      let sample = 0;

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden")
          console.log("Render task paused");
        else console.log("Render task resumed");
      };

      const timer = setInterval(() => {
        document.addEventListener("visibilitychange", handleVisibilityChange);

        if (document.visibilityState === "visible")
          console.log(
            `Render task: ${Math.floor(
              (sample / (this.pixelDivisions * this.pixelDivisions)) * 100
            )}%`
          );
      }, 1000);

      Queue.loop(
        () => {
          this.shader.uniforms.adaptiveEpsilon.value = false;
          this.shader.uniforms.previousFrame.value = this.textures[1].texture;
          this.shader.uniforms.sampleIndex.value = sample;
          this.shader.uniforms.offset.value = new THREE.Vector2(
            x * bufferSize.x,
            y * bufferSize.y
          );
          this.shader.uniforms.size.value = new THREE.Vector2(
            bufferSize.x,
            bufferSize.y
          );
          this.shader.uniforms.time.value = time;

          Utils.setUniformsFromVariables<PathTracer>(
            this.shader,
            this,
            "sunDirection",
            "sunStrength",
            "roughness",
            "rayDepth",
            "pixelDivisions",
            "color",
            "epsilon",
            "backgroundMultiplier",
            "step"
          );

          // Render the sample to a target
          render(this.shader, this.textures[0]);

          // Copy to screen
          //copy(this.textures[0], null);

          new TemporaryImage(this.textures[0]).postprocess("sRGB").show();

          // Swap textures
          this.textures = [this.textures[1], this.textures[0]];

          // Image splitting
          ++x;

          if (x >= widths) {
            x = 0;
            ++y;
          }

          if (y >= heights) {
            y = 0;
            sample += 1;
            // const subpixelIndex = sample % (this.pixelDivisions * this.pixelDivisions);
          }

          if (sample >= this.pixelDivisions * this.pixelDivisions) {
            const durationMs = performance.now() - start;

            console.log("Render task: 100%");
            console.log(`Rendering done in ${humanReadableTime(durationMs)}`);
            console.log(
              `Render Size: ${
                Math.floor(
                  (this.pixelDivisions * this.pixelDivisions * width * height) /
                    100000
                ) / 10
              } megapixels`
            );
            console.log(
              `Render Speed: ${
                Math.floor(
                  (this.pixelDivisions * this.pixelDivisions * width * height) /
                    durationMs /
                    10
                ) / 100
              } megapixels per second`
            );

            Queue.cancel();
          }
        },
        () => {
          clearInterval(timer);
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );

          this.lastImage = new TemporaryImage(this.textures[1]).postprocess(
            "sRGB"
          );

          if (sample >= this.pixelDivisions * this.pixelDivisions)
            resolve(this.lastImage);
          else reject(new Error("Render task cancelled"));
        }
      );
    });
  }

  async renderAnimationDiffusion(
    width: number,
    height: number,
    path: { position: THREE.Vector3; direction: THREE.Vector3; time: number }[],
    postprocess: string[] = []
  ) {
    const canvas = new OffscreenCanvas(width, height);
    // const canvas = renderer.domElement;
    const encoder = new CanvasEncoder(canvas, { fps: 30 });

    await encoder.encodeAudio(
      new AudioBuffer({ length: 44100, numberOfChannels: 2, sampleRate: 44100 })
    );

    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      camera.position.copy(point.position);
      camera.lookAt(point.position.clone().add(point.direction));

      const image = await this.renderImage(width, height, point.time);
      image.postprocess(...postprocess).show();

      // copy from renderer to canvas
      const context = canvas.getContext("2d") as any;
      context.drawImage(renderer.domElement, 0, 0, width, height);

      await encoder.encodeVideo(canvas);
      console.log(`Frame ${i + 1}/${path.length} done`);
    }

    const video = await encoder.export();

    console.log("encoded");

    // save mp4
    const url = URL.createObjectURL(video);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video.mp4";
    a.click();
    URL.revokeObjectURL(url);
  }

  async renderAnimation(
    width: number,
    height: number,
    path: { position: THREE.Vector3; direction: THREE.Vector3; time: number }[],
    postprocess: string[]
  ) {
    const frames: string[] = [];
    const files: string[] = [];

    function downloadCurrent() {
      const filename = `${index}-${index + frames.length - 1}.json`;
      downloadJSON(frames, filename);
      files.push(filename);
      index += frames.length;
      frames.length = 0;
    }

    let index = 1;

    for (let i = 0; i < path.length; i++) {
      if (frames.length === 50) downloadCurrent();

      const point = path[i];
      camera.position.copy(point.position);
      camera.lookAt(point.position.clone().add(point.direction));

      const image = await this.renderImage(width, height, point.time);
      image.postprocess(...postprocess).show();

      frames.push(renderer.domElement.toDataURL());
      console.log(`Frame ${i + 1}/${path.length} done`);
    }

    downloadCurrent();

    downloadJSON({ files, totalFrames: path.length }, "header.json");
  }
}
