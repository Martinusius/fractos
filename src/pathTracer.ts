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
    private textures: THREE.WebGLRenderTarget[] = [];
    private shader: THREE.ShaderMaterial;
    
    public readonly sdf: SDF;
    public readonly background: Background;

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

    constructor(sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.textures = [
            new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType }),
            new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType })
        ];

        this.shader = createShader(core + pathTracer + sdf.getCode() + background.getCode(), {
            previousFrame: { value: this.textures[0].texture },
            sampleIndex: { value: 0 },
            offset: { value: new THREE.Vector2(0, 0) },
            size: { value: new THREE.Vector2(0, 0) },

            ...Utils.createUniformsFromVariables(this, 'sunDirection', 'sunStrength', 'roughness', 'rayDepth', 'samplesPerFrame', 'color', 'time', 'epsilon', 'backgroundMultiplier'),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_')
        });
    }

    public renderImage(width: number, height: number) {
        return new Promise<void>(resolve => {
            setAutoResize(false);
            setResolution(width, height);

            const targetSize = new THREE.Vector2(width, height);
            const textureSize = new THREE.Vector2(this.textures[0].texture.image.width, this.textures[0].texture.image.height);

            if(!targetSize.equals(textureSize)) {
                this.textures[0].dispose();
                this.textures[1].dispose();


                this.textures = [
                    new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType }),
                    new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType })
                ];
            }

            renderer.setRenderTarget(this.textures[0]);
            renderer.clear();

            renderer.setRenderTarget(this.textures[1]);
            renderer.clear();

            Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
            Utils.setUniformsFromObject(this.shader, this.background, 'bg_');

            const widths = Math.ceil(width / this.bufferSize);
            const heights = Math.ceil(height / this.bufferSize);
            
            let x = 0, y = 0;

            let sample = 0;
            Queue.loop(() => {
                this.shader.uniforms.previousFrame.value = this.textures[1].texture;
                this.shader.uniforms.sampleIndex.value = sample;
                this.shader.uniforms.offset.value = new THREE.Vector2(x * this.bufferSize, y * this.bufferSize);
                this.shader.uniforms.size.value = new THREE.Vector2(this.bufferSize, this.bufferSize);

                Utils.setUniformsFromVariables(this.shader, this, 'sunDirection', 'sunStrength', 'roughness', 'rayDepth', 'samplesPerFrame', 'color', 'time', 'epsilon', 'backgroundMultiplier');
        
                // Render the sample to a target
                render(this.shader, this.textures[0]);
        
                // Copy to screen
                copy(this.textures[0], null);
        
                // Swap textures
                this.textures = [this.textures[1], this.textures[0]];


                // Image splitting
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
                    //copyAA(this.textures[1], null);\
                    postprocess(this.textures[1], null, 1.0);

                    Queue.cancel();
                    resolve();
                }
            });
        });

        
    }
}



