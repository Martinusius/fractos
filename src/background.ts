import * as THREE from 'three';


// @ts-ignore
import colorBackground from './shaders/colorBackground.glsl';

// @ts-ignore
import hemisphereBackground from './shaders/hemisphereBackground.glsl';


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

export class ImageBackground {

}

