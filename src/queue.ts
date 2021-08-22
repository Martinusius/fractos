import * as THREE from 'three';
import { camera, effectsComposer, renderer } from "./renderer";

let autoResize = false;

export function setAutoResize(value: boolean) {
    autoResize = value;
}

export function setResolution(width: number, height: number) {
    renderer.setSize(width, height);
    effectsComposer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    //effectsComposer.setSize(screenSize.x, screenSize.y);
}

export const screenSize = new THREE.Vector2();



const observer = new ResizeObserver(() => {
    screenSize.set(document.body.clientWidth, document.body.clientHeight);
});

observer.observe(document.body);

let callback = () => {};

export default class Queue {
    public static loop(tick: () => void) {
        callback = tick;
    }

    public static cancel() {
        callback = () => {};
    }
}



function animator() {
    const currentSize = new THREE.Vector2();
    renderer.getSize(currentSize);

    if(autoResize && !screenSize.equals(currentSize)) 
        setResolution(screenSize.x, screenSize.y);

    requestAnimationFrame(animator);
    callback();
}

animator();