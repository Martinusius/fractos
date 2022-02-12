export function playAnimation(width: number, height: number, images: string[], fps: number) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;
    canvas.style.zIndex = '100';


    function convertImage(dataURL: string) {
        const image = new Image();
        image.src = dataURL;
        return image;
    }

    let index = 0;
    function animate() {
        if(!images[index] || !context) {
            canvas.remove();

            return;
        }

        requestAnimationFrame(animate);
        context.drawImage(convertImage(images[index++]), 0, 0);
    }
    
    document.body.appendChild(canvas);

    animate();
}


