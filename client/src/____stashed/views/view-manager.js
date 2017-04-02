let d3 = require('d3');
let View = require('./view');

class ViewManager {
    constructor(environmentRef) {
        this.env = environmentRef;

        this.defaultDatasetKey = null; // Will be the latest loaded dataset.

        this.views = {}; // {cellID: Dataset Key}
        this.views[0] = new View('webgl-canvas-0', 0, this.env);

        this.canvasContainer = d3.select('#webgl-canvas-container');

        this.canvas = this.canvasContainer.append('canvas')
            .attr('class', 'webgl-canvas');

        this.eventHandlerRectsGroup = this.canvasContainer.append('g');
    }

    syncWithLayout(layout) {
        console.log(layout);
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
