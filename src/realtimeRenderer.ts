import * as THREE from 'three';
import { controls, createShader, render, renderer, setResolution, Utils } from './renderer';
import { SDF } from './sdf';


// @ts-ignore
import simple from './shaders/simple.glsl';


import Queue, { setAutoResize } from './queue';
import { Background } from './background';
import { core } from './core';

import { TemporaryImage } from './postprocessing';
import Timer from './timer';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';

function normalize(vector: THREE.Vector3) {
    vector.normalize();
    return vector;
}

export class RealtimeRenderer {
    private shader: THREE.ShaderMaterial;
    private target: THREE.WebGLRenderTarget;
    private targetFinal: THREE.WebGLRenderTarget;

    public readonly sdf: SDF;
    public readonly background: Background;

    public enableShadows = true;
    public aoStrength = 1.0;
    public sunDirection = new THREE.Vector3(-0.5, -2, -1);
    public sunColor = new THREE.Vector3(1, 1, 1);
    public roughness = 1.0;

    public epsilon = 0.0001;
    public adaptiveEpsilon = true;
    public epsilonScale = 0.001;

    public color = new THREE.Color(1, 1, 1);


    // Animation timer
    public timer = new Timer();
    public animationDuration: number = 1;

    public get time() {
        return this.timer.get();
    }

    public set time(value: number) {
        this.timer.set(value);
    }

    // Frame timer
    private clock = new THREE.Clock();
    public framerate = 0;

    public lastImage: TemporaryImage | null = null;

    
    // Postprocessing steps
    public postprocess: string[] = [];

    constructor(sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

        this.shader = createShader(core + simple + sdf.getCode() + background.getCode(), {
            rasterizerColor: { value: null },
            rasterizerDepth: { value: null },
            sunDirection: { value: normalize(this.sunDirection) },
            time: { value: 0 },
            ...Utils.createUniformsFromVariables<RealtimeRenderer>(this,
                'enableShadows',
                'aoStrength',
                'sunColor',
                'sunDirection',
                'epsilon',
                'adaptiveEpsilon',
                'epsilonScale',
                'roughness',
                'color'
            ),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_'),
        });            
    }

    renderImage(width: number, height: number, time = 0) {
        Queue.cancel();
        setAutoResize(false);
        setResolution(width, height);

        const targetSize = new THREE.Vector2(width, height);
        const textureSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);

        if(!targetSize.equals(textureSize)) {
            this.target.dispose();
            this.targetFinal.dispose();

            this.target = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
            this.targetFinal = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        }

        Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
        Utils.setUniformsFromObject(this.shader, this.background, 'bg_');
        
        this.shader.uniforms.time.value = time;
        this.shader.uniforms.rasterizerColor.value = this.target.texture;
        this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
        Utils.setUniformsFromVariables<RealtimeRenderer>(this.shader, this,
            'enableShadows',
            'aoStrength',
            'sunColor',
            'sunDirection',
            'epsilon',
            'adaptiveEpsilon',
            'epsilonScale',
            'roughness',
            'color'
        );

        render(this.shader, this.targetFinal);

        this.lastImage = new TemporaryImage(this.targetFinal);
        return this.lastImage;
    }

    start(onFrame = () => {}) {
        setAutoResize(true);

     
        let accumulatedTime = 0;


        Queue.loop(() => {
            const interval = 1 / this.framerate;
            const delta = this.clock.getDelta();

            accumulatedTime += delta;
            if(controls instanceof FirstPersonControls) controls.update(delta);

            if(this.framerate !== 0 && accumulatedTime < interval) return;
            accumulatedTime = accumulatedTime - interval;
            
            onFrame();

            const size = new THREE.Vector2();
            renderer.getSize(size);
            const targetSize = new THREE.Vector2(this.target.texture.image.width, this.target.texture.image.height);

            if(!size.equals(targetSize)) {
                this.target.dispose();
                this.targetFinal.dispose();

                this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
            }

            Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
            Utils.setUniformsFromObject(this.shader, this.background, 'bg_');

            
            this.shader.uniforms.time.value = this.time / this.animationDuration;
            this.shader.uniforms.rasterizerColor.value = this.target.texture;
            this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
            Utils.setUniformsFromVariables<RealtimeRenderer>(this.shader, this,
                'enableShadows',
                'aoStrength',
                'sunColor',
                'sunDirection',
                'epsilon',
                'adaptiveEpsilon',
                'epsilonScale',
                'roughness',
                'color'
            );

            render(this.shader, this.targetFinal);

            this.lastImage = new TemporaryImage(this.targetFinal);
            this.lastImage.postprocess(...this.postprocess).show();
        });
    }
}