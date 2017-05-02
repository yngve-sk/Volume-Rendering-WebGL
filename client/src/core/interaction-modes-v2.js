let _ = require('underscore');

class InteractionModeManager {
    constructor() {

        this.allModes = {
            'Slicer': ['add', 'remove', 'rotate', 'move'],
            'Sphere': [''],
            'Volume': ['rotate', 'zoom', 'move', 'select-point', 'select-ray', 'measure']
        };

        this.modes = {
            'Slicer': 'rotate',
            'Sphere': null,
            'Volume': 'zoom'
        };

        this.verifyMode = true;
    }

    setInteractionMode(category, mode) {
        let lowercasemode = mode.toLowerCase();
        // Quick hack to be able to add suffixes
        // to be displayed @ menu without
        // chainging the everywhere internally
        lowercasemode = lowercasemode.split(' ')[0];

        if (this.verifyMode && !(_.contains(this.allModes[category], lowercasemode)))
            console.error("Category " + category + " does not have the mode " + lowercasemode + " available, available modes: " + this.allModes[category]);

        console.log("Set interaction mode of " + category + " to " + lowercasemode);
        this.modes[category] = lowercasemode;
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
