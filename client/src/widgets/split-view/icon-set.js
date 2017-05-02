class SplitViewIconSet {
    constructor(args) {

        this.defaultIconName = args.defaultIcon;
        this.icons = args.Icons; // {{iconName : path}}
        this.subviewID2IconName = {
            0: args.defaultIcon
        }
    }

    getIconClassName(id) {
        return '';//this.getIcon(this.subviewID2IconName[id]);
    }

    getIconName(id) {
        return this.subviewID2IconName[id];
    }

    getIconPath(id) {
        return this.getIcon(this.subviewID2IconName[id]);
    }

    addCell(id) {
        this.subviewID2IconName[id] = this.defaultIconName;
    }

    removeCell(id) {
        delete this.subviewID2IconName[id];
    }

    getIcon(name) {
        return this.icons[name];
    }

    setIcon(id, iconName) {
        this.subviewID2IconName[id] = iconName;
    }
}

module.exports = SplitViewIconSet;
