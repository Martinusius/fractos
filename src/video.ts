import FileSaver from 'file-saver';
import * as THREE from 'three';

// @ts-ignore
import './webm-writer-0.3.0';


let frame = () => {};

export function countFrame() {
    frame();
}

const progress = document.getElementById('progress') as HTMLElement;


export function record(canvas: HTMLCanvasElement, frameCount: number, frameRate: number, camera: THREE.Camera, curvePoints: THREE.Vector3[]) {
    // @ts-ignore
    const videoWriter = new WebMWriter({
        quality: 0.95,    // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported    
        frameRate: frameRate,     // Number of frames per second
        transparent: false,      // True if an alpha channel should be included in the video
    });

    return new Promise<void>((resolve, reject) => {
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        let frameIndex = 0;

        camera.position.copy(curve.getPointAt(0));
        camera.lookAt(curve.getPointAt(1 / frameCount));

        
        frame = () => {
            //const image = canvas.toDataURL('image/jpeg', 1);
            //frames.push(image);

            // @ts-ignore
            videoWriter.addFrame(canvas);
            ++frameIndex;

            camera.position.copy(curve.getPointAt(frameIndex / frameCount));
            camera.lookAt(curve.getPointAt(Math.min(frameIndex + 1, frameCount) / frameCount));

            progress.style.width = `${frameIndex / frameCount * 100}%`;

            if(frameIndex >= frameCount) {
                frame = () => {};

                // @ts-ignore
                videoWriter.complete().then((blob: Blob) => {
                    FileSaver.saveAs(blob, 'video.webm');
                    resolve();
                });

                // @ts-ignore
                /*let webmEncoder = new Whammy.Video(frameRate); 
                frames.forEach(f => webmEncoder.add(f));
                (new Promise(resolve => webmEncoder.compile(false, resolve))).then(blob => {
                    FileSaver.saveAs(blob as Blob, 'video.webm');
                    resolve();
                });*/


                
            }
        }
    });
}



