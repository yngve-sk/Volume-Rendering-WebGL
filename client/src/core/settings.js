let d3 = require('d3');

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
                    width: 400,
                    height: 200
                },
                Layout: {
                    leftAxisWidthPercentage: 0.07,
                    bottomAxisHeightPercentage: 0.25,
                    isoValueAxisHeightPercentage: 0.110,
                    contentTopPaddingPercentage: 0.2,
                    texturePreviewHeightPercentage: 0.2
                },
                TransferFunctionDisplay: {
                    curve: d3.curveLinear,
                    circleRadius: 6
                },
                ColorGradientDisplay: {
                    triangleSize: 45,
                    crossSize: 45,
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
                'ADD': 'green'
            }
        }
    },
    WSClient: {
        Timeouts: {
            getDatasetList: 5000,
            getDatasetHeader: 5000,
            getDatasetIsovalues: 30000
        },
        loadAutomaticallyByDefault: false
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
            }
        }
    }
}


module.exports = SETTINGS;
