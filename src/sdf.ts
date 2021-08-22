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
    public offset: THREE.Vector3;
    public scale: number;
    public rotation: THREE.Vector3;
    public rotation2: THREE.Vector3;

    constructor(iterations: number, offset: THREE.Vector3 = new THREE.Vector3(1, 1, 1), scale: number = 3, rotation = new THREE.Vector3(0, 0, 0), rotation2 = new THREE.Vector3(0, 0, 0)) {
        super();

        this.iterations = iterations;
        this.offset = offset;
        this.scale = scale;
        this.rotation = rotation;
        this.rotation2 = rotation2;
    }

    public getCode() {
        return menger;
    }
}


export class Sierpinski extends SDF {
    public iterations: number;
    public scale: number;

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