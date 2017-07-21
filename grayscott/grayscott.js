/*
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

(function(){

// Canvas.
var canvas;
var canvasQ;
var canvasWidth;
var canvasHeight;

var mMouseX, mMouseY;
var mMouseDown = false;

var mRenderer;
var mScene;
var mCamera;
var mUniforms;
var mColors;
var mColorsNeedUpdate = true;
var mLastTime = 0;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);

// Some presets.
var presets = [
    { // Default
      feed: 0.037,
      kill: 0.06
    },
    { // Solitons
        feed: 0.03,
        kill: 0.062
    },
    { // Pulsating solitons
        feed: 0.025,
        kill: 0.06
    },
    { // Worms.
        feed: 0.078,
        kill: 0.061
    },
    { // Mazes
        feed: 0.029,
        kill: 0.057
    },
    { // Holes
        feed: 0.039,
        kill: 0.058
    },
    { // Chaos
        feed: 0.026,
        kill: 0.051
    },
    { // Chaos and holes (by clem)
        feed: 0.034,
        kill: 0.056
    },
    { // Moving spots.
        feed: 0.014,
        kill: 0.054
    },
    { // Spots and loops.
        feed: 0.018,
        kill: 0.051
    },
    { // Waves
        feed: 0.014,
        kill: 0.045
    },
    { // The U-Skate World
        feed: 0.062,
        kill: 0.06093
    },
    { // ken's loops
      feed: 0.0178,
      kill: 0.06

    }
];

// Configuration.
var feed = presets[4].feed;
var kill = presets[4].kill;

init = function(){
    init_controls();

    canvasQ = $('#myCanvas');
    canvas = canvasQ.get(0);

    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;

    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});

    mScene = new THREE.Scene();
    mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    mCamera.position.z = 100;
    mScene.add(mCamera);

    mUniforms = {
        screenWidth: {type: "f", value: undefined},
        screenHeight: {type: "f", value: undefined},
        tSource: {type: "t", value: undefined},
        delta: {type: "f", value: 1.0},
        feed: {type: "f", value: feed},
        kill: {type: "f", value: kill},
        brush: {type: "v2", value: new THREE.Vector2(-10, -10)},
        color1: {type: "v4", value: new THREE.Vector4(0, 0, 0.0, 1)},
        color2: {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2)},
        color3: {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.31)},
        color4: {type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4)},
        color5: {type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6)}
    };
    // mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3, mUniforms.color4, mUniforms.color5];
    mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3];
    // $("#gradient").gradient("setUpdateCallback", onUpdatedColor);

    mGSMaterial = new THREE.ShaderMaterial({
      uniforms: mUniforms,
      vertexShader: document.getElementById('standardVertexShader').textContent,
      fragmentShader: document.getElementById('gsFragmentShader').textContent,
    });
    mScreenMaterial = new THREE.ShaderMaterial({
      uniforms: mUniforms,
      vertexShader: document.getElementById('standardVertexShader').textContent,
      fragmentShader: document.getElementById('screenFragmentShader').textContent,
    });

    var plane = new THREE.PlaneGeometry(1.0, 1.0);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
    mScene.add(mScreenQuad);

    mColorsNeedUpdate = true;

    resize(canvas.clientWidth, canvas.clientHeight);


    render(0);
    // mUniforms.brush.value = new THREE.Vector2(0.5, 0.5);
    mLastTime = new Date().getTime();


    // seed the canvase with 'clicks'
    // todo make function
    setTimeout( function() {
      mUniforms.brush.value = new THREE.Vector2((canvasWidth*.5)/canvasWidth, 1-(canvasHeight*.2)/canvasHeight);
    }, 200 );
    setTimeout( function() {
      mUniforms.brush.value = new THREE.Vector2((canvasWidth*.8)/canvasWidth, 1-(canvasHeight*.8)/canvasHeight);
    }, 450 );
    setTimeout( function() {
      mUniforms.brush.value = new THREE.Vector2((canvasWidth*.3)/canvasWidth, 1-(canvasHeight*.7)/canvasHeight);
    }, 550 );
    loadPreset(4);

    // requestAnimationFrame(render);
}

var resize = function(width, height)
{
    // Set the new shape of canvas.
    canvasQ.width(width);
    canvasQ.height(height);

    // Get the real size of canvas.
    canvasWidth = canvasQ.width();
    canvasHeight = canvasQ.height();

    mRenderer.setSize(canvasWidth, canvasHeight);

    // TODO: Possible memory leak?
    mTexture1 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture2 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture1.wrapS = THREE.RepeatWrapping;
    mTexture1.wrapT = THREE.RepeatWrapping;
    mTexture2.wrapS = THREE.RepeatWrapping;
    mTexture2.wrapT = THREE.RepeatWrapping;

    mUniforms.screenWidth.value = canvasWidth/2;
    mUniforms.screenHeight.value = canvasHeight/2;
}

var render = function(time)
{
    var dt = (time - mLastTime)/20.0;
    if(dt > 0.8 || dt<=0)
        dt = 0.8;
    mLastTime = time;

    mScreenQuad.material = mGSMaterial;
    mUniforms.delta.value = dt;
    mUniforms.feed.value = presets[8].feed;
    mUniforms.kill.value = presets[8].kill;

    for(var i=0; i<8; ++i)
    {
        if(!mToggled)
        {
            mUniforms.tSource.value = mTexture1;
            mRenderer.render(mScene, mCamera, mTexture2, true);
            mUniforms.tSource.value = mTexture2;
        }
        else
        {
            mUniforms.tSource.value = mTexture2;
            mRenderer.render(mScene, mCamera, mTexture1, true);
            mUniforms.tSource.value = mTexture1;
        }

        mToggled = !mToggled;
        mUniforms.brush.value = mMinusOnes;
    }

    if(mColorsNeedUpdate)
        updateUniformsColors();

    mScreenQuad.material = mScreenMaterial;
    mRenderer.render(mScene, mCamera);

    // set FPS
    // run super fast for fist X second
    if (mLastTime < 5000) {
      // console.log(mLastTime);
      requestAnimationFrame(render);
    } else if (mLastTime < 100000){ // cap at 100 seconds
      setTimeout( function() {
        requestAnimationFrame( render );
      }, 1000 / 10 );
    }
}

loadPreset = function(idx)
{
    feed = presets[idx].feed;
    kill = presets[idx].kill;
    worldToForm();
}

var updateUniformsColors = function()
{
    var values = $("#gradient").gradient("getValuesRGBS");
    console.log(mColors);
    for(var i=0; i<mColors.length; i++)
    {
        var v = values[i];
        mColors[i].value = new THREE.Vector4(v[0], v[1], v[2], v[3]);
    }

    mColorsNeedUpdate = false;
}

// var onUpdatedColor = function()
// {
//     mColorsNeedUpdate = true;
//     updateShareString();
// }

var onMouseMove = function(e)
{
    var ev = e ? e : window.event;

    mMouseX = ev.pageX - canvasQ.offset().left; // these offsets work with
    mMouseY = ev.pageY - canvasQ.offset().top; //  scrolled documents too

    if(mMouseDown)
        mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseDown = function(e)
{
    var ev = e ? e : window.event;
    mMouseDown = true;

    mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseUp = function(e)
{
    mMouseDown = false;
}

clean = function()
{
    mUniforms.brush.value = new THREE.Vector2(-10, -10);
}

snapshot = function()
{
    var dataURL = canvas.toDataURL("image/png");
    window.open(dataURL, "name-"+Math.random());
}

// resize canvas to fullscreen, scroll to upper left
// corner and try to enable fullscreen mode and vice-versa
fullscreen = function() {

    var canv = $('#myCanvas');
    var elem = canv.get(0);

    if(isFullscreen())
    {
        // end fullscreen
        if (elem.cancelFullscreen) {
            elem.cancelFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }

    if(!isFullscreen())
    {
        // save current dimensions as old
        window.oldCanvSize = {
            width : canv.width(),
            height: canv.height()
        };

        // adjust canvas to screen size
        resize(screen.width, screen.height);

        // scroll to upper left corner
        $('html, body').scrollTop(canv.offset().top);
        $('html, body').scrollLeft(canv.offset().left);

        // request fullscreen in different flavours
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }
}

var isFullscreen = function()
{
    return document.mozFullScreenElement ||
        document.webkitCurrentFullScreenElement ||
        document.fullscreenElement;
}

$(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(ev) {
    // restore old canvas size
    if(!isFullscreen())
        resize(window.oldCanvSize.width, window.oldCanvSize.height);
});

var worldToForm = function()
{
}

var init_controls = function()
{
}


})();
