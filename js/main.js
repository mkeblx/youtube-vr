'use strict';

var fbRef, room;
var social = true;

var clock = new THREE.Clock();
var time = Date.now();

var vrHMD, vrSensor;

var cssContainer;
var cssCamera;

var screenDist = 650;

var container;

var renderer;
var scene;
var head;
var camera;
var controls;

var w, h;

var updateFns = [];

var screens = [];
var _screen;
var screenIndex = 0;

var player; // current

var _videoIds = [];

var ytReady = false;


window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

// the camera's position, as a css transform string.  For right now,
// we want it just in the middle.
// XXX BUG this rotateZ should not be needed; the view rendering is flipped.
// XXX BUG the rotateY should not be needed; the default viewport
// is not oriented how I expected it to be oriented
var cssCameraPositionTransform = "translate3d(0, 0, 0) rotateZ(180deg) rotateY(180deg)";

var state;

function frameCallback() {
  state = vrSensor.getState();
  var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);

  var pos = state.position;
  var s = config.posScale;
  var x = pos.x*s*-1, y = pos.y*s*-1, z = pos.z*s*-1;
  cssCameraPositionTransform = "translate3d("+x+"px, "+y+"px, "+z+"px) rotateZ(180deg) rotateY(180deg)";

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

function _init() {
  cssCamera = document.getElementById('camera');
  cssContainer = document.getElementById('container');

  updateFns.push(frameCallback);

  if (navigator.getVRDevices) {
    navigator.getVRDevices().then(vrDeviceCallback);
  } else {
    $('#webvr-msg').show();
  }


}

var vidSources = [];
var webcamTexture; 

function gotSources(sourceInfos) {
  for (var i = 0; i != sourceInfos.length; ++i) {
    var sourceInfo = sourceInfos[i];
    if (sourceInfo.kind === 'video') {
      vidSources.push({
          label: sourceInfo.label || 'camera ' + (vidSources.length + 1),
          id: sourceInfo.id
        });
    } else {
      //console.log('Some other kind of source: ', sourceInfo);
    }
  }

  console.log(vidSources.length + ' video sources found');
}

if (typeof MediaStreamTrack === 'undefined'){
  console.log('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
} else {
  if (config.webcam.enabled && MediaStreamTrack.getSources)
    MediaStreamTrack.getSources(gotSources);
}

$(document).ready(_init);


function onYouTubeIframeAPIReady() {
  ytReady = true;

  setupScreens(config);

  setInterval(updateVideos, 1000/3);

  //setInterval(selectScreen, 1000/3);
}

function updateVideos() {
  for (var i = 0; i < screens.length; i++) {
    screens[i].update();
  }
}

var prevTheta = 0;
function selectScreen() {
  if (!vrSensor)
    return;

  var theta = vrSensor.getState().orientation.y.toFixed(4);// * 180 / Math.PI;
  $('#angle').html('angle: ' + theta);
  console.log(theta);

  //TODO: use positional data to make accurate

  var a = 0.25;
  if (theta < a || theta > -a) { // main_pane
    setActiveScreen(0);
  } else if (theta > a && screens.length > 1) { // second_pane
    setActiveScreen(1);
  } else if (theta < -a && screens.length > 2) { // third_pane
    setActiveScreen(2);
  }

  prevTheta = theta;
}

function onPlayerReady(event) {
  //_player.cueVideoById(videos[0]);
  //event.target.playVideo();
}

function onPlayerPlaybackQualityChange(event) {

}

function onPlayerStateChange(event) {
  updateVideos();
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

  $('#error-msg').html(errors[errNo]);

  console.log(errors[errNo]);
}

function setVideo(videoId) {
  $('#error-msg').html('');

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

  updateState(state);
}

function playVideo() {
  player.playVideo();
}

function pauseVideo() {
  player.pauseVideo();
}

function stopVideo() {
  player.stopVideo();
}

function seekTo(seconds, update) {
  seconds = Number(seconds);
  player.seekTo(seconds, true);

  console.log(seconds);

  if (room && update != undefined && update) {
    room.child('video').update({
      time: seconds
    });
  }
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
  console.log(screenDist);
  screens[0].getObject().css('transform', 'rotateY(0deg) translate3d(0, 0, '+screenDist+'px) translate(-320px, -180px)');
}

function updateState(state) {
  var _state = state != undefined ? state : player.getPlayerState();

  if (room) {
    room.child('video').update({
      state: _state
    });
  }
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

function setActiveScreen(index) {
  if (index == undefined) {
    screenIndex++;
    screenIndex = (screenIndex < screens.length) ? screenIndex : 0;
  } else {
    screenIndex = Math.max(index, screens.length-1);
  }

  _screen = screens[screenIndex];
  player = _screen.getPlayer();
}

function load() {
  var hash = window.location.hash.substr(1);
  if (hash != '') {
    var _videoIds = _.first(hash.split(','), config.screens.length);

    for (var i = 0; i < config.screens.length; i++) {
      config.screens[i].videoId = (i < _videoIds.length) ? _videoIds[i] : null;
    }
  }

  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var roomId = hash;

  if (roomId != '') {
    social = true;
    setupFb(roomId);
  }

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

  if (config.webcam.enabled)
    setupWebcam();
}

function setupScreens(config) {
  for (var i = 0; i < config.screens.length; i++) {
    var conf = config.screens[i];

    if (conf.videoId == null) {
      continue;
    }

    var vscreen = new VidScreen(conf);
    screens.push(vscreen);
  }

  _screen = screens[0];
  player = _screen.getPlayer();
}

function setupFb(roomId) {
  fbRef = new Firebase(config.fbUrl);

  var rooms = fbRef.child('rooms');
  room = rooms.child(roomId);


  room.once('value', function(snapshot) {
    var exists = snapshot.val() !== null;

    if (!exists) {
      room.set({
        video: {
          videoId: roomId,
          state: 0,
          time: '0' // abs: (n)secs || rel: x.x%
        }
      });
    }
  });

  room.on('value', function(snapshot) {
    var val = snapshot.val();

    if (Math.abs(player.getCurrentTime() - val.video.time) > 2){
      seekTo(val.video.time, false);
    }

    var state = player.getPlayerState();
    var newState = val.video.state;

    if (state != newState && 0) {
      if (newState == YT.PlayerState.PLAYING) {
        playVideo();
      } else if (newState == YT.PlayerState.PAUSED || newState == YT.PlayerState.ENDED) {
        pauseVideo();
      }
    }

    console.log(val);
  });
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

function setupWebcam() {
  webcamTexture = new THREEx.WebcamTexture();
  webcamTexture.setSource(0);
}

function setupEvents() {
  $(document).on('keydown', onkey);

  $('#go').on('click', navigate);
  $('#url').focus(function() { $(this).select(); } );
  $('#url').keypress(function(e) {
    if (e.which == 13) {
      navigate();
    }
  }); 
  
  window.addEventListener('resize', resize, false);
}

function onkey(event) {
  //console.log(event.which);
  switch (event.which) {
    case 70: // f
      console.log('fullscreen');
      cssContainer.mozRequestFullScreen({ vrDisplay: vrHMD });
      break;
    case 9: // tab
      setActiveScreen();
      event.preventDefault();
      break;
    case 32: // space
    case 107: // k
      togglePlay();
      event.preventDefault();
      break;
    case 77: // m
      toggleMute();
      break;
    case 48: // numbers
    case 49:
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
      event.preventDefault();
      break;
    case 38: // up
      moveScreen(1);
      event.preventDefault();
      break;
    case 39: // right
      seekBy(5);
      event.preventDefault();
      break;
    case 40: // down
      moveScreen(-1);
      event.preventDefault();
      break;
    case 72: // h
      toggleHelp();
    case 90: // z
      vrSensor.zeroSensor();
      break;
  }
}

function toggleHelp() {

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
