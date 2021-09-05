import * as THREE from 'three';
import { camera, effectsComposer, renderer, screenSize, setResolution } from "./renderer";

let autoResize = false;

export function setAutoResize(value: boolean) {
    autoResize = value;
}





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
        setResolution(screenSize.x, screenSize.y, false);

    requestAnimationFrame(animator);
    callback();
}

animator();