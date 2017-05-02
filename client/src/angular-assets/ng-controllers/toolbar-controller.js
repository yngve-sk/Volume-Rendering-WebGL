let Environment = require('../../core/environment');
let InteractionModeManager = require('../../core/interaction-modes-v2');

let controller = function ($scope) {
    $scope.DOMReady = () => {

        let selected = {
            'Slicer': null,
            'Sphere': null,
            'Volume': null
        }

        let setSelected = (view, newSelected) => {
            if (selected[view])
                $(selected[view]).removeClass('vr-toolbar-selected');

            selected[view] = newSelected;
            $(selected[view]).addClass('vr-toolbar-selected');
        }

        $('#slicer-toolbar').toolbar({
            content: '#slicer-toolbar-options',
            position: 'bottom',
            hideOnClick: true,
            event: 'click',
            animation: 'standard'
        });

        $('#slicer-toolbar').on('toolbarItemClick', (item, source, item3) => {
            console.log(item);
            let action = source.getAttribute('action');
            console.log(source);
            setSelected('Slicer', source);

            InteractionModeManager.setInteractionMode('Slicer', action);
        });

        $('#3d-toolbar').toolbar({
            content: '#3d-toolbar-options',
            position: 'bottom',
            hideOnClick: true,
            event: 'click',
            animation: 'standard'
        });

        $('#3d-toolbar').on('toolbarItemClick', (item, source, item3) => {
            console.log(item);
            let action = source.getAttribute('action');
            console.log(source);
            setSelected('Volume', source);


            InteractionModeManager.setInteractionMode('Volume', action);
        });


    }

}

module.exports = controller;
