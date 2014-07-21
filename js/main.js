'use strict';

var clock = new THREE.Clock();
var time = Date.now();

var scene, camera, container, renderer, controls;
var scene2, camera2, renderer2, controls2;

init();
animate();

var crossDomain = 0;

function init() {

	var w = window.innerWidth, h = window.innerHeight;

	var IPD = 150;

	camera = new THREE.PerspectiveCamera( 75, 640 / 800, 1, 5000 );
	camera.position.x = -IPD;

	camera2 = new THREE.PerspectiveCamera( 75, 640 / 800, 1, 5000 );
	camera2.position.x = IPD;

	scene = new THREE.Scene();
	scene2 = new THREE.Scene();

	controls = new THREE.VRControls(camera);
	controls2 = new THREE.VRControls(camera2);

	renderer = new THREE.CSS3DRenderer();
	renderer.setSize( w/2, h );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = 0;
	document.getElementById('viewbox0').appendChild( renderer.domElement );


	renderer2 = new THREE.CSS3DRenderer();
	renderer2.setSize( w/2, h );
	renderer2.domElement.style.position = 'absolute';
	renderer2.domElement.style.top = 0;
	document.getElementById('viewbox1').appendChild( renderer2.domElement );

	crossDomain = false;
	var screens = [{
		url: 'http://threejs.org',//'http://dev.quasi.co/css3d-3d/embed.html',
		position: [0, 0, -1100],
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


		var object2 = new THREE.CSS3DObject(win2);
		object2.position.copy(object.position);
		object2.rotation.copy(object.rotation);
		object2.scale.copy(object.scale);
		scene2.add(object2);


		$(navBar).keypress(function(e){
			if (e.which == 13) { // enter
				var url = navBar.value;

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


}

var once = true;

function animate() {
	requestAnimationFrame(animate);
	var dt = clock.getDelta();


	var top;
	var doc, doc2;


	if (!crossDomain && false) {
		//doc = element.contentDocument || element.contentWindow.document || null;
		//doc2 = element2.contentDocument || element2.contentWindow.document || null;

		if (doc) {
			top = doc.body.parentElement.scrollTop;
			if (once) {
				window.doc = doc;
				console.log(doc);
				once = false;
			}
//			console.log(element.contentWindow.document.body);
			if (top != 0) { 
				console.log(top);
			}
			element2.contentWindow.scrollTo(0, top);
		}
	}

	controls.update();
	controls2.update();

	//TWEEN.update();
	renderer.render(scene, camera);
	renderer2.render(scene2, camera2);

	time = Date.now();
}
