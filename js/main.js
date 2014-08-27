'use strict';

var clock = new THREE.Clock();
var time = Date.now();

var vrHMD, vrSensor;

var cssContainer;
var cssCamera;

var container;

var renderer;
var scene;
var head;
var camera;
var controls;

var w, h;

var updateFns = [];

var players = [];
var player; // current

var videos = [
  'OlXrjTh7vHc'
];

var ytReady = false;


// helper function to convert a quaternion into a matrix, optionally
// inverting the quaternion along the way
function matrixFromOrientation(q, inverse) {
  var m = Array(16);

  var x = q.x, y = q.y, z = q.z, w = q.w;

  // if inverse is given, invert the quaternion first
  if (inverse) {
    x = -x; y = -y; z = -z;
    var l = Math.sqrt(x*x + y*y + z*z + w*w);
    if (l == 0) {
      x = y = z = 0;
      w = 1;
    } else {
      l = 1/l;
      x *= l; y *= l; z *= l; w *= l;
    }
  }

  var x2 = x + x, y2 = y + y, z2 = z + z;
  var xx = x * x2, xy = x * y2, xz = x * z2;
  var yy = y * y2, yz = y * z2, zz = z * z2;
  var wx = w * x2, wy = w * y2, wz = w * z2;

  m[0] = 1 - (yy + zz);
  m[4] = xy - wz;
  m[8] = xz + wy;

  m[1] = xy + wz;
  m[5] = 1 - (xx + zz);
  m[9] = yz - wx;

  m[2] = xz - wy;
  m[6] = yz + wx;
  m[10] = 1 - (xx + yy);

  m[3] = m[7] = m[11] = 0;
  m[12] = m[13] = m[14] = 0;
  m[15] = 1;

  return m;
}

function cssMatrixFromElements(e) {
  return 'matrix3d(' + e.join(',') + ')';
}

function cssMatrixFromOrientation(q, inverse) {
  return cssMatrixFromElements(matrixFromOrientation(q, inverse));
}


// the camera's position, as a css transform string.  For right now,
// we want it just in the middle.
// XXX BUG this rotateZ should not be needed; the view rendering is flipped.
// XXX BUG the rotateY should not be needed; the default viewport
// is not oriented how I expected it to be oriented
var cssCameraPositionTransform = "translate3d(0, 0, 0) rotateZ(180deg) rotateY(180deg)";

function frameCallback() {
  requestAnimationFrame(frameCallback);

  var state = vrSensor.getState();
  var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);

  cssCamera.style.transform = cssOrientationMatrix + " " + cssCameraPositionTransform;
}

function vrDeviceCallback(vrdevs) {
  for (var i = 0; i < vrdevs.length; ++i) {
    if (vrdevs[i] instanceof HMDVRDevice) {
      vrHMD = vrdevs[i];
      break;
    }
  }

  if (!vrHMD)
    return;

  // Then, find that HMD's position sensor
  for (var i = 0; i < vrdevs.length; ++i) {
    if (vrdevs[i] instanceof PositionSensorVRDevice &&
        vrdevs[i].hardwareUnitId == vrHMD.hardwareUnitId)
    {
      vrSensor = vrdevs[i];
      break;
    }
  }

  if (!vrSensor) {
    alert("Found a HMD, but didn't find its orientation sensor?");
  }

  load();
}

function onkey(event) {
  switch (String.fromCharCode(event.charCode)) {
  case 'f':
    cssContainer.mozRequestFullScreen({ vrDisplay: vrHMD });
    break;
  case ' ':
  case 'p':
    togglePlay();
    break;
  case 'm':
    toggleMute();
    break;
  case 'z':
    vrSensor.zeroSensor();
    break;
  }
}

function _init() {
  cssCamera = document.getElementById("camera");
  cssContainer = document.getElementById("container");

  updateFns.push(frameCallback);

  if (navigator.getVRDevices)
    navigator.getVRDevices().then(vrDeviceCallback);
}

window.addEventListener("load", _init, false);
window.addEventListener("keypress", onkey, true);



function onYouTubeIframeAPIReady() {
  ytReady = true;

  var opts = {
    width: '640',
    height: '360',
    videoId: videos[0],
    events: {
      'onReady': onPlayerReady,
      'onPlaybackQualityChange': onPlayerPlaybackQualityChange,
      'onStateChange': onPlayerStateChange,
      'onError': onError
    },
    playerVars: {
      controls: 1,
      enablejsapi: 1,
      //end: 5,
      showinfo: 0
    }
  };

  var _player = new YT.Player('player', opts);
  players.push(_player);

  player = players[0];
}

function onPlayerReady(event) {
  event.target.playVideo();
}

function onPlayerPlaybackQualityChange(event) {

}

function onPlayerStateChange(event) {

}

function onError(event) {
  var errNo = event.data;

  var errors = {
    2: 'The request contains an invalid parameter value.',
    5: 'The requested content cannot be played in an HTML5 player.',
    100: 'The video requested was not found.',
    101: 'The owner of the requested video does not allow it to be played in embedded players.',
    150: 'The owner of the requested video does not allow it to be played in embedded players.' // same as 101
  };

  console.log(errors[errNo]);
}

function setVideo(videoId) {
  if (!ytReady)
    return;

  player.loadVideoById(videoId);
}

function togglePlay() {
  var state = player.getPlayerState();

  /* -states-
  YT.PlayerState.ENDED
  YT.PlayerState.PLAYING
  YT.PlayerState.PAUSED
  YT.PlayerState.BUFFERING
  YT.PlayerState.CUED
  */

  if (state == YT.PlayerState.PLAYING) {
    pauseVideo();
  } else {
    playVideo();
  }
}

function playVideo() {
  player.playVideo();
}

function pauseVideo() {
  player.pauseVideo();
}

function seekTo(seconds) {
  player.seekTo(seconds, true);
}

function stopVideo() {
  player.stopVideo();
}

function toggleMute() {
  if (player.isMuted())
    player.unMute();
  else
    player.mute();
}

function setVolume(volume) {
  volume = Math.max(Math.min(volume, 100), 0);

  player.setVolume(volume);
}

function getVolume() {
  return player.getVolume();
}

function getCurrentTime() {
  return player.getCurrentTime();
}

function getDuration() {
  return player.getDuration();
}

function YouTubeGetID(url){
  //var regex = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

  var ID = '';
  url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  if (url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_]/i);
    ID = ID[0];
  }
  else {
    ID = url;
  }
  return ID;
}



function load() {
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  console.log('loading');

  setInterval(function(){
    var t = getCurrentTime();
    var d = getDuration();
    console.log(t + ' : ' + d + ' : ' + (t/d*100).toFixed(1) + '%');
  }, 2000);

  init();
  animate();
}

function init() {
  w = window.innerWidth, h = window.innerHeight;

  camera = new THREE.PerspectiveCamera(75, 640 / 800, 1, 5000);

  //setupRendering();
  setupScene();
  setupControls();

  setupEvents();
}

function setupRendering() {
  renderer = new THREE.CSS3DRenderer();
  renderer.setSize( w, h );
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = 0;
  //document.getElementById('viewbox0').appendChild(renderer.domElement);
}

function setupControls() {
  //controls = new THREE.VRControls(camera);
}

function setupScene() {
  scene = new THREE.Scene();
}

function setupEvents() {
  $('#go').on('click', navigate);
  $('#url').keypress(function(e) {
    if (e.which == 13) {
      navigate();
    }
  }); 

  window.addEventListener('resize', resize, false);
}


function navigate() {
  var url = $('#url').val();

  var videoid = YouTubeGetID(url);

  console.log(videoid);

  if (videoid == null)
    return;

  setVideo(videoid);
  return;

  var serviceUrl = 'http://www.youtube.com/oembed?url='+encodeURI(url)+'&format=json';

  console.log(serviceUrl);

  $.ajax({
    url: 'http://query.yahooapis.com/v1/public/yql',
    data: {
      q: "select * from json where url ='"+serviceUrl+"'",
      format: "json"
    },
    dataType: "jsonp",
    success: function(data) {
      console.log(data);
    },
    error: function(result) {
      console.log("No data found.");
    }
  });

}

function resize() {
  w = window.innerWidth, h = window.innerHeight;

  //renderer.setSize(w, h);
}


function animate(t) {
  requestAnimationFrame(animate);
  var dt = clock.getDelta();

  update(t);
  //render(t);

  time = Date.now();
}

function update(t) {
  TWEEN.update(t);

  for (var i = 0; i < updateFns.length; i++) {
    var fn = updateFns[i];
    fn(t);
  }

  //controls.update();
}

function render(t) {
  renderer.render(scene, camera);
}
