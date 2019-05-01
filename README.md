# TileMill Autopilot Plugin
A simplified interface for creating basic maps. Changes are made through a GUI of sliders and pickers, not directly through Stylesheets. 

## Installation Instructions
* Clone/copy folder and place in your ../tilemill/plugins folder.  The first letter of the folder needs to be after 'e' for editor, as this plugin relies upon the `editor` plugin.
* Create a new project, and autopilot will be enabled by default
* Once you disable it, you can't turn it back on again for the project

## Usage
* Layers and their display are configured together. You Add a Layer, then configure how it is viewed at the same time. Each layer has 2 buttons: Text and Fill. *Text* controls the font and size.  *Fill* controls the point or line display

The controls for each are roughly :
* *Fields*: choose a value to filter, then select the first button on the right. Currently, seems like you can only choose `zoom` as a filter. you then choose the zoom values that this layer should be displayed at: min and max. If you set the zoom to 13..15, for example, this is equivalent to setting 3 entries to `[zoom=13]` and `[zoom=14]` and `[zoom=15]` in a Stylesheet.
### Text
* *Zoom Delta*: This is the multiplication factor applied to each successive text zoom size, starting at the lowest filtered zoom value selected. 
* *Size*: This controls the text font size.  The minimum Size value is used as the starting size for the text at the lowest filtered zoom range, and the maximum size is used for the text size at the largest filtered zoom range. The size is proportionally spread across the zoom levels in-between.
* *Kerning*: Controls the spacing factor between each text character
* *Text field*: Which field from the layer to display
* *Font*: Which font to use

### Fill
* *Zoom Delta*: This is the multiplication factor applied to each successive zoom size, starting at the lowest filtered zoom value selected. 
* *Size*: This controls a point, using a Marker element.  The minimum Size value is used as the starting size for the point at the lowest filtered zoom range, and the maximum size is used for the point size at the largest filtered zoom range. The size is proportionally spread across the zoom levels in-between.
* *Line*: This controls a line or way, using the Line element. The minimum Size value is used as the starting width for the line at the lowest filtered zoom range, and the maximum size is used for the line size at the largest filtered zoom range. The size is proportionally spread across the zoom levels in-between.
