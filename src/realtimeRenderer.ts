import * as THREE from 'three';
import { copy, postprocess } from './util';
import { controls, createShader, render, renderer, renderRaster, setShader, Utils } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import realtimeRenderer from './shaders/realtimeRenderer.glsl';
import Queue, { setAutoResize } from './queue';
import { Background } from './background';

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

    public enableShadows: boolean = false;
    public shadowHardness: number = 16;
    public ambientLightStrength: number = 0.2;
    public ambientOcclusionStrength: number = 0.1;
    public color: THREE.Color = new THREE.Color(0xffffff);
    public sunDirection: THREE.Vector3 = new THREE.Vector3(-0.5, -2, -1);
    public sunStrength: number = 1;
    public epsilonScale: number = 0.001;

    public clock: THREE.Clock;

    constructor(sdf: SDF, background: Background) {
        this.sdf = sdf;
        this.background = background;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.clock = new THREE.Clock();

        this.target = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.targetFinal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

        this.shader = createShader(realtimeRenderer + sdf.getCode() + background.getCode(), {
            rasterizerColor: { value: null },
            rasterizerDepth: { value: null },
            sunDirection: { value: normalize(this.sunDirection) },
            time: { value: 0 },
            ...Utils.createUniformsFromVariables<RealtimeRenderer>(this, 'enableShadows', 'shadowHardness', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength', 'epsilonScale'),
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
            ...Utils.objectToUniforms(this.background, 'bg_'),
        });            
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
           
            //renderRaster(this.target);

            Utils.setUniformsFromObject(this.shader, this.sdf, 'sdf_');
            Utils.setUniformsFromObject(this.shader, this.background, 'bg_');
            
            this.shader.uniforms.time.value =  this.clock.getElapsedTime();
            this.shader.uniforms.rasterizerColor.value = this.target.texture;
            this.shader.uniforms.sunDirection.value = normalize(this.sunDirection);
            Utils.setUniformsFromVariables<RealtimeRenderer>(this.shader, this, 'enableShadows', 'shadowHardness', 'ambientLightStrength', 'ambientOcclusionStrength', 'color', 'sunStrength', 'epsilonScale');

            render(this.shader, this.targetFinal);
            postprocess(this.targetFinal, null);
        });
    }
}