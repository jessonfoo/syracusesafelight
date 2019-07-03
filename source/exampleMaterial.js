import "../node_modules/three/src/Three.js";
import "./OrbitControls.js";
import "./TransformControls.js";
import "./ShaderMaterialExtend.js";
let wireframeMesh, renderer, scene, camera, controls;



// renderer
renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// scene
scene = new THREE.Scene();

// camera
camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 200, 200, 400 );
camera.lookAt(new THREE.Vector3(0,0,0));

// controls
controls = new THREE.OrbitControls( camera );


// ambient light
scene.add( new THREE.AmbientLight( 0x222222 ) );

// directional light
let light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 80, 80, 80 );
scene.add( light );

// axes
scene.add( new THREE.AxesHelper( 20 ) );



let Textureloader = new THREE.TextureLoader;

// geometry
let testgeometry = new THREE.PlaneBufferGeometry( 100, 100, 50, 50 );
let material = THREE.ShaderMaterial.extend(THREE.MeshStandardMaterial, {
  header: 'varying vec3 vColor; uniform vec3 color1; uniform vec3 color2;',
  vertex: {
    '#include <fog_vertex>': 'vColor = mix( color1, color2, color3 texture2D( displacementMap, uv ).x );'
  },
  fragment: {
    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );' : 'gl_FragColor.rgb = vColor;'
  },
  material: {
    wireframe: true
  },
  uniforms: {
    displacementMap: Textureloader.load('http://localhost:8081/dismap.jpg'),
    displacementScale: 33,
    color1: new THREE.Color('blue'),
    color2: new THREE.Color('yellow'),
  }

});
wireframeMesh = new THREE.Mesh( testgeometry, material );
this.threeRenderer.scene.add(wireframeMesh);
let animate = () => {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}
