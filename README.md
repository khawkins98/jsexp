# Reaction-diffusion backgrounds for the web

## What is reaction-diffusion?

From the [uses the Gray-Scott solver](http://pmneila.github.com/jsexp/grayscott)
> Roughly, this can be seen as a simulation of the behavior of diffusive living beings reproducing under conditions of limited food. Very different patterns emerge for slight changes in feeding and death rates.

For more on this concept, see:
- http://www.karlsims.com/rd-exhibit.html
- http://www.karlsims.com/rd.html

## Using

Like so:
``` html
<script type="text/javascript" src="3rd/three.min.js"></script>
<script type="text/javascript" src="grayscott/grayscott.js"></script>
<div id="targetparent">
  <div id="target" style="width: 700px; height: 400px; border: 1px solid #aaa">Some content here</div>
</div>
<script>
  var settings = {
    target: '#target',
    color1: [255,255,255,.19],
    color2: [255,255,255,.2],
    color3: [0,124,131,.9],
    opacity: 0.9,
    drawingType: 0
  }
  DiffusionVis.init(settings);
</script>
```

## Requirements
- WebGL: a browser and hardware [that supports Three.js](http://caniuse.com/#feat=webgl)
- jQuery: Not strictly necessary. You could remove with some effort.

## Demo
<script type="text/javascript" src="3rd/three.min.js"></script>
<script type="text/javascript" src="grayscott/grayscott.js"></script>
<div id="targetparent">
  <div id="target" style="width: 700px; height: 400px; border: 1px solid #aaa">Some content here</div>
</div>
<script>
  var settings = {
    target: '#target',
    color1: [255,255,255,.19],
    color2: [255,255,255,.2],
    color3: [0,124,131,.9],
    opacity: 0.9,
    drawingType: 0
  }
  DiffusionVis.init(settings);
</script>

## Credit
This uses the visulisation developed by [pmneila](https://github.com/pmneila/) at https://github.com/pmneila/jsexp
