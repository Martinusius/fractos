import * as THREE from 'three';
import { copyAA } from './util';
import { createShader, render, renderer, setResolution, Utils } from './renderer';
import { SDF } from './sdf';

// @ts-ignore
import core from './shaders/core.glsl';
// @ts-ignore
import position from './shaders/position.glsl';
// @ts-ignore
import normal from './shaders/normal.glsl';
// @ts-ignore
import edges from './shaders/edges.glsl';
// @ts-ignore
import expandLines from './shaders/expandLines.glsl';


import Queue, { setAutoResize } from './queue';
import { Background } from './background';
import { ShaderMaterial } from 'three';

function normalize(vector: THREE.Vector3) {
    vector.normalize();
    return vector;
}

export class EdgeRenderer {
    private positionShader: THREE.ShaderMaterial;
    private normalShader: THREE.ShaderMaterial;
    private edgesShader: THREE.ShaderMaterial;
    private expandShader: THREE.ShaderMaterial;

    private position: THREE.WebGLRenderTarget;
    private normal: THREE.WebGLRenderTarget;
    private edges: THREE.WebGLRenderTarget;
    private expanded: THREE.WebGLRenderTarget;

    public readonly sdf: SDF;

    public epsilon: number = 0.00001;

    public backgroundColor = new THREE.Color(1, 1, 1);
    public lineColor = new THREE.Color(0, 0, 0);

    public lineWidth = 1;

    public clock: THREE.Clock;

    constructor(sdf: SDF) {
        this.sdf = sdf;

        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.clock = new THREE.Clock();

        this.position = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.normal = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.edges = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
        this.expanded = new THREE.WebGLRenderTarget(size.x, size.y, { format: THREE.RGBAFormat, type: THREE.FloatType });

        const uniforms = {
            time: { value: 0 },
            epsilon: { value: this.epsilon },
            ...Utils.objectToUniforms(this.sdf, 'sdf_'),
        };

        this.positionShader = createShader(core + position + sdf.getCode(), uniforms);    
        this.normalShader = createShader(core + normal + sdf.getCode(), uniforms);   
        this.edgesShader = createShader(core + edges + sdf.getCode(), {
            ...Utils.createUniformsFromVariables<EdgeRenderer>(this, 'backgroundColor', 'lineColor'),
            positionTexture: { value: this.position.texture },
            normalTexture: { value: this.normal.texture }
        });      
        this.expandShader = createShader(core + expandLines + sdf.getCode(), {
            ...Utils.createUniformsFromVariables<EdgeRenderer>(this, 'backgroundColor', 'lineColor', 'lineWidth'),
            linesTexture: { value: this.edges.texture },
        });         
    }

    private setUniforms(shader: ShaderMaterial) {
        Utils.setUniformsFromObject(shader, this.sdf, 'sdf_');
            
        shader.uniforms.time.value =  this.clock.getElapsedTime();
        shader.uniforms.epsilon.value = this.epsilon;
    }

    public renderImage(width: number, height: number) {
        return new Promise<void>(resolve => {
            Queue.once(() => {
                setAutoResize(false);
                setResolution(width, height);

                const targetSize = new THREE.Vector2(width, height);
                const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);

                if(!targetSize.equals(textureSize)) {
                    this.position.dispose();
                    this.normal.dispose();
                    this.edges.dispose();
                    this.expanded.dispose();

                    this.position = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                    this.normal = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                    this.edges = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                    this.expanded = new THREE.WebGLRenderTarget(targetSize.x, targetSize.y, { format: THREE.RGBAFormat, type: THREE.FloatType });
                }

                this.setUniforms(this.positionShader);
                render(this.positionShader, this.position);

                this.setUniforms(this.normalShader);
                render(this.normalShader, this.normal);

                this.edgesShader.uniforms.positionTexture.value = this.position.texture;
                this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
                Utils.setUniformsFromVariables<EdgeRenderer>(this.edgesShader, this, 'backgroundColor', 'lineColor'),
                render(this.edgesShader, this.edges);

                this.expandShader.uniforms.linesTexture.value = this.edges.texture;
                Utils.setUniformsFromVariables<EdgeRenderer>(this.expandShader, this, 'backgroundColor', 'lineColor', 'lineWidth'),
                render(this.expandShader, this.expanded);

                copyAA(this.expanded, null);
                resolve();
            });
        });
    }

    public start() {
        setAutoResize(true);
        Queue.loop(() => {
            const screenSize = new THREE.Vector2();
            renderer.getSize(screenSize);
            const textureSize = new THREE.Vector2(this.position.texture.image.width, this.position.texture.image.height);

            if(!screenSize.equals(textureSize)) {
                this.position.dispose();
                this.normal.dispose();
                this.edges.dispose();
                this.expanded.dispose();

                const floorX = Math.floor(screenSize.x);
                const floorY = Math.floor(screenSize.y);

                this.position = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
                this.normal = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
                this.edges = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
                this.expanded = new THREE.WebGLRenderTarget(floorX, floorY, { format: THREE.RGBAFormat, type: THREE.FloatType });
            }

            this.setUniforms(this.positionShader);
            render(this.positionShader, this.position);

            this.setUniforms(this.normalShader);
            render(this.normalShader, this.normal);

            this.edgesShader.uniforms.positionTexture.value = this.position.texture;
            this.edgesShader.uniforms.normalTexture.value = this.normal.texture;
            Utils.setUniformsFromVariables<EdgeRenderer>(this.edgesShader, this, 'backgroundColor', 'lineColor'),
            render(this.edgesShader, this.edges);

            this.expandShader.uniforms.linesTexture.value = this.edges.texture;
            Utils.setUniformsFromVariables<EdgeRenderer>(this.expandShader, this, 'backgroundColor', 'lineColor', 'lineWidth'),
            render(this.expandShader, this.expanded);

            copyAA(this.expanded, null);
        });
    }
}