var THREEx = THREEx || {}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

THREEx.WebcamTexture = function(options){

	var video	= document.getElementById('video');
	video.width	= 320;
	video.height = 240;
	video.autoplay = true;
	video.loop = true;

	//document.body.appendChild(video);

	this.video = video;

	this.update	= function(delta, now){
		if( video.readyState !== video.HAVE_ENOUGH_DATA )	return;
	}

	this.successCallback = function(stream) {
	  window.stream = stream;
 // Set the source of the video element with the stream from the camera
    if (video.mozSrcObject !== undefined) {
        video.mozSrcObject = stream;
    } else {
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    video.play();
  }

	this.errorCallback = function(error){
	  console.log("navigator.getUserMedia error: ", error);
	}

	this.setSource = function(id) {
		if (!!window.stream) {
			this.video.src = null;
			window.stream.stop();
		}

		var constraints = {
			video: true
		};

		navigator.getUserMedia(constraints, this.successCallback, this.errorCallback);
	}

	this.togglePlay = function(){
		if (video.paused) {
			video.play();
		} else {
			video.pause();
		}
	}

	this.destroy = function(){
		video.pause();
	}
}

