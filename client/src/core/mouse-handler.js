class MouseHandler {
    constructor(config) {
        this.isDrag = false;
        this.clickTimeout = config.clickTimeout ||  300; // default

        this.timers = {
            click: -1000000
        };

        this.callbacks = {
            click: {},
            mouseup: {},
            mousedown: {},
            mousemove: {}
        };

        this.state = {
            x0: -1,
            y0: -1,
            x: -1,
            y: -1,
            dx: -1,
            dy: -1
        };
    }

    reset() {
        this.isDrag = false;
    }

    handle(event) {
        // Update the state

        this.state.x0 = this.state.x;
        this.state.y0 = this.state.y;

        this.state.x = event.pos.x;
        this.state.y = event.pos.y;

        this.state.dx = this.state.x - this.state.x0;
        this.state.dy = this.state.y - this.state.y0;

        switch (event.type) {
            case 'mousedown':
                this.timers.click = Date.now();
                this.isDrag = true;
                this._notifyIfExists('mousedown', event.button);

                break;
            case 'mouseup':
                this.isDrag = false;
                if ((Date.now() - this.timers.click) <= this.clickTimeout) {
                    this._notifyIfExists('click', event.button);
                } else {
                    this._notifyIfExists('mouseup', event.button);
                }
                break;
            case 'mousemove':
                // Either drag or hover
                if (this.isDrag)
                    this._notifyIfExists('drag', event.button);
                else
                    this._notifyIfExists('mousemove', event.button);

                break;
            case 'mouseout':
                this.isDrag = false;
                this._notifyIfExists('mouseout', event.button);
                break;
            case 'mouseenter':
                this.isDrag = false;
                this._notifyIfExists('mouseenter', event.button);
                break;
            default:
                console.error("Unsupported event type: " + event.type);
                break;
        }
    }

    __stringToButtonCode(buttonCode) {
        switch (buttonCode) {
            case 'left':
                return 0;
            case 'middle':
                return 1;
            case 'right':
                return 2;
            default:
                return -1;
        }
    }

    /**
     * Delegates events to callbacks
     * @private
     * @property undefined
     * @param {string} event the event as a string, possible values:
     * 'mousedown', 'mouseup', 'click', 'mousemove'
     * @param {number} buttonCode the button code, see __stringToButtonCode
     */
    _notifyIfExists(event, buttonCode) {
        if (this.callbacks[event] && this.callbacks[event][buttonCode])
            this.callbacks[event][buttonCode](this.state); // Pass the state into the callback
        else if(this.callbacks[event]['any'])
            this.callbacks[event]['any'](this.state);
    }

    /**
     * Attaches a callback to a given event
     *
     * @param {string} event the event. Possible values: 'mousedown', 'mouseup', 'click', 'mousemove', 'drag'
     * @param {string} button the button. Possible values: 'left', 'right', 'middle'
     * @param {function} callback the function that will be called on the event.
     * the function can take in one argument, which is the state of the handler,
     * dx, dy values etc which can be useful to bind to stuff.
     */
    on(event, button, callback) {
        let buttonCode = this.__stringToButtonCode(button);

        if (!this.callbacks[event])
            this.callbacks[event] = {};

        if (!button)
            this.callbacks[event]['any'] = callback;
        else
            this.callbacks[event][buttonCode] = callback;
    }
}

module.exports = MouseHandler;
