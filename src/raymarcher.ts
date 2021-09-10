import FileSaver from 'file-saver';
import * as THREE from 'three';
import { Background } from './background';
import Queue, { setAutoResize } from './queue';
import { createShader, render, renderer, setShader, Utils, setResolution } from './renderer';
import { SDF } from './sdf';




// @ts-ignore
import raymarcher from './shaders/raymarcher.glsl';
import { postprocess } from './util';

// @ts-ignore
import './webm-writer-0.3.0';

function normalize(vector: THREE.Vector3) {
    vector.normalize();
    return vector;
}


// Basic raymarcher which allows for realtime rendering
export class Raymarcher {
    private shader: THREE.ShaderMaterial;
    private target: THREE.WebGLRenderTarget;
    

    public readonly width: number;
    public readonly height: number;
    public readonly sdf: SDF;
    public readonly background: Background;

    public enableShadows: boolean = true;
    public shadowHardness: number = 16;
    public ambientLightStrength: number = 0.2;
    public ambientOcclusionStrength: number = 0.1;
    public color: THREE.Color = new THREE.Color(0xffffff);
    public sunDirection: THREE.Vector3 = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength: number = 1;



    constructor(width: number, height: number, sdf: SDF, background: Background) {
        this.width = width;
        this.height = height;

        this.sdf = sdf;
        this.background = background;

        this.target = new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType });

        this.shader = createShader(raymarcher + sdf.getCode() + background.getCode(), {
            sunDirection: { value: normalize(this.sunDirection) },
            ...Utils.createUniformsFromVariables<Raymarcher>(this, 'enableShadows', 'shadowHardness', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength'),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_')
        });
            
    }

    renderImage() {
        Queue.cancel();

        setAutoResize(false);
        setResolution(this.width, this.height);

        Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
        Utils.setUniformsFromObject(this.shader, this.background, 'bg_');

        this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
        Utils.setUniformsFromVariables<Raymarcher>(this.shader, this, 'enableShadows', 'shadowHardness', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength');
        
        render(this.shader, this.target);
        postprocess(this.target, null);
        console.log('render');
    }

    renderAnimation(frameCount: number, frameCallback = (frame: number) => {}) {
        setAutoResize(false);
        setResolution(this.width, this.height);

        // @ts-ignore
        const videoWriter = new WebMWriter({
            quality: 0.3,    // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported    
            frameRate: 30,     // Number of frames per second
            transparent: false,      // True if an alpha channel should be included in the video
        });

        let frame = 0;
        Queue.loop(() => {
            frameCallback(frame);
            Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
            Utils.setUniformsFromObject(this.shader, this.background, 'bg_');

            this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
            Utils.setUniformsFromVariables<Raymarcher>(this.shader, this, 'enableShadows', 'shadowHardness', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength');
            
            render(this.shader, this.target);
            postprocess(this.target, null);

            videoWriter.addFrame(renderer.domElement);

            console.log(`Frame ${++frame} done`);

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