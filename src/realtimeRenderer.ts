import * as THREE from 'three';
import { copy, copyAA, postprocess } from './util';
import { controls, createShader, render, renderer, renderRaster, setResolution, setShader, Utils } from './renderer';
import { SDF } from './sdf';


// @ts-ignore
import simple from './shaders/simple.glsl';


import Queue, { setAutoResize } from './queue';
import { Background } from './background';
import { core } from './core';

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

    public enableShadows = false;
    public ambientLightStrength = 0.4;
    public ambientOcclusionStrength = 0.2;
    public color = new THREE.Color(0xffffff);
    public sunDirection = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength = 1;
    public epsilon = 0.0001;
    public adaptiveEpsilon = true;
    public epsilonScale = 0.001;
    public roughness = 1.0;

    public clock: THREE.Clock;

    constructor(sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.clock = new THREE.Clock();

        this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

        this.shader = createShader(core + simple + sdf.getCode() + background.getCode(), {
            rasterizerColor: { value: null },
            rasterizerDepth: { value: null },
            sunDirection: { value: normalize(this.sunDirection) },
            time: { value: 0 },
            ...Utils.createUniformsFromVariables<RealtimeRenderer>(this, 'enableShadows', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength', 'epsilon', 'adaptiveEpsilon', 'epsilonScale', 'roughness'),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_'),
        });            
    }

    renderImage(width: number, height: number) {
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
        
        this.shader.uniforms.time.value =  this.clock.getElapsedTime();
        this.shader.uniforms.rasterizerColor.value = this.target.texture;
        this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
        Utils.setUniformsFromVariables<RealtimeRenderer>(this.shader, this, 'enableShadows', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength', 'epsilon', 'adaptiveEpsilon', 'epsilonScale', 'roughness');

        render(this.shader, this.targetFinal);
        postprocess(this.targetFinal, null, 1);
    }

    start() {
        setAutoResize(true);

        Queue.loop(() => {
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
            
            this.shader.uniforms.time.value =  this.clock.getElapsedTime();
            this.shader.uniforms.rasterizerColor.value = this.target.texture;
            this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
            Utils.setUniformsFromVariables<RealtimeRenderer>(this.shader, this, 'enableShadows', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength', 'epsilon', 'roughness');

            render(this.shader, this.targetFinal);
            copyAA(this.targetFinal, null);
            //postprocess(this.targetFinal, null, 1);
        });
    }
}