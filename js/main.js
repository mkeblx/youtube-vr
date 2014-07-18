'use strict';

var clock = new THREE.Clock();
var time = Date.now();

var scene, camera, container, renderer, controls;
var scene2, camera2, renderer2, controls2;

init();
animate();

function init() {

	var w = window.innerWidth, h = window.innerHeight;

	var IPD = 150;

	camera = new THREE.PerspectiveCamera( 75, 640 / 800, 1, 5000 );
	camera.position.x = -IPD;
	camera.position.y = -35;
	camera.position.z = 0;

	//camera.rotation.z = 0.4;

	camera2 = new THREE.PerspectiveCamera( 75, 640 / 800, 1, 5000 );
	camera2.position.x = IPD;
	camera2.position.y = -35;
	camera2.position.z = 0;

	//camera2.rotation.z = 0.4;

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

	var site = 'http://threejs.org';

	for ( var i = 0; i < 1; i ++ ) {
		var element = document.createElement( 'div' );
		element = document.createElement('iframe');
		element.setAttribute('src', site);
		element.style.width = '1024px';
		element.style.height = '800px';
		//var color = new THREE.Color( Math.random() * 0xffffff ).getStyle();
		//element.style.background = color;

		var r0 = Math.random(), r1 = Math.random(), r2 = Math.random(), r3 = Math.random();
		var r4 = Math.random(), r5 = Math.random(), r6 = Math.random(), r7 = Math.random();

		var object = new THREE.CSS3DObject( element );
		object.position.set(0, -25, -1100);
		//object.rotation.set(0,0,0);
		//object.scale.set(1,1,1);
		scene.add( object );


		var element2 = element.cloneNode(true);

		var object2 = new THREE.CSS3DObject( element2 );
		object2.position.copy(object.position);
		object2.rotation.copy(object.rotation);
		//object2.scale.copy(object.copy);
		scene2.add( object2 );


		/*var geometry = new THREE.PlaneGeometry( 100, 100 );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.copy( object.position );
		mesh.rotation.copy( object.rotation );
		mesh.scale.copy( object.scale );
		scene.add( mesh );*/
	}

}

function animate() {
	requestAnimationFrame(animate);
	var dt = clock.getDelta();

	controls.update();
	controls2.update();

	//TWEEN.update();
	renderer.render(scene, camera);
	renderer2.render(scene2, camera2);

	time = Date.now();
}