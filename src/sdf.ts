import * as THREE from 'three';

// @ts-ignore
import menger from './shaders/menger.glsl';

// @ts-ignore
import sierpinski from './shaders/sierpinski.glsl';

// @ts-ignore
import mandelbulb from './shaders/mandelbulb.glsl';


// Signed distance function that defines a certain shape
export abstract class SDF {
    public abstract getCode(): string;
}

export class Menger extends SDF {
    public iterations: number;
    public rotate = new THREE.Vector3(0, 0, 0);
    public rotate2 = new THREE.Vector3(0, 0, 0);
    public translate = new THREE.Vector3(0, 0, 0);
    public scale = new THREE.Vector3(1, 1, 1);

    constructor(iterations: number) {
        super();

        this.iterations = iterations;
    }

    public getCode() {
        return menger;
    }
}


export class Sierpinski extends SDF {
    public iterations: number;
    public scale: number;
    public absX: boolean = false;
    public rotate = new THREE.Vector3(0, 0, 0);


    constructor(iterations: number, scale: number = 2) {
        super();

        this.iterations = iterations;
        this.scale = scale;
    }

    public getCode() {
        return sierpinski;
    }
}

export class Mandelbulb extends SDF {
    public iterations: number;
    public power: number;
    
    constructor(iterations: number, power: number) {
        super();

        this.iterations = iterations;
        this.power = power;
    }

    public getCode() {
        return mandelbulb;
    }
}

export class CustomSDF extends SDF {
    public readonly code;

    constructor(code: string) {
        super();

        this.code = code;
    }

    public getCode() {
        return this.code;
    }
}