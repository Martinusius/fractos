import * as THREE from 'three';
import { createShader, render, renderAA } from './renderer';

// @ts-ignore
import postprocess from './shaders/postprocess.glsl';

export class Image {
    private texture: THREE.Texture;

    constructor(texture: THREE.WebGLRenderTarget | THREE.Texture) {
        if(texture instanceof THREE.WebGLRenderTarget) texture = texture.texture;
        this.texture = texture;
    }

    postprocess(...steps: string[]) {
        steps = steps.map(step => {
            if(!step.trim()) return '// Empty postprocessing step';

            const match = step.match(/\(.*\)/);
            if(!match) throw new Error('Invalid postprocessing step');
            const content = match[0].slice(1, -1);
            if(content.trim() === '')
                return 'color = ' + step.replace(/\(/, '(color') + ';';
            else
                return 'color = ' + step.replace(/\(/, '(color, ') + ';';
            
        });

        const shader = createShader(postprocess.replace(/POSTPROCESS/, steps.join('\n')), {
            data: { value: this.texture }
        });

        renderAA(shader, null);
    }

    show() {
        this.postprocess();
    }
}