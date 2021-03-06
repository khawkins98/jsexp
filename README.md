# Reaction-diffusion backgrounds for the web

## What is reaction-diffusion?

From the [uses the Gray-Scott solver](http://pmneila.github.com/jsexp/grayscott)
> Roughly, this can be seen as a simulation of the behavior of diffusive living beings reproducing under conditions of limited food. Very different patterns emerge for slight changes in feeding and death rates.

For more on this concept, see:
- [www.karlsims.com/rd-exhibit.html](http://www.karlsims.com/rd-exhibit.html)
- [www.karlsims.com/rd.html](http://www.karlsims.com/rd.html)

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
    drawingType: 0,
    accuracy: 280,
    scale: 1.4,
    renderBoost: 600
  }
  var vis = new DiffusionVis(settings);
</script>
```

## Requirements
- WebGL: Browser and hardware [support of Three.js](http://caniuse.com/#feat=webgl)
- jQuery: Not strictly necessary. (You could remove this dependency with some effort).

## Demo
The code from above. [This works when viewed as a web page](https://khawkins98.github.io/reaction-diffusion/).
<script type="text/javascript" src="https://khawkins98.github.io/reaction-diffusion/3rd/jquery-1.6.2.min.js"></script>
<script type="text/javascript" src="https://khawkins98.github.io/reaction-diffusion/3rd/three.min.js"></script>
<script type="text/javascript" src="https://khawkins98.github.io/reaction-diffusion/grayscott.js"></script>
<div id="targetparent">
  <div id="target" style="width: 700px; height: 400px; border: 1px solid #aaa">Some stuff here, the visulisation is z-layered underneath.</div>
</div>
<script>
  var settings = {
    target: '#target',
    color1: [255,255,255,.19],
    color2: [255,255,255,.2],
    color3: [0,124,131,.9],
    opacity: 0.9,
    drawingType: 0,
    accuracy: 280,
    scale: 1.4,
    renderBoost: 600
  }
  var vis = new DiffusionVis(settings);
</script>

## Credit
This uses the visulisation developed by [pmneila](https://github.com/pmneila/) at [github.com/pmneila/jsexp](https://github.com/pmneila/jsexp)
