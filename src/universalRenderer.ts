// import FileSaver from 'file-saver';
// import * as THREE from 'three';
// import { Background } from './background';
// import Queue, { setAutoResize } from './queue';
// import { createShader, render, renderer, setShader, Utils, setResolution } from './renderer';
// import { SDF } from './sdf';




// // @ts-ignore
// import universal from './shaders/universal.glsl';
// import { postprocess } from './util';

// // @ts-ignore
// import './webm-writer-0.3.0';

// function normalize(vector: THREE.Vector3) {
//     vector.normalize();
//     return vector;
// }


// // Basic raymarcher which allows for realtime rendering
// export class UniversalRenderer {
//     private shader: THREE.ShaderMaterial;
//     private targets: THREE.WebGLRenderTarget[];
    

//     public readonly width: number;
//     public readonly height: number;

//     public sdf: SDF;
//     public shading: Shading;
//     public background: Background;

//     public epsilon = 0.00002;


//     constructor(width: number, height: number, sdf: SDF, shading: Shading, background: Background) {
//         this.width = width;
//         this.height = height;

//         this.sdf = sdf;
//         this.shading = shading;
//         this.background = background;

//         this.targets = [
//             new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType }),
//             new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType })
//         ];
        
//         this.shader = createShader(universal + sdf.getCode() + background.getCode());
//     }

//     resize(width: number, height: number) {
//         this.targets = [
//             new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType }),
//             new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat, type: THREE.FloatType })
//         ];
//     }

//     recompile(...parts: (SDF | Shading | Background | undefined)[]) {
//         parts.forEach(part => {
//             if(part instanceof SDF)
//                 this.sdf = part;
//             else if(part instanceof Shading)
//                 this.shading = part;
//             else if(part instanceof Background)
//                 this.background = part;
//         });
        
//         this.shader = createShader(universal + this.sdf.getCode() + this.shading.getCode() + this.background.getCode());
//     }
// }