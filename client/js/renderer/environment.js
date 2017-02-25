/* Holds ALL the stuff required by WebGL to draw the volumes...
 EXCEPT the dataset itself, but all the configuration of
 "how to" render the dataset

 //--- TODO fill this in more accurately ---//

GLOBAL (same for all 3D subviews):
    LIGHTING
        - ambient
        - diffuse
        - specular
        - window

    CAMERA MODE
        - perspective | ortho

    DISPLAY MODE
        - Override local settings true/false
        - X-ray | Isosurface | Volume

LOCAL (to each 3D subview, default: it overrides global, can be switched back)
    LIGHTING
        - ambient
        - diffuse
        - specular
        - window

    CAMERA MODE
        - perspective | ortho

    DISPLAY MODE
        - X-ray | Isosurface | Volume | Custom

LINKING BETWEEN VIEWS:
    Sphere&Slicer | Camera | Lights | TransferFunction | Selection |

SUBVIEWS:
    ID, each subview has an ID plus all the local settings

    WIDGET modes:
        Slicer: {ADD_SLICE | MOVE_SLICE | PIN_SLICE_TO_SPHERE | DELETE_SLICE}
        Sphere: {
            ROTATE,

            ADD: {SLICE | RAY | SPOTLIGHT},
            REMOVE: {SLICE | RAY | SPOTLIGHT},

            MOVE: {RAY | SPOTLIGHT},
            SELECT: {RAY}

            PIN: {SLICE | RAY | SPOTLIGHT | 3D MODEL},
            UNPIN: {SLICE | RAY | SPOTLIGHT | 3D MODEL}

        }






Each subview has...
    - An ID
    - A slicer
        Modes: {
            ADD_SLICE | MOVE_SLICE | PIN_SLICE_TO_SPHERE | DELETE_SLICE
        }

    - A sphere
        Modes: {
            ROTATE |

            ADD: { SLICE | RAY | SPOTLIGHT } |
            REMOVE: {SLICE | RAY | SPOTLIGHT} |

            MOVE: {RAY | SPOTLIGHT} |
            SELECT: {RAY} |

            PIN: {SLICE | RAY | SPOTLIGHT } |
            UNPIN: {SLICE | RAY | SPOTLIGHT }
        }

    - A 3D view
        Modes: {

        }



    */

class Environment {
    constructor() {
        this.globals = {
            CAMERA_MODE: 'PERSPECTIVE',
            DISPLAY_MODE: 'CUSTOM',
            LIGHTING: new LightSettings(),
            WINDOW: null
            overrides: {
                CAMERA_MODE: false,
                DISPLAY_MODE: false,
                LIGHTING: false
            },
        };

        this.locals = {
            CAMERA_MODE: 'PERSPECTIVE',
            DISPLAY_MODE: 'CUSTOM',
            LIGHTING: new LightSettings(),
            WINDOW: null
        };

    }
}


module.exports = function () {

}
