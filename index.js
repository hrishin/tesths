import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js';

var textures = ['1.jpg', '2.jpg', '3.jpg','4.jpg', '5.jpg', '6.jpg','7.jpg', '8.jpg', '9.jpg','10.jpg', '11.jpg',
              '12.jpg', '13.jpg','14.jpg', '15.jpg', '16.jpg','17.jpg', '18.jpg', '19.jpg','20.jpg', '21.jpg'];
// var textures = ['1.jpg', '2.jpg', '3.jpg','4.jpg'];
var texture;
var x = -0.140, y=0.610, z=2.16499, aa=0, ss=1.3049, dd=0, toggle=false, t, allTextures, song;
const SPEED = 0.0015;
//seconds
const FIRST_ROTATION = 30;
const NEXT_ROTATIONS = 19;
const rotor = Array.from(Array(4).keys());
var currentRotor = 0

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('load', function() {
  console.log("document onload");
  $(document).on('click', function () { 
    $(".info").hide();
    $("h1.loading").show();
    main();
  });
});

function main() {
  var world;
  const canvas = document.querySelector(".webgl");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff );

  const camera = new THREE.PerspectiveCamera(75, sizes.width/sizes.height, 0.1, 1000);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  })
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // axes
  // scene.add( new THREE.AxisHelper( 20 ) );
  const loader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();

  // create an AudioListener and add it to the camera
  const listener = new THREE.AudioListener();
  const sound = new THREE.Audio( listener );
  const audioLoader = new THREE.AudioLoader();

  const video = document.getElementById( 'video' );
  video.play();

  Promise.all([
    loader.loadAsync('me_1.glb'),
    loader.loadAsync('you.glb'),
    audioLoader.loadAsync( 'song.mp3'),
  ]).then((results) => {
    // here the models are returned in deterministic order
    const [beatrice, hrishi, music] = results;
    const b = beatrice.scene;
    const h = hrishi.scene;
    b.position.x=0.350
    h.position.x=-0.350
    b.position.z=0.3
    h.position.z=0.3
    b.rotation.y=Math.PI
    h.rotation.y=Math.PI
    scene.add(b);
    scene.add(h);
    song = music
    loadTextures()
  }).catch((err) => {
    console.log(err);
  });

  function loadTextures() {
    const texLoaders = textures.map(function(url) { return texLoader.load(url)})
    Promise.all(texLoaders)
    .then((results) => {
      texture = new THREE.MeshLambertMaterial({map: new THREE.VideoTexture( video ), side: THREE.DoubleSide});
      allTextures = results.map(function(t){ return new THREE.MeshStandardMaterial({map: t, side: THREE.DoubleSide})})
      console.log('loaded all textures', allTextures);
      $(".webgl").show();
      $("h1.loading").hide();
      startAudio();
      startScene();
      animate();
      setupTextureRefresh();
    })
    .catch((err) => {
      console.log(err);
    });
  }

  function startAudio() {
    camera.add( listener );
    sound.setBuffer( song );
    sound.setLoop( true );
    sound.setVolume( 1 );
    sound.play();
    
  }

  function startScene() {
    const light1 = new THREE.DirectionalLight( 0xffffff, 0.8 );
    light1.position.set(0, 0, -5);
    const light2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    light2.position.set(2, 0, 5);
    scene.add(light1);
    scene.add(light2);

    // ambient
    scene.add(new THREE.AmbientLight( 0x222222 ));
      
    // light
    var light = new THREE.PointLight( 0xffffff, 1);
    camera.add(light);

    // material
    const materials = [
      allTextures[3],
      allTextures[1],
      texture,
      new THREE.MeshPhongMaterial({color: 'rgb(245,245,245)', side:THREE.DoubleSide}),
      allTextures[2],
      allTextures[0]
    ];

    var box = new THREE.BoxGeometry( 5, 5, 5 );
    world = new THREE.Mesh(box, materials);
    world.position.set(0, 2.5, 0);
    world.renderOrder = 1; // force to render gray cube first
    scene.add( world );

  }

  function updateCube() {
    world.rotation.y -= SPEED * 1;
    
    const materials = [
      allTextures[rotor[3]],
      allTextures[rotor[1]],
      texture,
      new THREE.MeshPhongMaterial({color: 'rgb(245,245,245)', side:THREE.DoubleSide}),
      allTextures[rotor[2]],
      allTextures[rotor[0]]
    ];
    
    world.material = materials;
    world.material.needsUpdate = true;
  }

  function cameraUpdate() {
    camera.position.set(x, y, z)
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(new THREE.Vector3(aa,ss,dd));
  } 

  function animate() {
    requestAnimationFrame(animate);
    updateCube();
    cameraUpdate();

    //console.log("x y z", x, y, z);
    //console.log("aa ss dd", aa, ss, dd);
    
    renderer.render(scene, camera);
  }

  function swapTextureFirst() {
    updateNthTexture()
    window.setInterval(updateNthTexture, NEXT_ROTATIONS*1000);
  }

  function setupTextureRefresh() {
    window.setTimeout(swapTextureFirst, FIRST_ROTATION*1000);
  }

  function updateNthTexture() {
    const textureIndex = rotor[currentRotor];
    const nextTextureIndex = textureIndex + rotor.length;

    if (nextTextureIndex > allTextures.length -1) {
      rotor[currentRotor] = nextTextureIndex % rotor.length;
    } else {
      rotor[currentRotor] = nextTextureIndex;
    }
    console.log(rotor, currentRotor);
    const nextRotor = currentRotor + 1;
    if (nextRotor > rotor.length-1) {
      currentRotor = 0;
    } else {
      currentRotor = nextRotor;    
    }

    
  }

  function keyDown(event)
  {
      // code
      switch(event.keyCode)
      {   
          case 84: 
              toggle = !toggle 
              break;

          case 88://x
              t = toggle ? 0.005 : -0.005;
              x = x + t;
              break;

          case 89://y
              t = toggle ? 0.005 : -0.005;
              y = y + t;
              break;

          case 90://z
              t = toggle ? 0.005 : -0.005;
              z = z + t;
              break;

          case 65://aa
              t = toggle ? 0.005 : -0.005;
              aa = aa + t;
              break;

          case 83://ss
              t = toggle ? 0.005 : -0.005;
              ss = ss + t;
              break;

          case 68://dd
              t = toggle ? 0.005 : -0.005;
              dd = dd + t;
              break;
      }
  }
  window.addEventListener("keydown", keyDown, false);
}