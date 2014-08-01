'use strict';

var clock = new THREE.Clock();
var time = Date.now();

var container;

var renderer, renderer2;
var scene, scene2;
var head, head2;
var camera, camera2;
var controls, controls2;

var w, h;

window.onload = load;

function load() {
	init();
	animate();
}

function init() {
	w = window.innerWidth, h = window.innerHeight;

	var IPD = 150;

	head = new THREE.Object3D();
	camera = new THREE.PerspectiveCamera(75, 640 / 800, 1, 5000);
	camera.position.x = -IPD;
	//head.add(camera);

	head2 = new THREE.Object3D();
	camera2 = new THREE.PerspectiveCamera(75, 640 / 800, 1, 5000);
	camera2.position.x = IPD;
	//head2.add(camera2);

	setupRendering();
	setupScene();
	setupControls();

  window.addEventListener('resize', resize, false);
}

function setupRendering() {
	renderer = new THREE.CSS3DRenderer();
	renderer.setSize( w/2, h );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = 0;
	document.getElementById('viewbox0').appendChild(renderer.domElement);


	renderer2 = new THREE.CSS3DRenderer();
	renderer2.setSize( w/2, h );
	renderer2.domElement.style.position = 'absolute';
	renderer2.domElement.style.top = 0;
	document.getElementById('viewbox1').appendChild(renderer2.domElement);
}

function setupControls() {
	controls = new THREE.VRControls(camera);
	controls2 = new THREE.VRControls(camera2);	
}

function setupScene() {
	scene = new THREE.Scene();
	scene2 = new THREE.Scene();


	var screens = [{
		url: 'http://threejs.org',//'http://dev.quasi.co/css3d-3d/threejs.html',
		position: [0, 0, -1000],
		rotation: [0, 0, 0],
		size: 1,
		aspect: 13/9
	}];

	var screen;

	for (var i = 0; i < screens.length; i++) {
		screen = screens[i];

		var win = document.createElement('div');

		var element = document.createElement('iframe');
		element.setAttribute('src', screen.url);
		//element.setAttribute('seamless', true);
		element.style.width = Math.round(900*screen.aspect)+'px';
		element.style.height = 900+'px';
		var color = new THREE.Color( Math.random() * 0xffffff ).getStyle();
		element.style.background = color;

		var navBar = document.createElement('input');
		navBar.setAttribute('type', 'text');
		navBar.className = 'nav-bar';
		navBar.value = screen.url;

		win.appendChild(navBar);
		win.appendChild(element);

		var object = new THREE.CSS3DObject(win);
		object.position.fromArray(screen.position);
		object.rotation.fromArray(screen.rotation);
		//object.scale.set(screen.scale, screen.scale, screen.scale);
		scene.add(object);


		var win2 = win.cloneNode(true);
		var element2 = win2.getElementsByTagName('iframe')[0];
		var navBar2 = win2.getElementsByTagName('input')[0];


		var object2 = new THREE.CSS3DObject(win2);
		object2.position.copy(object.position);
		object2.rotation.copy(object.rotation);
		object2.scale.copy(object.scale);
		scene2.add(object2);


		$(navBar).click(function(e){
			$(this).select();
			$(navBar2).val('');
		});

		$(navBar).keypress(function(e){
			if (e.which == 13) { // enter
				var url = navBar.value;

				if (!/^https?:\/\//i.test(url)) {
					url = 'http://' + url;
				}
				navBar.value = url;
				navBar2.value = url;

				element.setAttribute('src', url);
				element2.setAttribute('src', url);
			}
		});

		/*var geometry = new THREE.PlaneGeometry( 100, 100 );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.copy( object.position );
		mesh.rotation.copy( object.rotation );
		mesh.scale.copy( object.scale );
		scene.add( mesh );*/
	}


	var elSize = [200,150];
	var elements = [
		{
			position: [0, 0, -1000],
			rotation: [0, 0, 0],
			src: 'img/threejs/100000stars.jpg'
		}
	];

	for (var i = 0; i < elements.length; i++) {
		continue;

		var el = elements[i];

		var div = document.createElement('div');
		div.className = 'img';
		div.style.width = elSize[0]+'px';
		div.style.height = elSize[1]+'px';
		div.style.backgroundImage = 'url('+el.src+')';

		//var img = document.createElement('img');
		//img.setAttribute('src', el.src);

		//var color = new THREE.Color( Math.random() * 0xffffff ).getStyle();
		//element.style.background = color;

		//div.appendChild(img);

		var object = new THREE.CSS3DObject(div);
		object.position.fromArray(el.position);
		//object.rotation.fromArray(screen.rotation);
		//object.scale.set(screen.scale, screen.scale, screen.scale);
		scene.add(object);

		$(div).hover(function(e){
			console.log('hover');
			//div.className = 'img m';
			var $this = $(this);
			//$this.remove();
		});
		/*var win2 = win.cloneNode(true);
		var element2 = win2.getElementsByTagName('iframe')[0];

		var object2 = new THREE.CSS3DObject(win2);
		object2.position.copy(object.position);
		object2.rotation.copy(object.rotation);
		object2.scale.copy(object.scale);
		scene2.add(object2);*/
	}
}

function resize() {
	w = window.innerWidth, h = window.innerHeight;

	renderer.setSize(w/2, h);
	renderer2.setSize(w/2, h);
}


function animate(t) {
	requestAnimationFrame(animate);
	var dt = clock.getDelta();

	var top;
	var doc, doc2;

	update(t);
	render(t);

	time = Date.now();
}

function update(t) {
	TWEEN.update();

	controls.update();
	controls2.update();
}

function render(t) {
	renderer.render(scene, camera);
	renderer2.render(scene2, camera2);
}
