/*
VidScreen object represents a screen for videos
*/
'use strict';

function VidScreen(options) {
	this.options = options || {};

	this.init(options);
}

VidScreen.prototype.init = function(options) {

  var videoId = options.videoId;

  var cEl = $('#'+options.playerId);
  this.$el = cEl;

  this.setPosition(options.position, options.orientation);
  
 	var bot = '<div class="bot"><div class="progress-bar"><span class="progress"><div class="marker"></div></span></div></div>';
 	cEl.append(bot);

  var pId = options.playerId+'_player';
  var pEl = $('<div>').attr('id', pId);
  cEl.prepend(pEl);

  var opts = {
    width: '640',
    height: '360',
    videoId: videoId,
    events: {
      'onReady': onPlayerReady,
      //'onPlaybackQualityChange': onPlayerPlaybackQualityChange,
      'onStateChange': onPlayerStateChange,
      'onError': onError
    },
    playerVars: {
      controls: config.players.controls,
      enablejsapi: 1,
      showinfo: 0,
      theme: 'dark'
    }
  };

  var _player = new YT.Player(pId, opts);
  this._player = _player;
};

VidScreen.prototype.getObject = function() {
	return this.$el;
};

VidScreen.prototype.getPlayer = function() {
	return this._player;
};

VidScreen.prototype.setPosition = function(pos, rot) {
	this.$el.css('transform', 'rotateY('+rot[1]+'deg) translate3d('+pos[0]+'px, '+pos[1]+'px, '+pos[2]+'px) translate(-320px, -180px)');	
};

VidScreen.prototype.setProgress = function(pc) {
	this.$el.find('.progress').css('width', (pc).toFixed(1)+'%');
};

VidScreen.prototype.update = function(t) {

};

VidScreen.prototype.destroy = function() {
	this._player = null;
};
