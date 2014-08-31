'use strict';

var clock = new THREE.Clock();
var time = Date.now();

var vrHMD, vrSensor;

var cssContainer;
var cssCamera;

var screenDist = 500;

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
var _videoId = null;

var ytReady = false;


// the camera's position, as a css transform string.  For right now,
// we want it just in the middle.
// XXX BUG this rotateZ should not be needed; the view rendering is flipped.
// XXX BUG the rotateY should not be needed; the default viewport
// is not oriented how I expected it to be oriented
var cssCameraPositionTransform = "translate3d(0, 0, 0) rotateZ(180deg) rotateY(180deg)";

function frameCallback() {
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

/*
TODO:
-arrows: up/down volume 5%, left/right seek
-1-9: n*10% seek
*/
function onkey(event) {
  console.log(event.which);
  switch (event.which) {
    case 70: // f
      console.log('fullscreen');
      cssContainer.mozRequestFullScreen({ vrDisplay: vrHMD });
      break;
    case 32: // space
    case 107: // k
      togglePlay();
      break;
    case 77: // m
      toggleMute();
      break;
    case 49: // numbers
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      seekToPc((event.which-49+1)*10);
      break;
    case 37: // left
      seekBy(-5);
      break;
    case 38: // up
      moveScreen(1);
      break;
    case 39: // right
      seekBy(5);
      break;
    case 40: // down
      moveScreen(-1);
      break;
    case 90: // z
      vrSensor.zeroSensor();
      break;
  }
}

function _init() {
  cssCamera = document.getElementById('camera');
  cssContainer = document.getElementById('container');

  updateFns.push(frameCallback);

  if (navigator.getVRDevices) {
    navigator.getVRDevices().then(vrDeviceCallback);
  } else {

  }
}

$(document).ready(_init);


function onYouTubeIframeAPIReady() {
  ytReady = true;

  var videoId = _videoId || videos[0];

  var opts = {
    width: '640',
    height: '360',
    videoId: videoId,
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
      showinfo: 0,
      theme: 'dark'
    }
  };

  var _player = new YT.Player('main_player', opts);

  players.push(_player);
  player = players[0];
}

function onPlayerReady(event) {
  //_player.cueVideoById(videos[0]);
  //event.target.playVideo();
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

function seekToPc(percent) {
  var dur = getDuration();
  var secs = percent/100 * dur;
  seekTo(secs);
}

function seekBy(percent) {
  var r = getPlayedRatio();
  var dur = getDuration();
  var pc = Math.max(Math.min(r*100 + percent, 100), 0);
  var secs = pc/100 * dur;
  seekTo(secs);
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

function getPlayedRatio() {
  var t = getCurrentTime();
  var d = getDuration();
  var r = (t/d).toFixed(3);
  return r;
}

function moveScreen(amount) {
  screenDist += amount*25;
  $('#main_pane').css('transform', 'rotateY(0deg) translate3d(0, 0, '+screenDist+'px) translate(-320px, -180px)');
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
  var hash = window.location.hash.substr(1);
  if (hash != '') {
    _videoId = hash;
  }

  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  console.log('loading');

  setInterval(function(){
    var t = getCurrentTime();
    var d = getDuration();
    var pc = (t/d*100).toFixed(1)+'%';
    //console.log(t + ' : ' + d + ' : ' + pc);

    $('#progress').css('width', (t/d*100).toFixed(1)+'%');
  }, 300);

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
  $(document).on('keydown', onkey);

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
