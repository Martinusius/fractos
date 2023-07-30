import * as THREE from "three";
import { copyAA } from "./util";
import { createShader, render, renderer, setResolution, Utils } from "./setup";
import SDF from "./sdf";

// @ts-ignore
import position from "./shaders/position.glsl";
// @ts-ignore
import normal from "./shaders/normal.glsl";
// @ts-ignore
import edges from "./shaders/edges.glsl";
// @ts-ignore
import expandLines from "./shaders/expandLines.glsl";

import Queue, { setAutoResize } from "./queue";
import { ShaderMaterial } from "three";
import { core } from "./core";

export class EdgeRenderer {
  private positionShader: THREE.ShaderMaterial;
  private normalShader: THREE.ShaderMaterial;
  private edgesShader: THREE.ShaderMaterial;
  private expandShader: THREE.ShaderMaterial;

  private position: THREE.WebGLRenderTarget;
  private normal: THREE.WebGLRenderTarget;
  private edges: THREE.WebGLRenderTarget;
  private expanded: THREE.WebGLRenderTarget;

  private _sdf: SDF;
  public step: number;

  public set sdf(value: SDF) {
    this._sdf = value;
    this.step = value.stepCount;

    this.positionShader.fragmentShader = core + position + this._sdf.glsl;
    this.normalShader.fragmentShader = core + normal + this._sdf.glsl;

    this.positionShader.needsUpdate = true;
    this.normalShader.needsUpdate = true;
  }

  public epsilon: number = 0.00001;

  public backgroundColor = new THREE.Color(1, 1, 1);
  public lineColor = new THREE.Color(0, 0, 0);

  public lineWidth = 1;

  constructor(sdf: SDF = new SDF("cube()")) {
    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.position = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.normal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.edges = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
    this.expanded = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

    this._sdf = sdf;
    this.step = sdf.stepCount;

    const uniforms = {
      epsilon: { value: this.epsilon },
      step: { value: this.step },
    };

    this.positionShader = createShader(core + position + sdf.glsl, uniforms);
    this.normalShader = createShader(core + normal + sdf.glsl, uniforms);
    this.edgesShader = createShader(core + edges + sdf.glsl, {
      ...Utils.createUniformsFromVariables<EdgeRenderer>(this, "backgroundColor", "lineColor"),
      positionTexture: { value: this.position.texture },
      normalTexture: { value: this.normal.texture },
    });
    this.expandShader = createShader(core + expandLines + sdf.glsl, {
      ...Utils.createUniformsFromVariables<EdgeRenderer>(this, "backgroundColor", "lineColor", "lineWidth"),
      linesTexture: { value: this.edges.texture },
    });
  }

  private setUniforms(shader: ShaderMaterial) {
    shader.uniforms.epsilon.value = this.epsilon;
    shader.uniforms.step.value = this.step;
  }

  public renderImage(width: number, height: number) {
    return new Promise<void>((resolve) => {
      Queue.once(() => {
        setAutoResize(false);
        setResolution(width, height);

        const targetSize = new THREE.Vector2(width, height);
        const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);

        if (!targetSize.equals(textureSize)) {
          this.position.dispose();
          this.normal.dispose();
          this.edges.dispose();
          this.expanded.dispose();

          this.position = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          });
          this.normal = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          });
          this.edges = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          });
          this.expanded = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          });
        }

        this.setUniforms(this.positionShader);
        render(this.positionShader, this.position);

        this.setUniforms(this.normalShader);
        render(this.normalShader, this.normal);

        this.edgesShader.uniforms.positionTexture.value = this.position.texture;
        this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
        Utils.setUniformsFromVariables<EdgeRenderer>(this.edgesShader, this, "backgroundColor", "lineColor"),
          render(this.edgesShader, this.edges);

        this.expandShader.uniforms.linesTexture.value = this.edges.texture;
        Utils.setUniformsFromVariables<EdgeRenderer>(
          this.expandShader,
          this,
          "backgroundColor",
          "lineColor",
          "lineWidth"
        ),
          render(this.expandShader, this.expanded);

        copyAA(this.expanded, null);
        resolve();
      });
    });
  }

  public start() {
    setAutoResize(true);
    Queue.loop(() => {
      const screenSize = new THREE.Vector2();
      renderer.getSize(screenSize);
      const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);

      if (!screenSize.equals(textureSize)) {
        this.position.dispose();
        this.normal.dispose();
        this.edges.dispose();
        this.expanded.dispose();

        const floorX = Math.floor(screenSize.x);
        const floorY = Math.floor(screenSize.y);

        this.position = new THREE.WebGLRenderTarget(floorX, floorY, {
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
        });
        this.normal = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.edges = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.expanded = new THREE.WebGLRenderTarget(floorX, floorY, {
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
        });
      }

      this.setUniforms(this.positionShader);
      render(this.positionShader, this.position);

      this.setUniforms(this.normalShader);
      render(this.normalShader, this.normal);

      this.edgesShader.uniforms.positionTexture.value = this.position.texture;
      this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
      Utils.setUniformsFromVariables<EdgeRenderer>(this.edgesShader, this, "backgroundColor", "lineColor"),
        render(this.edgesShader, this.edges);

      this.expandShader.uniforms.linesTexture.value = this.edges.texture;
      Utils.setUniformsFromVariables<EdgeRenderer>(
        this.expandShader,
        this,
        "backgroundColor",
        "lineColor",
        "lineWidth"
      ),
        render(this.expandShader, this.expanded);

      copyAA(this.expanded, null);
    });
  }
}
