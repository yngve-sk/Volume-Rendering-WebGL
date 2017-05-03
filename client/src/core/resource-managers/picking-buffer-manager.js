let displayFramebuffer = () => {

}

let displayFBImage = (image, w, h, target) => {
    let canvas = document.getElementById(target);

    let ctx = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    let imagedata = new ImageData(new Uint8ClampedArray(image), w, h);
    ctx.putImageData(imagedata, 0, 0);
}

let displayFBImagePixelByPixel = (pixelReader) => {

}

class PickingBufferManager {
    constructor(viewManager) {
        this.gl = viewManager.masterContext;
        this.bufferInfos = {}; // name : info
        // info... {width, height, channels, fbsrc}

        this.bufferImages = {};
    }

    addPickingBuffer(args) {
        this.bufferInfos[args.name] = {
            width: args.width,
            height: args.height,
            format: args.format,
            fbInfo: args.fbInfo
        }
    }

    _getNumChannels(format) {
        let gl = this.gl;
        let numChannels = -1;

        if (format === gl.RGB)
            numChannels = 3;
        else if (format === gl.ALPHA)
            numChannels = 1
        else if (format === gl.RGBA)
            numChannels = 4;
        else
            console.error("Invalid format");

        return numChannels;
    }

    refreshBuffer(name, target) {
        let gl = this.gl;
        let bufferInfo = this.bufferInfos[name];

        //let numChannels = this._getNumChannels(bufferInfo.format);
        let numChannels = 4;

        if (!this.bufferImages[name])
            this.bufferImages[name] = new Uint8Array(bufferInfo.width * bufferInfo.height * numChannels);

        gl.bindFramebuffer(gl.FRAMEBUFFER, bufferInfo.fbInfo.framebuffer);
        //gl.readPixels(0, 0, bufferInfo.width, bufferInfo.height, bufferInfo.format, gl.UNSIGNED_BYTE, this.bufferImages[name]);
        gl.readPixels(0, 0, bufferInfo.width, bufferInfo.height, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferImages[name]);

        if (target)
            displayFBImage(this.bufferImages[name],
                bufferInfo.width,
                bufferInfo.height,
                target);
    }

    readPixel(name, x01, y01) {
        let bufferInfo = this.bufferInfos[name];

        //let numChannels = this._getNumChannels(bufferInfo.format);
        let numChannels = 4;

        let result = new Uint8Array(numChannels);

        let rowSize1D = bufferInfo.width * numChannels;
        let colSize1D = 4;

        let x = parseInt(x01 * bufferInfo.width),
            y = parseInt((1.0 - y01) * bufferInfo.height); // Flip Y!

        let startIndex = y * numChannels * bufferInfo.width + x * numChannels;

        for (let i = 0; i < numChannels; i++) {
            result[i] = this.bufferImages[name][startIndex + i];
        }

        return result;
    }

    /*        let readPBPixels = (mx, my) => {
            this.pickingBuffer.refresh(); // Render it onto FB before reading
            let pb = this.pickingBuffer.get();
            let dest = new Uint8Array(4 * 1);
            let pixels = pb.readPixels(
                mx * pb.width,
                (1.0 - my) * pb.height,
                1.0, 1.0,
                gl.RGBA, gl.UNSIGNED_BYTE,
                dest, 0
            );
            let id = (dest[0]) - 1;
            let railOffset = dest[1] / 255.0;

            return {
                id: id,
                railOffset: railOffset
            };
        }


        let dragInfo = {
            railInfo: null
*/
}

module.exports = PickingBufferManager;
