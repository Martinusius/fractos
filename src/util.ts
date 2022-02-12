import * as THREE from 'three';
import { createShader, render, renderAA, renderer } from './renderer';

// @ts-ignore
import copyGLSL from './shaders/copy.glsl';


const copyShader = createShader(copyGLSL, {
    data: { value: null as THREE.Texture | null },
});

export function copy(from: THREE.Texture | THREE.WebGLRenderTarget, to: THREE.WebGLRenderTarget | null) {
    if(from instanceof THREE.WebGLRenderTarget) from = from.texture;

    copyShader.uniforms.data.value = from;
    render(copyShader, to);
}

export function copyAA(from: THREE.Texture | THREE.WebGLRenderTarget, to: THREE.WebGLRenderTarget | null) {
    if(from instanceof THREE.WebGLRenderTarget) from = from.texture;

    copyShader.uniforms.data.value = from;
    renderAA(copyShader, to);
}

export function downloadCanvas(name: string) {
    const link = document.createElement('a');
    link.download = name;
    link.href = renderer.domElement.toDataURL();
    link.click();
    link.remove();
}

export function downloadJSON(data: any, name: string) {
    const link = document.createElement('a');
    link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    link.download = name;
    //document.body.appendChild(link);
    link.click();
    link.remove();
}
