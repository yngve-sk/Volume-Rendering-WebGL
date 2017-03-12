class SlicerRenderer {
    /*
        @ewbgl2Context, ref to the context to render onto
        @modelRef, reference to the model object to render
    */
    constructor(webgl2Context, modelRef) {
        this.gl = webgl2Context
        this.model = modelRef;

        this.oldModel = null;
        this.isLinkedToMasterObject = false;

        this.settings = { // style is oblique for now for ease of use
            boundsN: {

            }
        }
    }

    doLinkToModel(modelRef) {
        if (!this.isLinkedToMasterObject) { // If it's not already linked to a master obj
            this.oldModel = this.model;
        }
        this.model = modelRef;
        this.isLinkedToMasterObject = true;
    }

    doUnlink() {
        this.model = this.oldModel;
        this.isLinkedToMasterObject = false;
    }

    render() {

    }

    /* Create shader program, bind it, etc... */
    _initialize() {

    }

    /* Convert the model obj from semantic to WebGL-friendly format*/
    _sendData() {

    }

    /* Draw the obj onto canvas */
    _draw() {

    }

}
