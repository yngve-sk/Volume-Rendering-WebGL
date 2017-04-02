let d3 = require('d3');
let Subview = require('./subview');
let MiniatureSplitViewOverlay = require('../widgets/split-view/miniature-split-view-overlay');
let SubcellLayout = require('../widgets/split-view/subcell-layout');



/**
 * Windowing manager built on the SplitBox / MiniatureSplitView classes,
 * Will manage multiple renderers operating on the same WebGL context,
 * delegate events and such
 * @memberof module:View
 **/
class ViewManager {
    constructor(environmentRef, getAddRemoveView) {
        this.env = environmentRef;

        this.canvasContainer = d3.select('#webgl-canvas-container');
        this.masterCanvas = document.getElementById('webgl-master-canvas');

        this.masterContext = this.masterCanvas.getContext('webgl2');

        let eventListenerOverlayCallback = (cellID, subcellName, event) => {
            //console.log("this.eventListenerOverlayCallback(" + cellID + ", " + subcellName + ", " + event + ")");

            console.log("cellID: " + cellID + ", subcell: " + subcellName + ", loc: (" + event.pos.x + ", " + event.pos.y + "), button = " +
                event.button);
            this.subviews[cellID].notifyEventDidHappen(subcellName, event)
        }

        let overlayConfig = {
            containerID: 'webgl-canvas-container',
            coverMe: this.masterCanvas,
            miniatureSplitViewGetter: getAddRemoveView,
            options: {
                showIDs: true,
                bottomTopThresholdPercentage: 0.1
            },
            subcellLayout: new SubcellLayout({
                changeLayoutThresholdMultiplier: 1.2,
                standardSizeMultiplier: 0.7
            }),
            listener: eventListenerOverlayCallback
        };

        this.splitviewOverlay = new MiniatureSplitViewOverlay(overlayConfig);

        this.subviews = {
            0: new Subview(this.masterContext)
        };


        window.addEventListener('resize', () => {
            this._resize();
        }, false);
    }

    addNewView(id) {
        this.subviews[id] = new Subview(this.masterContext);
        this.syncWithLayout();
    }

    removeView(id) {
        delete this.subviews[id];
        this.syncWithLayout();
    }

    /**
     * Syncs the view manager with the layout, and passes the subcell
     * viewports down to each respective subview.
     */
    syncWithLayout() {
        // NOTE: These ((viewports)) can be used directly for rendering
        // I.e they need no transformations whatsoever.

        let viewports = this.splitviewOverlay.render();

        for (let subviewID in this.subviews)
            this.subviews[subviewID].setViewports(viewports[subviewID]);
    }

    _resize() {
        this.syncWithLayout();
    }

    refresh() {
        for (let viewID in this.views) {
            let view = this.views[viewID];

            if (!view)
                continue;

            view.refresh();
        }
    }

    __DEBUGRefreshView0() {
        console.log("__DEBUGRefreshView0()");
        this.views[0].refresh();
    }
}


module.exports = ViewManager;
