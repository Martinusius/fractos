import * as THREE from 'three';
import { Utils } from './renderer';


// @ts-ignore
import colorBackground from './shaders/colorBackground.glsl';

// @ts-ignore
import hemisphereBackground from './shaders/hemisphereBackground.glsl';

// @ts-ignore
import imageBackground from './shaders/imageBackground.glsl';


export abstract class Background {
    public abstract getCode(): string;
    public abstract setUniforms(shader: THREE.ShaderMaterial): void;
}

export class ColorBackground extends Background {
    public color: THREE.Color;

    constructor(color: THREE.Color) {
        super();
        
        this.color = color;
    }

    public getCode() {
        return colorBackground;
    }

    public setUniforms(shader: THREE.ShaderMaterial) {
        Utils.setUniformsFromVariables<ColorBackground>(shader, this, 'color');
    }
}

export class HemisphereBackground extends Background {
    public top: THREE.Color;
    public bottom: THREE.Color;
    public blendAngle: number;
    
    constructor(top: THREE.Color, bottom: THREE.Color, blendAngle: number = 0.1) {
        super();

        this.top = top;
        this.bottom = bottom;
        this.blendAngle = blendAngle;
    }

    public getCode() {
        return hemisphereBackground;
    }


    public setUniforms(shader: THREE.ShaderMaterial) {
        Utils.setUniformsFromVariables<HemisphereBackground>(shader, this, 'top', 'bottom', 'blendAngle');
    }
}

export class CustomBackground extends Background {
    public readonly code;

    constructor(code: string) {
        super();

        this.code = code;
    }

    public getCode() {
        return this.code;
    }

    public setUniforms(shader: THREE.ShaderMaterial) {
        Utils.setUniformsFromVariables<CustomBackground>(shader, this);
    }
}

export class ImageBackground extends Background {
    public image: THREE.CubeTexture;

    constructor(image: THREE.CubeTexture) {
        super();

        this.image = image;
    }

    public getCode() {
        return imageBackground;
    }

    public setUniforms(shader: THREE.ShaderMaterial) {
        (shader as any).envMap = this.image;
        Utils.setUniformsFromVariables<ImageBackground>(shader, this, 'image', );
    }
}

