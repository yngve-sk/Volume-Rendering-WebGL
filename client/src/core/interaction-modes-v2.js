let _ = require('underscore');

class InteractionModeManager {
    constructor() {

        this.allModes = {
            'Slicer': ['add', 'remove', 'rotate'],
            'Sphere': [''],
            '3d': ['rotate', 'select-point', 'select-ray', 'measure']
        };

        this.modes = {
            'Slicer': 'rotate',
            'Sphere': null,
            '3d': null
        };

        this.verifyMode = true;
    }

    setInteractionMode(category, mode) {
        if (this.verifyMode && !(_.contains(this.allModes[category], mode)))
            console.error("Category " + category + " does not have the mode " + mode + " available, available modes: " + this.allModes[category]);

        this.modes[category] = mode;
    }

    getInteractionMode(category) {
        return this.modes[category];
    }

    getInteractionModeGetterForCategory(category) {
        let getter = () => {
            return this.getInteractionMode(category);
        };

        return getter;
    }
}


module.exports = new InteractionModeManager();
