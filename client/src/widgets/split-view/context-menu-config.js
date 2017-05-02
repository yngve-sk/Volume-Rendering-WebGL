let Icons = require('../../core/settings').Widgets.LinkerAndSplitterView.icons.icons;

let menu = [];

let notify = null;
let callback = (name) => {
    notify(name);
}

for (let iconName in Icons) {
    let iconIMGPath = Icons[iconName];
    menu.push({
        name: iconName,
        img: iconIMGPath,
        title: iconName,
        fun: () => {
            notify(iconName);
            //alert("You selected " + iconName + '!');
        }
    });
}

/*
var menu = [
    {
        name: '3D Volume',
        img: '../client/images/icons/skull-icon.png',
        title: 'create button',
        className: 'primary',
        fun: function (data, event) {
            alert('i am add button')
        }
    },
    {
        name: 'Slice View',
        img: '../client/images/icons/icon-slicer.png',
        title: 'update button',
        fun: function (data, event) {
            console.log('i am update button')
        }
    },
    {
        name: 'delete',
        img: '../client/images/icons/skull-icon.png',
        disable: true,
        title: 'create button',
        fun: function (data, event) {
            console.log('i am add button')
        },
        submenu: [{
            'name': 'soft delete',
    }, {
            'name': 'hard delete'
    }]

    }];*/

module.exports = {
    menu: menu,
    listen: (handle) => {
        notify = handle;
    }
};
