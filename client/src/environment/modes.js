// Enum imitation of modes, contains...
// Interaction modes
// Camera modes
// Slicer modes
// Sphere modes (a bit more nested/complex, CAPS LOCK means a mode, WrittenLikeThis means it contains a
// set of modes that can be permuted with another mode)

module.exports = {
    Interactions: {
        MOVE: 'Move',
        ROTATE: 'Rotate',
        SHOOT_RAY: 'Shoot Ray',
        SELECT_POINT: 'Select Point',
        SELECT_CELL: 'Select Cell',
        MEASURE: 'Measure'
    },
    CameraModes: {
        PERSPECTIVE: 'Perspective',
        ORTHO: 'Orthographic'
    },
    SlicerModes: {
        ADD: 'Add Slice',
        MOVE: 'Move Slice',
        PIN_TO_SPHERE: 'Pin to sphere',
        DELETE: 'Delete'
    },
    SphereModes: {
        ROTATE: 'Rotate Sphere',

        ADD: 'Add... ',
        REMOVE: 'Remove... ',
        AddRemove: {
            SLICE: 'Slice',
            RAY: 'Ray',
            LIGHT: 'Spotlight'
        },

        MOVE: 'Move... ',
        SELECT: 'Select... ',
        MoveSelect: {
            RAY: 'Ray',
            SPOTLIGHT: 'Spotlight'
        },

        PIN: 'Pin... ',
        UNPIN: 'Unpin... ',
        PinUnpin: {
            SLICE: 'Slice',
            RAY: 'Ray',
            SPOTLIGHT: 'Spotlight'
        }
    }
}
