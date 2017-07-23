/*
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

(function(){

// Shader literals.
var standardVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

var gsFragmentShader = `
  varying vec2 vUv;
  uniform float screenWidth;
  uniform float screenHeight;
  uniform sampler2D tSource;
  uniform float delta;
  uniform float feed;
  uniform float kill;
  uniform float scale;
  uniform vec2 brush;

  // float scale = 3.4;

  vec2 texel = vec2(1.0/screenWidth, 1.0/screenHeight);
  float step_x = scale/screenWidth;
  float step_y = scale/screenHeight;

  void main() {
    if(brush.x < -5.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }

    //float feed = vUv.y * 0.083;
    //float kill = vUv.x * 0.073;

    vec2 uv = texture2D(tSource, vUv).rg;
    vec2 uv0 = texture2D(tSource, vUv+vec2(-step_x, 0.0)).rg;
    vec2 uv1 = texture2D(tSource, vUv+vec2(step_x, 0.0)).rg;
    vec2 uv2 = texture2D(tSource, vUv+vec2(0.0, -step_y)).rg;
    vec2 uv3 = texture2D(tSource, vUv+vec2(0.0, step_y)).rg;

    vec2 lapl = (uv0 + uv1 + uv2 + uv3 - 4.0*uv);//10485.76;
    float du = /*0.00002*/0.2097*lapl.r - uv.r*uv.g*uv.g + feed*(1.0 - uv.r);
    float dv = /*0.00001*/0.105*lapl.g + uv.r*uv.g*uv.g - (feed+kill)*uv.g;
    vec2 dst = uv + delta*vec2(du, dv);

    if(brush.x > 0.0) {
        vec2 diff = (vUv - brush)/texel;
        float dist = dot(diff, diff);
        if(dist < 5.0)
            dst.g = 0.9;
    }

    gl_FragColor = vec4(dst.r, dst.g, 0.0, 1.0);
  }
`;
var screenFragmentShader = `
  varying vec2 vUv;
  uniform float screenWidth;
  uniform float screenHeight;
  uniform sampler2D tSource;
  uniform float delta;
  uniform float feed;
  uniform float kill;
  uniform vec4 color1;
  uniform vec4 color2;
  uniform vec4 color3;
  uniform vec4 color4;
  uniform vec4 color5;

  vec2 texel = vec2(.0/screenWidth, 1.0/screenHeight);

  void main() {
      float value = texture2D(tSource, vUv).g;
      //int step = int(floor(value));
      //float a = fract(value);
      float a;
      vec3 col;

      if(value <= color1.a)
        col = color1.rgb;
      if(value > color1.a && value <= color2.a) {
        a = (value - color1.a)/(color2.a - color1.a);
        col = mix(color1.rgb, color2.rgb, a);
      }
      if(value > color2.a && value <= color3.a) {
        a = (value - color2.a)/(color3.a - color2.a);
        col = mix(color2.rgb, color3.rgb, a);
      }
      if(value > color3.a && value <= color4.a) {
        a = (value - color3.a)/(color4.a - color3.a);
        col = mix(color3.rgb, color4.rgb, a);
      }

    gl_FragColor = vec4(col.r, col.g, col.b, 1.0);
  }
`;


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
var mLastTime = 0;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);

// Some presets.
var accuracy = 280; // lower = more accourate
var scale = 3.4; // 1.0 = 100%
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

var white = new THREE.Vector4(1, 1, 1, 0.15);



init = function(){

    // insert canvas
    var canvas = document.createElement('canvas');
    canvas.id     = "myCanvas";
    canvas.width  = 1224;
    canvas.height = 768;
    canvas.style.marginBottom = "-768px";
    canvas.style.zIndex = "-1";
    canvas.style.position = "relative";
    var element = document.getElementById('target');
    var targetparent = document.getElementById('targetparent');
    targetparent.insertBefore(canvas, element);

    canvasQ = $(canvas);

    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;

    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: false});

    mScene = new THREE.Scene();
    mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    // mCamera.position.z = 10;
    mScene.add(mCamera);

    mUniforms = {
        screenWidth: {type: "f", value: undefined},
        screenHeight: {type: "f", value: undefined},
        tSource: {type: "t", value: undefined},
        delta: {type: "f", value: 1.0},
        scale: {type: "f", value: scale},
        feed: {type: "f", value: feed},
        kill: {type: "f", value: kill},
        brush: {type: "v2", value: new THREE.Vector2(-10, -10)},
        color1: {type: "v4", value: white},
        color2: {type: "v4", value: white},
        color3: {type: "v4", value: white}
    };
    mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3];

    mGSMaterial = new THREE.ShaderMaterial({
      uniforms: mUniforms,
      vertexShader: standardVertexShader,
      fragmentShader: gsFragmentShader,
    });
    mScreenMaterial = new THREE.ShaderMaterial({
      uniforms: mUniforms,
      vertexShader: standardVertexShader,
      fragmentShader: screenFragmentShader,
    });

    var plane = new THREE.PlaneGeometry(1.0, 1.0);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
    mScene.add(mScreenQuad);

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


    mColors[0].value = new THREE.Vector4(1, 1, 1, 0.199);
    mColors[1].value = new THREE.Vector4(107/255, 172/255, 67/255, 0.2);
    mColors[2].value = new THREE.Vector4(107/255, 172/255, 67/255, 0.9);
    // mColors[2].value = new THREE.Vector4(0.8666, 0.8666, 0.8666, 0.9);
    setTimeout( function() {
    }, 1600 );


    // set drawing type
    feed = presets[4].feed;
    // kill = presets[4].kill;

}

var resize = function(width, height) {
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

    // do not wrap at edges
    // mTexture1.wrapS = THREE.RepeatWrapping;
    // mTexture1.wrapT = THREE.RepeatWrapping;
    // mTexture2.wrapS = THREE.RepeatWrapping;
    // mTexture2.wrapT = THREE.RepeatWrapping;

    mUniforms.screenWidth.value = canvasWidth/2;
    mUniforms.screenHeight.value = canvasHeight/2;
}

var render = function(time) {
    var dt = (time - mLastTime)/20.0;
    if(dt > 0.8 || dt<=0)
        dt = 0.8;
    mLastTime = time;

    mScreenQuad.material = mGSMaterial;
    mUniforms.delta.value = dt;
    mUniforms.feed.value = presets[8].feed;
    mUniforms.kill.value = presets[8].kill;

    for(var i=0; i<accuracy; ++i) {
      if(!mToggled) {
        mUniforms.tSource.value = mTexture1;
        mRenderer.render(mScene, mCamera, mTexture2, true);
        mUniforms.tSource.value = mTexture2;
      } else {
        mUniforms.tSource.value = mTexture2;
        mRenderer.render(mScene, mCamera, mTexture1, true);
        mUniforms.tSource.value = mTexture1;
      }

      mToggled = !mToggled;
      mUniforms.brush.value = mMinusOnes;
    }

    mScreenQuad.material = mScreenMaterial;
    mRenderer.render(mScene, mCamera);

    // set FPS
    // run super fast for fist X second
    if (mLastTime < 1600) {
      // console.log(mLastTime);
      requestAnimationFrame(render);
    } else if (mLastTime < 10000){ // cap at 100 seconds
      accuracy = 10;
      setTimeout( function() {
        requestAnimationFrame( render );
      }, 1000 / 10 );
    }
}



var onMouseMove = function(e){
  var ev = e ? e : window.event;

  mMouseX = ev.pageX - canvasQ.offset().left; // these offsets work with
  mMouseY = ev.pageY - canvasQ.offset().top; //  scrolled documents too

  if(mMouseDown)
    mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseDown = function(e){
  var ev = e ? e : window.event;
  mMouseDown = true;

  mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseUp = function(e){
  mMouseDown = false;
}


})();
