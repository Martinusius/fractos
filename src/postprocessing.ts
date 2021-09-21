import * as THREE from 'three';
import { createShader, render } from './renderer';

// @ts-ignore
import postprocess from './shaders/postprocess.glsl';

export class Image {
    private texture: THREE.Texture;

    constructor(texture: THREE.WebGLRenderTarget | THREE.Texture) {
        if(texture instanceof THREE.WebGLRenderTarget) texture = texture.texture;
        this.texture = texture;
    }

    postprocess(...steps: string[]) {
        steps = steps.map(step => 'color = ' + step.replace(/\(/, '(color, ') + ';');

        const shader = createShader(postprocess.replace(/UWU/, steps.join('\n')));

        render(shader, null);
    }
}