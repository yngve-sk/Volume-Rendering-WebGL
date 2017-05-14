let _ = require('underscore');

class SelectionManager {
    constructor(viewManager) {
        this.viewManager = viewManager;

        this.isRaySelectionActive = false;
        this.selectedRay = {
            start: [0.0, 0.0, 0.0],
            direction: [1.0, 1.0, 1.0],
            radius: 0.05
        };

        this.unselectRay();

        this.MAX_POINTS = 10;
        this.NUM_POINTS = 0;

        this.selectedPoints = [
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0]
        ];

        this.pointRadius = 0.0;

        this.nonSelectedOpacityMultiplier = 1.0; // default
    }

    getNonSelectedOpacity() {
        return this.nonSelectedOpacityMultiplier;
    }

    setNonSelectedOpacity(newOpacity) {
        this.nonSelectedOpacityMultiplier = newOpacity;
    }

    getSelectedPoints() {
        return _.flatten(this.selectedPoints);
    }

    getPointDisplayMode() {
        return this.pointDisplayMode;
    }

    setPointDisplayMode(modeInt) {
        this.pointDisplayMode = modeInt;
    }

    selectPoint(point) {
        if (this.NUM_POINTS >= this.MAX_POINTS)
            return;

        this.selectedPoints[this.NUM_POINTS++] = point;
    }

    selectRay(rayInfo) {
        for (let key in rayInfo)
            this.selectedRay[key] = rayInfo[key];

        this.isRaySelectionActive = true;
    }

    unselectRay() {
        this.selectedRay.start = [-100.0, -100.0, -100.0];
        this.selectedRay.direction = [1.0, 0.0, 0.0];
        this.isRaySelectionActive = false;
    }

    setRayRadius(newRadius) {
        this.selectedRay.radius = this.viewManager.mm2Float(newRadius);
    }

    setPointRadius(newRadius) {
        this.pointRadius = this.viewManager.mm2Float(newRadius);
    }

    getRaySelection() {
        return this.selectedRay;
    }

    getPointRadius() {
        return this.pointRadius;
    }

    getNumPoints() {
        return this.NUM_POINTS;
    }

    isRaySelected() {
        return this.isRaySelectionActive;
    }

    unselectPoints() {
        // Do not clear points, just overwrite them and shit when adding points
        this.NUM_POINTS = 0;

        this.selectedPoints = [
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0],
            [-3.0, -3.0, -3.0]
        ];
    }


}

module.exports = SelectionManager;
