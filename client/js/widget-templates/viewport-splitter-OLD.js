let $ = require('jquery');

let myIDPrefix = "viewport-splitter-box-";
let parent = null;
let me = null;

let framework = {
    top: null,
    right: null,
    bottom: null,
    left: null
};

let PADDING = 5; // percent

class Square {
    constructor(width, height, x0, y0) {
        this.width = width;
        this.height = height;
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x0 + width;
        this.y1 = y0 + height;
    }
}

let squares = []; // By default they will be layout rly nicely.

let getParentSizes = () => {

    let innerWidth = parent.width();
    let innerHeight = parent.height();
    let outerWidth = parent.outerWidth();
    let outerHeight = parent.outerHeight();

    let paddingX = (outerWidth - innerWidth) / 2;
    let paddingY = (outerHeight - innerHeight) / 2;

    let bounds = {
        inner: {
            x0: paddingX,
            y0: paddingY,
            x1: paddingX + innerWidth,
            y1: paddingY + innerHeight,
            width: innerWidth,
            height: innerHeight
        }
    }

    return {
        innerWidth: innerWidth,
        innerHeight: innerHeight,
        outerWidth: outerWidth,
        outerHeight: outerHeight,
        bounds: bounds
    };
}

let isClosestToGreatestValue = (min, max, val) => {
    let minmaxDiff = max - min;
    let minValDiff = val - min;
    let maxValDiff = max - val;

    return {
        isClosestToMax: maxValDiff < minValDiff,
        maxValDiff: maxValDiff,
        minValDiff: minValDiff
    };
}

let isWithinSquare = (x, y, square) => {
    return isBetween(square.x0, square.x0 + square.width, x) &&
        isBetween(square.y0, square.y0 + square.height, y);
}

let findSquareOfXY = (x, y) => {
    for (square of squares)
        if (isWithinSquare(x, y, square))
            return square;

    return null;
}

let getLocationOnSquare = (square, x, y) => {
    let xMid = square.x0 + (square.width / 2);
    let yMid = square.y0 + (square.height / 2);

    let isOnLeftHalf = x < xMid,
        isOnRightHalf = x >= xMid;

    let isOnUpperHalf = y < yMid,
        isOnLowerHalf = y >= yMid;

    let topDist = y - square.y0,
        bottomDist = square.y1 - y;

    let rightDist = square.x1 - x,
        leftDist = square.x - square.x0;

    if (isOnLeftHalf && leftDist < topDist && leftDist < bottomDist)
        return 'left';
    else if (isOnUpperHalf && topDist < leftDist && topDist < rightDist)
        return 'top';
    else if (isOnRightHalf && rightDist < topDist && rightDist < bottomDist)
        return 'right';
    else if (isOnLowerHalf && bottomDist < leftDist && bottomDist < rightDist)
        return 'bottom';
    else
        return null;
}

/* Location of point (x,y), returns either*/
let getDiscreteLocation = (x, y) => {
    let b = getParentSizes().bounds.inner;

    // Check if outside inner box b
    if (
        isBetween(b.x0, b.x1, x) && isBetween(b.y0, b.y1, y)) {
        let square = findSquareOfXY(x, y);
        let side = getLocationOnSquare(square, x, y);
        return {
            rect: square,
            side: side
        };

    } else {
        let side = "";
        // Infer which frame it's on.
        if (x < bounds.x0) { // On the left
            side = "left";
        } else if (bounds.x1 < x) {
            side = "right";
        } else if (y < bounds.y0) {
            side = "top"
        } else {
            side = "bottom";
        }

        return {
            rect: 'FRAME',
            side: side
        };
    }
}

let isBetween = (min, max, val) => {
    return min <= val && val < max;
}

let addSquareAtLocation = (x, y) => {

}

let onMouseOver = (e) => {
    let parentX = e.offsetX,
        parentY = e.offsetY;

    //console.log(e);
    console.log("(" + parentX + "," + parentY + ")");
    console.log(getParentSize());
}

let init = (parentID, width, height) => {
    console.log("#" + parentID);
    parent = $('#' + parentID);
    parent.html("<div id='" + (myIDPrefix + 1) + "' class='viewport-splitter-box-basic'></div>")
        .on('mousemove', onMouseOver)
        .css('width', width)
        .css('height', height)
        .css('padding', PADDING + "%")
        .css('background', 'black')
        .css('position', 'relative');

    // Draw framework of trapezoids

}


init('viewport-splitter', '100%', '100%');

module.exports = null;
