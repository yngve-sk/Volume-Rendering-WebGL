let d3 = require('d3');
let SplitViewIconSet = require('../widgets/split-view/icon-set');
/** @module Settings */

/**
 * Settings for the linker / splitter views.
 * @typedef {Object} LinkerAndSplitterViewSettings

 * @property {number} maxRows - Maximum amount of rows allowed (Note: Will decide amount of subviews available)
 * @property {number} maxColumns - Maximum amount of columns allowed (Note: Will decide amount of subviews available)
 * @property {bool} showIDs if true, the cell IDs will show
 * @property {number} bottomTopThresholdPercentage Percentage at which the mouse snaps to being seen as being closest to the bottom/top of the row as opposed to closest to one of the sides of the current cell. Only used when adding cells.

 * @property {Object} colors Colors of the view
 * @property {string[]} colors.LINKS Array of valid CSS colors (hex, rgba, string). The length of this array will be the maximum amount of groups allowed, and will also decide the coloring of the link groups in each link view.
 * @property {string} colors.REMOVE Color of a cell when mouse is over it and the mode set to REMOVE (remove cells).
 * @property {string} colors.ADD Color of a cell when mouse is over it and the mode set to ADD (add cells).
 * @memberof module:Settings
 **/


/**
 * Settings for the transfer function editor
 * @typedef {Object} TransferFunctionEditorSettings
 * @property {Object} Resolution Higher resolution = higher quality, but possibly also lower performance. (Also note the relation between this and the hardcoded other hardcoded sizes)
 * @property {number} Resolution.width Any number
 * @property {number} Resolution.height Any number

 * @property {Object} Layout
 * @property {number} Layout.leftAxisWidthPercentage [0, 1]
 * @property {number} Layout.bottomAxisHeightPercentage [0, 1]
 * @property {number} Layout.isoValueAxisHeightPercentage [0, 1]
 * @property {number} Layout.contentTopPaddingPercentage [0, 1]
 * @property {number} Layout.texturePreviewHeightPercentage [0, 1]

 * @property {Object} TransferFunctionDisplay
 * @property {d3.curve} TransferFunctionDisplay.curve Any number
 * @property {number} TransferFunctionDisplay.circleRadius Any number

 * @property {Object} ColorGradientDisplay
 * @property {number} ColorGradientDisplay.triangleSize Any number
 * @property {number} ColorGradientDisplay.crossSize Any number
 * @property {number} ColorGradientDisplay.trianglesGroupTranslateY Any number:
 * @property {number} ColorGradientDisplay.crossTranslateY Any number
 * @memberof module:Settings
 **/

/**
 *
 * @typedef {Object} WSClientSettings
 * @property {Object} Timeouts timeout (millis) max wait when fetching resource from server
 * @property {number} Timeouts.getDatasetList millis max wait
 * @property {number} Timeouts.getDatasetHeader millis max wait
 * @property {number} Timeouts.getDatasetIsovalues millis max wait
 * @memberof module:Settings
 **/

/**
 * Settings for the windowing overlay object ({@link module:Widgets/View.MiniatureSplitViewOverlay})
 * @typedef {Object} WindowingOverlaySettings
 * @property {module:Widgets/View.SubcellLayoutConfig} SubcellLayout
 * @property {Object} Options
 * @property {bool} Options.showIDs - Whether or not to render cell IDs @ the overlay
   @property {number} Options.bottomTopThresholdPercentage - [0, 1]
 *
 * @memberof module:Settings
 **/

/**
* Holds all settings
*
* @property {Object} Widgets Settings for all widgets (SplitView / TransferFunction)
* @property {Object} Widgets.TransferFunction Settings for transfer functions

* @property {module:Settings.TransferFunctionEditorSettings} Widgets.TransferFunction.Editor

* @property {module:Settings.LinkerAndSplitterViewSettings} Widgets.LinkerAndSplitterView Settings for the linker / splitter views.

* @property {module:Settings.WSClientSettings} WSClient Websocket client settings

* @property {Object} Views Settings for subviews & view manager
* @property {module:Settings.WindowingOverlaySettings} Views.ViewManager.WindowsOverlay Settings for the windowing overlay

*/
let SETTINGS = {
    Widgets: {
        TransferFunction: {
            Editor: {
                Resolution: {
                    width: 600,
                    height: 300
                },
                Layout: {
                    leftAxisWidthPercentage: 0.07,
                    bottomAxisHeightPercentage: 0.25,
                    isoValueAxisHeightPercentage: 0.16,
                    contentTopPaddingPercentage: 0.2,
                    texturePreviewHeightPercentage: 0.2
                },
                TransferFunctionDisplay: {
                    curve: d3.curveLinear,
                    circleRadius: 4.5
                },
                ColorGradientDisplay: {
                    triangleSize: 95,
                    crossSize: 85,
                    trianglesGroupTranslateY: -10,
                    crossTranslateY: 17
                }
            }
        },
        LinkerAndSplitterView: {
            maxRows: 10,
            maxColumns: 10,
            showIDs: false,
            bottomTopThresholdPercentage: 0.20,
            colors: {
                'LINKS': ['red', 'green', 'white', 'aqua', 'brown', 'gold'],
                'REMOVE': 'red',
                'ADD': 'green',
                'SELECT': 'green',
                'EDIT': 'darkblue'
            },
            showIconsOnLinkingViews: false,
            showIconsOnAddRemoveView: true,
            showIconsOnSelectView: true,
            icons: new SplitViewIconSet({
                /*Icons: {
                    'Surface View': '../images/icons/skull-icon.png',
                    'Slice View': '../images/icons/icon-slicer.png',
                    '3D Volume': '../images/icons/3d-icon-skull.png'


                },*/
                Icons: {
                    'Blank': '../images/preset-icons/Blank.png',
                    'Basic': '../images/preset-icons/Basic.png',
                    'X-Ray': '../images/preset-icons/X-Ray.png',
                    'Brain': '../images/preset-icons/Brain.png',
                    'Sinuses&Lungs': '../images/preset-icons/Sinuses&Lungs.png',
                    'Skeleton': '../images/preset-icons/Skeleton.png',

                },
                defaultIcon: '3D Volume'
            })
        }
    },
    WSClient: {
        Timeouts: {
            getDatasetList: 10000,
            getDatasetHeader: 10000,
            getDatasetIsovalues: 200000
        },
        loadAutomaticallyByDefault: false,
        get: 'isovaluesAndGradientMagnitudes',
        //get: 'isovalues'
    },
    Views: {
        ViewManager: {
            WindowsOverlay: {
                Options: {
                    showIDs: true,
                    bottomTopThresholdPercentage: 0.1
                },
                SubcellLayout: {
                    changeLayoutThresholdMultiplier: 2.2,
                    standardSizeMultiplier: 0.7
                }
            },
            DefaultViewConfig: {
                Volume: 'Basic',
                Volume3DPicking: 'Default',
                Slicer: 'Basic',
                SlicerPicking: 'Basic',
                SlicerPickingSlices: 'Default',
                SlicerPickingRails: 'Default',
                SlicerPickingCubeFaces: 'Default',
                VolumeRayRender: 'Default',
                VolumePointRenderer: 'Default'
            }
        },
        Slicer: {
            SelectSliceSnapThreshold: 0.19,
            RailRadiusDisplayMode: 0.02,
            RailRadialSubdivisions: 7,
            RailVerticalSubdivisions: 3,
            RailRadiusPickingBufferMode: 0.08,
            RailOutwardsFactorPickingBuffer: 1.0 // 1.0 means none, 2 means way too far out
        },
        ContextMenus: {
            Volume: { // Item name : icon img path
                'Rotate': '../images/icons/rotate.png',
                'Move': '../images/icons/move.png',
                'Zoom': '../images/icons/zoom.png',
                //'Measure': '../images/icons/ruler.png',
                //'Select Point': '../images/icons/ruler.png',
                'Select Ray': '../images/icons/ruler.png'
            },
            Slicer: {
                'Rotate': '../images/icons/rotate.png',
                /*'Zoom': '../images/icons/zoom.png',
                'Add Slice': '../images/icons/add.png',
                'Remove Slice': '../images/icons/remove.png',*/
                'Move Slice': '../images/icons/move-slice.png',
            }
        }
    },
    Lights: {
        MaxValues: {
            ambient: 2.0,
            diffuse: 2.0,
            specular: 5.0,
            intensity: 3.0,
            specularExponent: 1.5, // Inverted, i.e put 5 and the max exponent will be -5
            isovalueThreshold: 0.59,
            gradientMagBelowThresholdOpacityMultiplier: 1.0
        },
        Defaults: {
            ambient: 0.2,
            diffuse: 0.5,
            specular: 0.9,
            intensity: 0.2,
            specularExponent: 0.8,
            isovalueThresholdMIN: 0.00,
            gradientMagBelowThresholdOpacityMultiplier: 0.8,
            direction: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]
        }
    }
}


module.exports = SETTINGS;
