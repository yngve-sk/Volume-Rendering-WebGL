let View = require('./view');

/*

    The views themselves read directly from the environment so
    the manager simply manages layout and broadcasts messages
    among linked views.
*/

class ViewManager {
    constructor() {
        this.views = {}; // {cellID: View Obj}
        this.views[0] = new View('webgl-canvas-0', 0, this.environment);

        this.views[0].refresh();
    }

    refresh() {
        for (let viewID in this.views) {
            let view = this.views[viewID];

            if (!view)
                continue;

            view.refresh();
        }
    }
}


module.exports = ViewManager;
