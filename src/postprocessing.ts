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
        const possibleEffects = ['reinhard', 'filmic', 'aces', 'uchimura', 'contrast', 'brightness', 'saturation', 'vignette'];

        steps = steps.map(step => {
            if(!step.trim()) return '// Empty postprocessing step';

            const match = step.match(/(.*)\((.*)\)/);

            const name = match ? match[1] : step;
    
            if(!possibleEffects.includes(name)) throw new Error(`Invalid postprocessing step: ${step}`);
    
            // Allow number without decimal places
            step = step.replace(/([^a-zA-Z\.])(\d+)([^\.\d])/g, '$1$2.0$3');
    
            if(!match) 
                return `color = ${step}(color);`;
            else if(match[2].trim() === '')
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