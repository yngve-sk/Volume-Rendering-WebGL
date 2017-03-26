let View = require('./view');

/*

    The views themselves read directly from the environment so
    the manager simply manages layout and broadcasts messages
    among linked views.
*/

class ViewManager {
    constructor(environmentRef) {
        this.env = environmentRef;
        this.views = {}; // {cellID: View Obj}
        this.views[0] = new View('webgl-canvas-0', 0, this.env);
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
