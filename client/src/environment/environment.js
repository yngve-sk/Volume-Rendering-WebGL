let LightSettings = require('./light-settings');
let ViewManager = require('../3d-views/view-manager');
console.log(ViewManager);
let VolumeDataset = require('./volume-dataset');
let LinksAndLayout = require('../gui-widgets/split-view/view-splitter-master-controller');

let modes = require('./modes'),
    Interactions = modes.Interactions,
    CameraModes = modes.CameraModes;

let TransferFunctionManager = require('../gui-widgets/transfer-function/transfer-function-manager');
let TransferFunction = require('../gui-widgets/transfer-function/transfer-function');

class Environment {
    constructor() {
        this.GlobalSettings = {
            Basic: {
                CAMERA_MODE: CameraModes.PERSPECTIVE,
                LIGHTING: new LightSettings(),
                WINDOW: 100
            },
            GlobalOnly: {
                DISPLAY_MODE: null,
                INTERACTION_MODE: Interactions.ROTATE
            },
            TRANSFER_FUNCTION: null,
            Presets: {}, // TODO add these, possibly make it possible to save presets
        };

        this.VolumeDataset = new VolumeDataset();

        // If a link changes there's no need to pingback, it'll only affect the
        // rendering, which reads the link for every frame anyway.
        this.links = LinksAndLayout.read().links; // Reads links from the linker widget

        // If layout changes, the view manager must be notified and adjust accordingly
        // The links must also be refreshed because a view may be obsolete.
        this.layout = LinksAndLayout.read().layout; // Reads layout from view splitter

        this.ViewManager = new ViewManager(this);
        this.TransferFunctionManager = new TransferFunctionManager(this);

        this.TransferFunctions = {
            GLOBAL: new TransferFunction()
        };

    }

    // called when a link group for the given property changes
    notifyLinkChanged(propertyKey) {
        console.log("ENV, link changed @ propertyKey " + propertyKey);
    }

    // called when the layout changes
    notifyLayoutChanged(newLayout) {
        console.log("ENV, layout changed...");
    }
}


module.exports = new Environment();
