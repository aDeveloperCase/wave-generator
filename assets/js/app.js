// dat.GUI
var GuiGen = function() {
	this.width    = 6;
	this.height   = 4;
	this.rotSpeed = 0.6;
	this.mode = 0;
	this.hide   = false;
};
var GuiRead = function() {
	this.rotSpeed = 0.01;
	this.hide     = false;
};
var guiGen = new GuiGen();
var guiRead = new GuiRead();

var gui = new dat.GUI();

var f1 = gui.addFolder('Generator');
var controller1 = f1.add(guiGen, 'width', 1, 10);
var controller2 = f1.add(guiGen, 'height', 1, 10);
f1.add(guiGen, 'rotSpeed', -1.5, 1.5);
var controller3 = f1.add(guiGen, 'mode', { rectangular: 0, freestyle: 1 });
f1.add(guiGen, 'hide');
f1.open();

var f2 = gui.addFolder('Reader');
f2.add(guiRead, 'rotSpeed', -1.5, 1.5);
f2.add(guiRead, 'hide');
f2.open();

var container = document.getElementById("container");
var debug = document.getElementById("debug");
var renderer, scene, camera, controls;
var generator, reader, trail, trailGeo, Emitter, color;


var wd = guiGen.width; 
var hg = guiGen.height;
var PI = Math.PI;

var off45 = Math.cos(Math.PI/4);

var ang = 0, angl = 2*PI;
var wave,wave2;
var crest = hg-wd;
var crest2 = (hg*off45+wd*off45)-(wd+crest*off45);
var x, y, z, i;

init();
animate();

function init(){
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 800, 600 );
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, 800 / 600, 0.1, 10000);
    camera.position.set( -5, 5, 15 );
    camera.lookAt( scene.position );

    controls = new THREE.TrackballControls( camera, renderer.domElement );

    var geo1 = new THREE.CubeGeometry( wd, hg, 1, 0, 0, 2);
    var mat1 = new THREE.MeshBasicMaterial( { color: 0x2fa1d6, wireframe: true } );
    generator= new THREE.Mesh( geo1, mat1 );
    scene.add( generator);

    var len = 8;
    var geo2 = new THREE.CylinderGeometry(0.1, 0.01, len, 3, 0, false); 
    var mat2 = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
    reader = new THREE.Mesh( geo2, mat2 );
    scene.add( reader );
    reader.rotation.z = angl;
	
	trailGeo = new THREE.Geometry();
	for(i=0; i<1000; i++){
    	trailGeo.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

    	color = new THREE.Color( 0xffffff );
		color.setHSV( i/1000, 1.0 , 1.0);
		trailGeo.colors[i] = color;
    }

    Emitter = {
				__particles: trailGeo.vertices,
				__colors: trailGeo.colors,
				__velocity: 0.05,
				__k: 0,

				removeFirst: function() {
					if ( this.__particles.length > 0 ) {
						this.__particles.shift();
					}
				},

				addPos: function( v ) {
					this.__particles[this.__k] = v;

					this.__k++;
					if(this.__k >= this.__particles.length){
						this.__k = 0;
					}
				},

				update: function(){
					for(i=0; i<this.__particles.length; i++){
						this.__particles[i].z = this.__particles[i].z - this.__velocity;
					}

					trailGeo.verticesNeedUpdate = true;			
				}
			};

    var mat3 = new THREE.ParticleBasicMaterial( { size: 0.1, vertexColors: THREE.VertexColors } )
    trail = new THREE.ParticleSystem( trailGeo, mat3 );
    scene.add( trail );       

    animate();
}

function animate(){
	requestAnimationFrame( animate );
	render();
	controls.update();
	renderer.render( scene, camera );
	//renderer.clear();
	//composer.render( 0.01 );
}

function render(){
	ang  += (guiGen.rotSpeed/10);
	angl += (guiRead.rotSpeed/100);

	if(guiGen.mode==0){
		wd = guiGen.width; hg = guiGen.height;
		wave2 = crest2*Math.abs( Math.sin( 2*(ang-angl) ) );
		wave  = wd+crest*Math.abs( Math.sin( ang-angl ) )+wave2;

		generator.visible   = !guiGen.hide;
	}else if(guiGen.mode==1){
		wd = guiGen.width; hg = guiGen.height;
		wave2 = crest2* Math.sin( 2*(ang-angl) ) ;
		wave  = wd+crest* Math.sin( ang-angl ) +wave2;

		generator.visible = false;
	}

	reader.visible = !guiRead.hide;

	generator.rotation.z = ang;
	reader.position.x = generator.position.z - wave/2*Math.cos(angl); 
	reader.position.y = generator.position.y - wave/2*Math.sin(angl);
	reader.rotation.z = angl;

	x = reader.position.x-(4*Math.cos(reader.rotation.z-3/2*PI));
	y = reader.position.y-(4*Math.sin(reader.rotation.z-3/2*PI));

	Emitter.addPos(new THREE.Vector3(x, y, 0));
	Emitter.update();
}

//Width change
controller1.onChange(function(value) {
	scene.remove( generator);
	crest = hg-value;
	crest2 = (hg*off45+value*off45)-(value+crest*off45);
    var geo1 = new THREE.CubeGeometry( value, hg, 1, 0, 0, 2);
    var mat1 = new THREE.MeshBasicMaterial( { color: 0x00ff000, wireframe: true } );
    generator= new THREE.Mesh( geo1, mat1 );
    scene.add( generator);
});

//Height change
controller2.onChange(function(value) {
	scene.remove( generator);
	crest = value-wd;
	crest2 = (value*off45+wd*off45)-(wd+crest*off45);
    var geo1 = new THREE.CubeGeometry( wd, value, 1, 0, 0, 2);
    var mat1 = new THREE.MeshBasicMaterial( { color: 0x00ff000, wireframe: true } );
    generator= new THREE.Mesh( geo1, mat1 );
    scene.add( generator);

});        
controller3.onFinishChange(function(value) {
       if(value == 0){
               scene.remove( generator);
               var geo1 = new THREE.CubeGeometry( wd, hg, 1, 0, 0, 2);
               var mat1 = new THREE.MeshBasicMaterial( { color: 0x00ff000, wireframe: true } );
               generator= new THREE.Mesh( geo1, mat1 );
               scene.add( generator);
       }        
});
