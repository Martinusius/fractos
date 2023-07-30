import * as THREE from "three";

// @ts-ignore
import colorBackground from "./shaders/colorBackground.glsl";

// @ts-ignore
import hemisphereBackground from "./shaders/hemisphereBackground.glsl";

// @ts-ignore
import imageBackground from "./shaders/imageBackground.glsl";

export abstract class Background {
  public abstract glsl: string;
}

export class ColorBackground extends Background {
  public override glsl = colorBackground;

  public color: THREE.Color;

  constructor(color: THREE.Color) {
    super();

    this.color = color;
  }
}

export class HemisphereBackground extends Background {
  public override glsl = hemisphereBackground;

  public top: THREE.Color;
  public bottom: THREE.Color;
  public blendAngle: number;

  constructor(top: THREE.Color, bottom: THREE.Color, blendAngle: number = 0.1) {
    super();

    this.top = top;
    this.bottom = bottom;
    this.blendAngle = blendAngle;
  }
}

export class CustomBackground extends Background {
  public override glsl: string;

  constructor(code: string) {
    super();

    this.glsl = code;
  }
}

export class ImageBackground extends Background {
  public override glsl = imageBackground;

  public image: THREE.CubeTexture;

  constructor(image: THREE.CubeTexture) {
    super();

    this.image = image;
  }
}
