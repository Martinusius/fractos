import * as THREE from 'three';

class ConsoleRenderer extends THREE.WebGLRenderer {
    private table = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
    private renderTarget = new THREE.WebGLRenderTarget(1, 1);

    private size = new THREE.Vector2();

    public output: Function | HTMLElement = console.log;

    constructor(parameters?: THREE.WebGLRendererParameters) {
        super(parameters);
        document.body.appendChild(this.domElement);
        this.domElement.style.display = 'none';

        this.getSize(this.size);
    }

    render(scene: THREE.Object3D, camera: THREE.Camera) {
        const newSize = new THREE.Vector2();
        this.getSize(newSize);

        const width = newSize.x * 2;
        const height = newSize.y;

        if(!this.size.equals(newSize)) {
            this.renderTarget.setSize(width, height);
        }

        const pixelBuffer = new Uint8Array(4 * width * height);

        this.setRenderTarget(this.renderTarget);
        super.render(scene, camera);
        this.readRenderTargetPixels(this.renderTarget, 0, 0, width, height, pixelBuffer);

        const lines = [];
        for(let y = 0; y < height; y++) {
            let line = '';
            for(let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = pixelBuffer[index];
                const g = pixelBuffer[index + 1];
                const b = pixelBuffer[index + 2];

                const brightness = (r + g + b) / 3 / 255;
                const character = this.table[Math.floor(brightness * (this.table.length - 1))];
                line += character;
            }

            lines.push(line);
        }

        if(this.output instanceof Function) {
            this.output(lines.join('\n'));
        }
        else if(this.output instanceof HTMLElement) {
            this.output.innerHTML = lines.join('<br>');
        }
    }
}