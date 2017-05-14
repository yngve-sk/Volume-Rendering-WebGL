let displayFBImage = (image, w, h, target) => {
    let canvas = document.getElementById(target);

    let ctx = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    let imagedata = new ImageData(new Uint8ClampedArray(image), w, h);
    ctx.putImageData(imagedata, 0, 0);
}

let displayFBImageFromFramebuffer = (gl, fb, width, height, target) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);

    let dest = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, dest);

    displayFBImage(dest, width, height, target);
}

module.exports = {
    displayFBImage: displayFBImage,
    displayFBImageFromFramebuffer: displayFBImageFromFramebuffer
};
