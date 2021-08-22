import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { Background } from './background';

export const renderer = new THREE.WebGLRenderer({ antialias: false });

renderer.setSize(document.body.clientWidth, document.body.clientHeight);
document.body.appendChild(renderer.domElement);


const quadScene = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const camera = new THREE.PerspectiveCamera(90, document.body.clientWidth / document.body.clientHeight, 0.01, 10);
camera.position.set(2, 2, 2);
camera.lookAt(new THREE.Vector3(0, 0, 0));

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;







export function createShader(code: string, uniforms: { [uniform: string]: THREE.IUniform } = {}) {
    return new THREE.RawShaderMaterial({
        uniforms: {
            resolution: { value: new THREE.Vector2() },
            cameraPosition: { value: new THREE.Vector3() },
            cameraDirection: { value: new THREE.Vector3() },
            fov: { value: 0 },
            modelView: { value: new THREE.Matrix4() },
            projection: { value: new THREE.Matrix4() },
            ...uniforms
        },
        vertexShader: '#version 300 es\nprecision highp float;\nprecision highp int;\nin vec3 position;\nvoid main(){\ngl_Position = vec4(position, 1.0);\n}\n',
        fragmentShader: '#version 300 es\nprecision highp float;\nprecision highp int;\nout highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define gl_FragDepthEXT gl_FragDepth\n#define texture2D texture\n' + code
    });
}

const quad = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2, 1, 1),
    createShader('void main() {\ngl_FragColor = vec4(1, 1, 0, 1);\n}')
);
quadScene.add(quad);

export function setShader(shader: THREE.ShaderMaterial) {
    quad.material = shader;
}

export function getShader() {
    return quad.material;
}







export const effectsComposer = new EffectComposer(renderer);
effectsComposer.addPass(new RenderPass(quadScene, ortho));
effectsComposer.addPass(new SMAAPass(document.body.clientWidth, document.body.clientHeight));



export function render(shader: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget | null = null) {
    quad.material = shader;
    renderer.setRenderTarget(target);

    renderer.getSize(quad.material.uniforms.resolution.value);
    quad.material.uniforms.cameraPosition.value.copy(camera.position);
    camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
    quad.material.uniforms.fov.value = camera.fov / 180.0 * Math.PI;
    quad.material.uniforms.projection.value = camera.projectionMatrix;
    renderer.render(quadScene, ortho);
}



export function renderPostprocessing(shader: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget | null = null) {
    quad.material = shader;
    renderer.setRenderTarget(target);

    renderer.getSize(quad.material.uniforms.resolution.value);
    quad.material.uniforms.cameraPosition.value.copy(camera.position);
    camera.getWorldDirection(quad.material.uniforms.cameraDirection.value);
    quad.material.uniforms.fov.value = camera.fov / 180.0 * Math.PI;
    quad.material.uniforms.projection.value = camera.projectionMatrix;
    
    effectsComposer.render();
}

export class Utils {
    public static objectToUniforms(object: any, prefix = '') {
        const uniforms: Record<string, any> = {};

        for(const [key, value] of Object.entries(object)) {
            uniforms[prefix + key] = { value };
        }

        return uniforms;
    }

    public static setUniformsFromObject(shader: THREE.RawShaderMaterial, object: any, prefix = '') {
        for(const [key, value] of Object.entries(object)) {
            shader.uniforms[prefix + key] = { value };
        }
    }

    public static backgroundToUniforms(background: Background) {
        const uniforms: Record<string, any> = {};

        for(const [key, value] of Object.entries(background)) {
            uniforms['bg_' + key] = { value };
        }

        return uniforms;
    }

    public static createUniformsFromVariables<T>(object: T, ...variables: (keyof T)[]) {
        const uniforms: Record<string, THREE.IUniform> = {};
        variables.forEach(variable => {
            uniforms[variable as string] = { value: object[variable] };
        });
        return uniforms;
    }

    public static setUniformsFromVariables<T>(shader: THREE.ShaderMaterial, object: T, ...uniforms: (keyof T)[]) {
        uniforms.forEach(uniform => {
            shader.uniforms[uniform as any].value = object[uniform];
        });
    }
}


const scene = new THREE.Scene();
const sphere = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }));

const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1, 0, 1),
    new THREE.Vector3(-0.5, 0.5, 0.5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, -0.5, 0.5),
    new THREE.Vector3(1, 0, 1)
]);

const points = curve.getPoints( 50 );
const geometry = new THREE.BufferGeometry().setFromPoints( points );

const material = new THREE.LineBasicMaterial({ color : 0xff0000 } );

// Create the final object to add to the scene
const curveObject = new THREE.Line(geometry, material);

scene.add(curveObject);

export function renderRaster(target: THREE.WebGLRenderTarget | null = null) {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
}







