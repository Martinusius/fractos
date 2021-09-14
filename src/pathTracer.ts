import FileSaver from 'file-saver';
import * as THREE from 'three';
import { copy, copyAA, postprocess } from './util';
import Queue, { setAutoResize } from './queue';
import { createShader, renderer, render, setShader, Utils, setResolution } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import pathTracer from './shaders/pathTracer.glsl';

// @ts-ignore
import './webm-writer-0.3.0';
import { Background } from './background';
import { core } from './core';

export function asyncRepeat(count: number, callback: (i: number) => void, after?: () => void) {
    let i = 0;

    const animator = () => {
        if(i < count) callback(i);
        if(++i < count) requestAnimationFrame(animator);
        else if(after) after();
    };

    animator();
}


// Recursive path tracer implementation for raymarched scenes
export class PathTracer {
    private targets: THREE.WebGLRenderTarget[] = [];
    private shader: THREE.ShaderMaterial;
    
    public readonly sdf: SDF;
    public readonly background: Background;
    public readonly width: number;
    public readonly height: number;

    public roughness: number = 1;
    public sunDirection: THREE.Vector3 = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength: number = 1;
    public rayDepth: number = 5;
    public samplesPerFrame: number = 100;
    public color: THREE.Color = new THREE.Color(0xffffff);
    public time: number = 0;
    public epsilon: number = 0.00005;

    public backgroundMultiplier: number = 1;

    public bufferSize: number = 512;

    constructor(width: number, height: number, sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        this.width = width;
        this.height = height;

        this.targets = [
            new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType }),
            new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType })
        ];

        this.shader = createShader(core + pathTracer + sdf.getCode() + background.getCode(), {
            previousFrame: { value: this.targets[0].texture },
            sampleIndex: { value: 0 },
            offset: { value: new THREE.Vector2(0, 0) },
            size: { value: new THREE.Vector2(0, 0) },

            ...Utils.createUniformsFromVariables(this, 'sunDirection', 'sunStrength', 'roughness', 'rayDepth', 'samplesPerFrame', 'color', 'time', 'epsilon', 'backgroundMultiplier'),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_')
        });
    }

    public renderImage() {
        return new Promise<void>(resolve => {
            setAutoResize(false);
            setResolution(this.width, this.height);

            renderer.setRenderTarget(this.targets[0]);
            renderer.clear();

            renderer.setRenderTarget(this.targets[1]);
            renderer.clear();

            Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
            Utils.setUniformsFromObject(this.shader, this.background, 'bg_');

            const widths = Math.ceil(this.width / this.bufferSize);
            const heights = Math.ceil(this.height / this.bufferSize);
            
            let x = 0, y = 0;

            let sample = 0;
            Queue.loop(() => {
                this.shader.uniforms.previousFrame.value = this.targets[1].texture;
                this.shader.uniforms.sampleIndex.value = sample;
                this.shader.uniforms.offset.value = new THREE.Vector2(x * this.bufferSize, y * this.bufferSize);
                this.shader.uniforms.size.value = new THREE.Vector2(this.bufferSize, this.bufferSize);

                Utils.setUniformsFromVariables(this.shader, this, 'sunDirection', 'sunStrength', 'roughness', 'rayDepth', 'samplesPerFrame', 'color', 'time', 'epsilon', 'backgroundMultiplier');
        
                // Render the sample to a target
                render(this.shader, this.targets[0]);
        
                // Copy to screen
                copy(this.targets[0], null);
        
                // Swap targets
                this.targets = [this.targets[1], this.targets[0]];
        

                //console.log(`${++sample}/${this.samplesPerFrame}`);

                ++x;
                

                if(x >= widths) {
                    x = 0;
                    ++y;
                }

                if(y >= heights) {
                    y = 0;
                    console.log(`Samples: ${++sample}/${this.samplesPerFrame}`);
                }

                if(sample >= this.samplesPerFrame) {
                    

                    copyAA(this.targets[1], null);

                    Queue.cancel();
                    resolve();
                }

                
            });
        });

        
    }
}



