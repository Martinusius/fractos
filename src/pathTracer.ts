import FileSaver from 'file-saver';
import * as THREE from 'three';
import { copy, copyAA } from './util';
import Queue, { setAutoResize } from './queue';
import { createShader, renderer, render, setShader, Utils, setResolution } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import pathTracer from './shaders/pathTracer.glsl';

// @ts-ignore
import './webm-writer-0.3.0';
import { Background } from './background';
import { core } from './core';
import { Image } from './postprocessing';

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

    private clock: THREE.Clock;
    private timings = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
    
    public readonly sdf: SDF;
    public readonly background: Background;

    public samplesPerFrame = 100;
    public samplesPerDrawCall = 1;
    public roughness = 1;

    public sunDirection = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength = 1;
    public backgroundMultiplier = 1;

    public rayDepth = 5;
    public epsilon = 0.00005;
    public bufferSize = 512;

    public colorR = new THREE.Color(1, 1, 1);
    public colorG = new THREE.Color(1, 1, 1);
    public colorB = new THREE.Color(1, 1, 1);

    public emissionR = new THREE.Color(0, 0, 0);
    public emissionG = new THREE.Color(0, 0, 0);
    public emissionB = new THREE.Color(0, 0, 0);

    public set color(value: THREE.Color) {
        console.log(value);
        this.colorR = value;
        this.colorG = value;
        this.colorB = value;
    }


    constructor(sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.clock = new THREE.Clock();

        this.textures = [
            new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType }),
            new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType })
        ];

        this.shader = createShader(core + pathTracer + sdf.getCode() + background.getCode(), {
            previousFrame: { value: this.textures[0].texture },
            sampleIndex: { value: 0 },
            offset: { value: new THREE.Vector2(0, 0) },
            size: { value: new THREE.Vector2(0, 0) },

            ...Utils.createUniformsFromVariables<PathTracer>(this,
                'sunDirection',
                'sunStrength',
                'roughness',
                'rayDepth',
                'samplesPerFrame',
                'samplesPerDrawCall',
                'colorR',
                'colorG',
                'colorB',
                'emissionR',
                'emissionG',
                'emissionB',
                'epsilon',
                'backgroundMultiplier'
            ),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_')
        });
    }

    public renderImage(width: number, height: number) {
        return new Promise<Image>(resolve => {
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
                this.samplesPerDrawCall =  Math.floor(0.1 / this.timings.reduce((a, b) => a + b) * 10);
                this.samplesPerDrawCall = Math.max(Math.min(this.samplesPerDrawCall, Math.min(20, this.samplesPerFrame - sample)), 1);
                //console.log(this.timings);

                this.shader.uniforms.previousFrame.value = this.textures[1].texture;
                this.shader.uniforms.sampleIndex.value = sample;
                this.shader.uniforms.offset.value = new THREE.Vector2(x * this.bufferSize, y * this.bufferSize);
                this.shader.uniforms.size.value = new THREE.Vector2(this.bufferSize, this.bufferSize);

                Utils.setUniformsFromVariables<PathTracer>(this.shader, this,
                    'sunDirection',
                    'sunStrength',
                    'roughness',
                    'rayDepth',
                    'samplesPerFrame',
                    'samplesPerDrawCall',
                    'colorR',
                    'colorG',
                    'colorB',
                    'emissionR',
                    'emissionG',
                    'emissionB',
                    'epsilon',
                    'backgroundMultiplier'
                );
        
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
                    sample += this.samplesPerDrawCall;
                    console.log(`Samples: ${sample}/${this.samplesPerFrame}`);
                }

                if(sample >= this.samplesPerFrame) {
                    
                    Queue.cancel();
                    resolve(new Image(this.textures[1]));
                }

                this.timings = [...this.timings.slice(1, this.timings.length), this.clock.getDelta()];
            });
        });

        
    }
}



