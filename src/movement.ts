import { PointerLockControls } from "./PointerLockControls";

export function setupMovement(controls: PointerLockControls, speed: number) {
    document.addEventListener('click', () => controls.isLocked ? controls.unlock() : controls.lock());

    const keys: Record<string, boolean> = { w: false, a: false, s: false, d: false, ' ': false, shift: false, control: false };

    document.addEventListener('keydown',  (event: KeyboardEvent) => {
        keys[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event: KeyboardEvent) => {
        keys[event.key.toLowerCase()] = false;
    });

    return () => { 
        if(!controls.enabled) return;

        console.log(keys.controlleft);

        controls.moveForward((Number(keys.w) - Number(keys.s)) * speed * (1 + Number(keys.control) * 5));
        controls.moveRight((Number(keys.d) - Number(keys.a)) * speed * (1 + Number(keys.control) * 5));
        controls.camera.position.y += (Number(keys[' ']) - Number(keys.shift)) * speed * (1 + Number(keys.control) * 5);
    };
}