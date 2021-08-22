import * as THREE from 'three';
import { createShader, render, renderPostprocessing } from './renderer';

// @ts-ignore
import copyGLSL from './shaders/copy.glsl';


const copyShader = createShader(copyGLSL, {
    data: { value: null as THREE.Texture | null },
});



// @ts-ignore
import postprocessGLSL from './shaders/postprocess.glsl';


const postprocessShader = createShader(postprocessGLSL, {
    data: { value: null as THREE.Texture | null },
});


export function copy(from: THREE.Texture | THREE.WebGLRenderTarget, to: THREE.WebGLRenderTarget | null) {
    if(from instanceof THREE.WebGLRenderTarget) from = from.texture;

    copyShader.uniforms.data.value = from;
    render(copyShader, to);
}

export function postprocess(from: THREE.Texture | THREE.WebGLRenderTarget, to: THREE.WebGLRenderTarget | null) {
    if(from instanceof THREE.WebGLRenderTarget) from = from.texture;

    postprocessShader.uniforms.data.value = from;
    renderPostprocessing(postprocessShader, to);
}