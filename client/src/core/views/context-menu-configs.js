let ContextMenus = require('../settings').Views.ContextMenus;

let menus = {};
let callbacks = {};

let notify = null;

let bundle = {};


let callback = (name) => {
    notify(name);
}

for (let ContextMenu in ContextMenus) {

    menus[ContextMenu] = [];

    let MenuItems = ContextMenus[ContextMenu];

    for (let itemName in MenuItems) {
        let itemIMGPath = MenuItems[itemName];
        menus[ContextMenu].push({
            name: itemName,
            img: itemIMGPath,
            title: itemName,
            fun: () => {
                callbacks[ContextMenu](itemName);
            }
        });
    }

    bundle[ContextMenu] = {
        menu: menus[ContextMenu],
        listen: (handle) => {
            callbacks[ContextMenu] = handle;
        }
    }
}


module.exports = bundle;
