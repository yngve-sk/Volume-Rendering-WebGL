class Subview {
    constructor(webGLContext) {
        this.gl = webGLContext;

        this.renderers = {
            volume: null,
            slicer: null,
            sphere: null
        };
    }

    notifyEventDidHappen(subcellName, event) {
        //console.log("notifyEventDidHappen("+subcellName+", "+event+")");
    }

    setViewports(subcells) {

    }
}

module.exports = Subview;
