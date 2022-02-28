import * as THREE from 'three';
import { createShader, render, renderAA, renderer } from './renderer';

// @ts-ignore
import postprocess from './shaders/postprocess.glsl';
import { downloadCanvas } from './util';


// Gets reset on render
export class TemporaryImage {
    private texture: THREE.Texture;
    private postprocessing: string[] = [];

    constructor(texture: THREE.WebGLRenderTarget | THREE.Texture) {
        if(texture instanceof THREE.WebGLRenderTarget) texture = texture.texture;
        this.texture = texture;
    }

    postprocess(...steps: string[]) {
        this.postprocessing.push(...steps);
        return this;
    }

    private renderToScreen() {
        const possibleEffects = ['reinhard', 'filmic', 'aces', 'uchimura', 'contrast', 'brightness', 'saturation', 'vignette', 'add', 'sRGB'];

        const shaderSteps = this.postprocessing.map(step => {
            if(!step.trim()) return '// Empty postprocessing step';

            const match = step.match(/(.*)\((.*)\)/);

            const name = match ? match[1] : step;
    
            if(!possibleEffects.includes(name)) throw new Error(`Invalid postprocessing step: ${step}`);
    
            // Allow number without decimal places
            step = step.replace(/([^a-zA-Z\.\d])(\d+)([^\.\d])/g, '$1$2.0$3');
    
            if(!match) 
                return `color = ${step}(color);`;
            else if(match[2].trim() === '')
                return 'color = ' + step.replace(/\(/, '(color') + ';';
            else
                return 'color = ' + step.replace(/\(/, '(color, ') + ';';
        });

        const shader = createShader(postprocess.replace(/POSTPROCESS/, shaderSteps.join('\n')), {
            data: { value: this.texture }
        });

        renderAA(shader, null);
    }

    download() {
        this.renderToScreen();
        downloadCanvas('image.png');
        return this;
    }

    show() {
        this.renderToScreen();
        return this;
    }
}