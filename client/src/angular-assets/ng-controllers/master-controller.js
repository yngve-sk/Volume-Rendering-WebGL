// Manages the global layout, i.e show or hide widget panes, side bars, top bars etc.
// DOES NOT manage view splitting for the 3D view or any other layouting that is local
// to a specific subview.

module.exports = function ($scope) {

    let isControlsHidden = false;

    let showControls = () => {

    }

    let hideControls = () => {

    }

    $scope.toggleShowControls = () => {
        if (!isControlsHidden)
            showControls();
        else
            showControls();
        isControlsHidden = !isControlsHidden;
    }

    $('.panel-left').resizable({
        handleSelector: '.splitter',
        resizeHeight: false,
        onDrag: () => {
            window.dispatchEvent(new Event('resize'));
            console.log("Dispatched resize!");
        }
    });
    $('.panel-top').resizable({
        handleSelector: '.splitter-horizontal',
        resizeWidth: false
    });

};
