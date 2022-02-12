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


function transform(shaderCode: string, index: number, steps: string[]) {
    const possibleTransforms = ['rotate', 'translate', 'scale', 'rotateX', 'rotateY', 'rotateZ', 'abs', 'absX', 'absY', 'absZ'];

    steps = steps.map(step => {
        if(!step.trim()) return '// Empty transform step';

        const match = step.match(/([^\(]*)\((.*)\)/);

        const name = match ? match[1] : step;

        if(!possibleTransforms.includes(name)) throw new Error(`Invalid transform step: ${step}`);

        // Allow numbers without decimal places
        step = step.replace(/([^a-zA-Z\.\d])(\d+)([^\.\d])/g, '$1$2.0$3');

        if(!match) 
            return `z = ${step}(z);`;
        else if(match[2].trim() === '')
            return 'z = ' + step.replace(/\(/, '(z') + ';';
        else
            return 'z = ' + step.replace(/\(/, '(z, ') + ';';
        
    });

    return shaderCode.replace(new RegExp(`TRANSFORM${index}`), steps.join('\n'));
}

export class Menger extends SDF {
    public iterations: number;
    public coloringIterations: number;

    public transform: string[] = [];
    public transform2: string[] = [];

    constructor(iterations: number) {
        super();

        this.iterations = iterations;
        this.coloringIterations = iterations;
    }

    public getCode() {
        return transform(transform(menger, 0, this.transform), 1, this.transform2);
    }
}


export class Sierpinski extends SDF {
    public iterations: number;
    public coloringIterations: number;
    public scale: number;
    public absX: boolean = false;
    public rotate = new THREE.Vector3(0, 0, 0);
    public translate = new THREE.Vector3(0, 0, 0);


    constructor(iterations: number, scale: number = 2) {
        super();

        this.iterations = iterations;
        this.coloringIterations = iterations;
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