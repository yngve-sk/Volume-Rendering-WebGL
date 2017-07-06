# In-browser medical volume renderer

Attempt at making a volume renderer with WebGL. 
See Wiki for installation / usage instructions (has animated gif images).

DISCLAIMER: The project still needs some overhauls + it is not being actively developed at the moment. The picking buffer previews beneath, console logs and other junk is just there for development but should not affect performance that hard.

## Table of contents:

* [Loading a dataset](#DatasetLoading)
* [Windowing operations](#WindowingOperations)
  * [Adding and removing subviews](#AddSubview)
  * [Linking and unlinking properties between subviews](#Linking)
  * [Local vs global controllers](#LocalVsGlobal)
  * [Selecting a subview](#SelectSubview)
  
* [Changing appearance of the volume](#VolumeAppearance)
  * [Transfer Function](#TransferFunction)
    * [Adjusting opacity](#AdjustOpacity)
    * [Adding a control point](#AddPoint)
    * [Deleting a control point](#DeletePoint)
    * [Dropping a control point](#DropPoint)
    * 
    * [Adding a color gradient control point](#AddCGControlPoint)
    * [Deleting gradient control point](#DeleteCGControlPoint)
    * [Moving a color gradient control point](#MoveCGControlPoint)
    * [Changing color of a color gradient control point](#ChangeCGControlPoint)
    * 
  * [Thresholds & Histogram](#Histogram)
    * [Surface weighting](#SurfaceWeighting)
    * [Overall visibility](#OverallVisibility)
    * [Isovalue threshold & histogram](#HistogramThreshold)
    * 
  * [Lighting](#Lighting)
    * [Intensity](#Intensity)
    * [Lighting isovalue threshold](#LightThreshold)
    * [Ambient](#Ambient)
    * [Diffuse](#Diffuse)
    * [Specular](#Specular)
    *
  * [Camera settings (Toggle ortho & perspective)](#Camera)

* [Interacting with the volume](#Interacting)
  * [Camera navigation (Rotate, zoom & move)](#CameraSettings)
  * [Slicing](#InteractSlicer)
  * [Selecting a ray](#SelectRay)

## [Dataset Loading<a name="DatasetLoading"></a>](#DatasetLoading)
```
  Loading a dataset:
```

![Adding a subview](./screenshots/dataset-load.gif)


## [Windowing Operations<a name="WindowingOperations"></a>](#WindowingOperations)

## <a name="AddSubview"></a>
```
  Adding a subview (Click):
```

![Adding a subview](./screenshots/windowing-addsubview.gif)


```
  Removing a subview (Click):
```

![Removing a subview](./screenshots/windowing-removesubview.gif)
 
## <a name="Linking"></a>

```
  Linking properties between subviews (Click, move and click):
```

![Linking properties](./screenshots/windowing-linkingprops.gif)
 
## <a name="LocalVsGlobal"></a>
```
  Setting properties to global (Click to toggle):
```

![Toggle global](./screenshots/windowing-toggleglobal.gif)

## <a name="SelectSubview"></a>
```
  Selecting a local subview (Click to select):
```

![Selecting a subview](./screenshots/windowing-selectsubview.gif)
 
 
## [Volume Appearance<a name="VolumeAppearance"></a>](#VolumeAppearance)

## <a name="TransferFunction"></a> Transfer Function
# <a name="AdjustOpacity"></a>
```
  Adjusting opacity (Drag)
```

![Adjust opacity](./screenshots/tf-adjustopacity.gif)

# <a name="AddPoint"></a>
```
  Adding a control point (Click)
```

![Adjust opacity](./screenshots/tf-addcontrolpoint.gif)

# <a name="DeletePoint"></a>
```
  Deleting a control point (Double click)
```

![Adjust opacity](./screenshots/tf-delete.gif)

# <a name="DropPoint"></a>
```
  Dropping a control point (Single click)
```

![Adjust opacity](./screenshots/tf-drop.gif)

# <a name="AddCGControlPoint"></a>
```
  Adding a color gradient control point (Click on the gradient below)
```

![Adjust opacity](./screenshots/tf-addcgcontrolpoint.gif)

# <a name="DeleteCGControlPoint"></a>
```
  Deleting gradient control point (Click on the cross below the control point)
```

![Adjust opacity](./screenshots/tf-deletecgcontrolpoint.gif)

# <a name="MoveCGControlPoint"></a>
```
  Moving a color gradient control point (Drag a triangle)
```

![Adjust opacity](./screenshots/tf-movecgcontrolpoint.gif)

# <a name="ChangeCGControlPoint"></a>
```
  Changing color of a color gradient control point (Double-Click on triangle & select color)
```

![Adjust opacity](./screenshots/tf-changecgcontrolpoint.gif)

## <a name="Histogram"></a> Histogram And Thresholds

# <a name="SurfaceWeighting"></a>

```
  Surface weighting (Higher weighting = more prominent surfaces and less prominent non-surfaces)
```
![Surface Weighting](./screenshots/histo-surfaceweighting.gif)

<a name="OverallVisibility"></a>
```
  Modifying overall visibility (It is useful to adjust this UP and surface weighting is adjusted up)
``` 
![Overall visibility](./screenshots/histo-overallopacity.gif)

<a name="HistogramThreshold"></a>
```
  Histogram & Thresholds (Drag slider to adjust displayed range of isovalues)
```
![Histogram and thresholds](./screenshots/histo-thresholds.gif)

# [Lighting<a name="Lighting"></a>](#Lighting)
<a name="Intensity"></a>
```
Adjust intensity (Adjusts all light components)
```

![Intensity](./screenshots/lights-overallintensity.gif)

<a name="LightThreshold"></a>
```
Lighting range (select which isovalues to apply lighting to)
```

![Intensity](./screenshots/lights-threshold.gif)

<a name="Ambient"></a>
```
Adjust ambient (High ambience makes color more prominent)
```

![Intensity](./screenshots/lights-ambient.gif)

<a name="Diffuse"></a>
```
Adjust diffuse lighting
```

![Intensity](./screenshots/lights-diffuse.gif)

<a name="Specular"></a>
```
Adjust specular lighting 
```

![Intensity](./screenshots/lights-specular.gif)

# [Camera<a name="Camera"></a>](#Camera)
```
Toggle ortho and perspective
```

![Camera interaction](./screenshots/camera-toggle.gif)

## [Interacting<a name="Interacting"></a>](#Interacting)


<a name="#CameraSettings"></a>

```
Camera operations - (Move, rotate, zoom)
```

![Camera interaction](./screenshots/interact-camera.gif)
<a name="#InteractSlicer"></a>
```
Slicing the volume (Drag a slice along the edges of the box)
```

![Camera interaction](./screenshots/interact-slicer.gif)

<a name="#SelectRay"></a>
```
Selecting a ray
```
![Camera interaction](./screenshots/interact-ray.gif)
