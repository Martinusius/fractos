import FileSaver from 'file-saver';
import * as THREE from 'three';
import { copy, copyAA } from './util';
import Queue, { setAutoResize } from './queue';
import { createShader, renderer, render, setShader, Utils, setResolution, camera } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import pathTracer from './shaders/interframePathTracer.glsl';

// @ts-ignore
import position from './shaders/position.glsl';

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


// [Might look at this in future but cannot guarantee]
// TODO: Dynamic cache use threshold (difficulty: medium)
// TODO: Eliminate precision bugs
// Path tracer with interframe caching
// Ideal for animations
export class InterframePathTracer {
    private textures: THREE.WebGLRenderTarget[] = [];
    private shader: THREE.ShaderMaterial;

    private position: THREE.WebGLRenderTarget;
    private pixelMemory: THREE.WebGLRenderTarget;
    private positionShader: THREE.ShaderMaterial;

    public samplesPerFrame: number = 100;
    public samplesPerDrawCall: number = 1;
    
    public readonly sdf: SDF;
    public readonly background: Background;

    public roughness: number = 1;
    public sunDirection: THREE.Vector3 = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength: number = 1;
    public rayDepth: number = 5;
    
    public color: THREE.Color = new THREE.Color(0xffffff);
    public epsilon: number = 0.00005;

    public backgroundMultiplier: number = 1;
    public clock: THREE.Clock;

    public bufferSize: number = 512;

    public oldCameraPos = new THREE.Vector3();
    public oldCameraDir = new THREE.Vector3();

    public timings = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

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

        this.position = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.pixelMemory = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

        this.positionShader = createShader(core + position + sdf.getCode(), {
            epsilon: { value: this.epsilon },
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
        });    

        this.shader = createShader(core + pathTracer + sdf.getCode() + background.getCode(), {
            positions: { value: this.position.texture },
            pixelMemory: { value: this.pixelMemory.texture },
            previousFrame: { value: this.textures[0].texture },
            sampleIndex: { value: 0 },
            offset: { value: new THREE.Vector2(0, 0) },
            size: { value: new THREE.Vector2(0, 0) },

            ...Utils.createUniformsFromVariables<InterframePathTracer>(this, 
                'sunDirection',
                'sunStrength',
                'roughness',
                'rayDepth',
                'samplesPerFrame',
                'samplesPerDrawCall',
                'color',
                'epsilon',
                'backgroundMultiplier',
                'oldCameraPos',
                'oldCameraDir'
            ),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_')
        });
    }

    public frame: number = 0;

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

                this.position = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                this.pixelMemory = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType, magFilter: THREE.NearestFilter });
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
                this.samplesPerDrawCall =  Math.floor(0.5 / this.timings.reduce((a, b) => a + b) * 10);
                this.samplesPerDrawCall = Math.max(Math.min(this.samplesPerDrawCall, 20), 1);

                this.shader.uniforms.previousFrame.value = this.textures[1].texture;
                this.shader.uniforms.positions.value =  this.position.texture;
                this.shader.uniforms.pixelMemory.value =  this.pixelMemory.texture;
                this.shader.uniforms.sampleIndex.value = sample;
                this.shader.uniforms.offset.value = new THREE.Vector2(x * this.bufferSize, y * this.bufferSize);
                this.shader.uniforms.size.value = new THREE.Vector2(this.bufferSize, this.bufferSize);

                Utils.setUniformsFromVariables<InterframePathTracer>(this.shader, this,
                    'sunDirection',
                    'sunStrength',
                    'roughness',
                    'rayDepth',
                    'samplesPerFrame',
                    'samplesPerDrawCall',
                    'color',
                    'epsilon',
                    'backgroundMultiplier',
                    'oldCameraPos',
                    'oldCameraDir'
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
                    Utils.setUniformsFromObject(this.positionShader, this.sdf, 'sdf_'); 
                    this.positionShader.uniforms.epsilon.value = this.epsilon;
                    render(this.positionShader, this.position);

                    copy(this.textures[1], this.pixelMemory);

                    this.oldCameraPos.copy(camera.position);
                    camera.getWorldDirection(this.oldCameraDir);
                    
                    Queue.cancel();
                    resolve(new Image(this.textures[1]));

                    ++this.frame;
                }

                // Average draw call should take half a second
                const delta = this.clock.getDelta();
                //this.samplesPerDrawCall = Math.floor(0.5 / delta * this.samplesPerDrawCall);
                console.log(delta);
                this.timings = [...this.timings.slice(1, this.timings.length), delta];

                //console.log(this.clock.getDelta());
            });
        });

        
    }
}



