import FileSaver from 'file-saver';
import * as THREE from 'three';
import { copy, copyAA, postprocess } from './util';
import Queue, { setAutoResize } from './queue';
import { createShader, renderer, render, setShader, Utils, setResolution } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import raytracer from './shaders/raytracer.glsl';

// @ts-ignore
import './webm-writer-0.3.0';
import { Background } from './background';

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
export class Raytracer {
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

    public postprocessing: boolean = true;
    public contrast: number = 1.5;

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

       
        console.log( renderer.properties.get(this.targets[0].texture));

        this.shader = createShader(raytracer + sdf.getCode() + background.getCode(), {
            previousFrame: { value: this.targets[0] },
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
        

                console.log(`${++sample}/${this.samplesPerFrame}`);

                if(sample >= this.samplesPerFrame) {
                    sample = 0;
                    ++x;
                }

                if(x >= widths) {
                    x = 0;
                    ++y;
                }

                if(y >= heights) {
                    if(this.postprocessing) postprocess(this.targets[1], null, this.contrast);
                    else copyAA(this.targets[1], null);

                    Queue.cancel();
                    resolve();
                }
            });
        });

        
    }

    public renderAnimation(frameCount: number, frameCallback = (frame: number) => {}) {
        setResolution(this.width, this.height);

        // @ts-ignore
        const videoWriter = new WebMWriter({
            quality: 0.5,    // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported    
            frameRate: 30,     // Number of frames per second
            transparent: false,      // True if an alpha channel should be included in the video
        });
        

        let sample = 0, frame = 0;
        Queue.loop(() => {

            // Change parameters during render
            if(sample === 0) {
                frameCallback(frame);
                Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
                Utils.setUniformsFromObject(this.shader, this.background, 'bg_');
            }

            this.shader.uniforms.previousFrame.value = this.targets[1].texture;
            this.shader.uniforms.sampleIndex.value = sample;

            Utils.setUniformsFromVariables(this.shader, this, 'sunDirection', 'sunStrength', 'roughness', 'rayDepth', 'samplesPerFrame', 'color');
    
            // Render the sample to a target
            render(this.shader, this.targets[0]);
    
            // Copy to screen
            copy(this.targets[0], null);
    
            // Swap targets
            this.targets = [this.targets[1], this.targets[0]];
    

            console.log(`${++sample}/${this.samplesPerFrame}`);

            if(sample >= this.samplesPerFrame) {
                sample = 0;
                videoWriter.addFrame(renderer.domElement);
                renderer.clear();
                console.log(`Frame ${++frame} done`);
            }

            if(frame >= frameCount) {
                videoWriter.complete().then((blob: Blob) => {
                    FileSaver.saveAs(blob, 'video.webm');
                });

                console.log(`Rendering done`);
                Queue.cancel();
            }
        });
    }
}


