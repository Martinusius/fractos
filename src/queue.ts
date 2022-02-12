import * as THREE from 'three';
import { camera, effectsComposer, renderer, screenSize, setResolution } from "./renderer";

let autoResize = false;

export function setAutoResize(value: boolean) {
    autoResize = value;
}




export default class Queue {
    public static callback = () => {};
    public static cleanup = () => {};

    public static loop(callback: () => void, cleanup: () => void = () => {}) {
        Queue.cleanup();
        Queue.callback = callback;
        Queue.cleanup = cleanup;
    }

    public static cancel() {
        Queue.callback = () => {};
        Queue.cleanup();
        Queue.cleanup = () => {};
    }

    public static once(callback: () => void) {
        Queue.callback = () => {
            callback();
            this.callback = () => {};
        };
    }
}



function animator() {
    requestAnimationFrame(animator);

    const currentSize = new THREE.Vector2();
    renderer.getSize(currentSize);

    if(autoResize && !screenSize.equals(currentSize)) 
        setResolution(screenSize.x, screenSize.y, false);
    
    Queue.callback();
}

animator();