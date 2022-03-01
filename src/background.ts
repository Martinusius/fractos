import * as THREE from 'three';


// @ts-ignore
import colorBackground from './shaders/colorBackground.glsl';

// @ts-ignore
import hemisphereBackground from './shaders/hemisphereBackground.glsl';

// @ts-ignore
import imageBackground from './shaders/imageBackground.glsl';


export abstract class Background {
    public abstract getCode(): string;
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
}

