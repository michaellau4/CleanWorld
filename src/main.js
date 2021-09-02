import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import {third_person_camera} from './third_person_camera.js';
import {entity_manager} from './entity_manager.js';
import {player_entity} from './player_entity.js'
import {entity} from './entity.js';
import {gltf_component} from './gltf_component.js';
import {player_input} from './player_input.js';
import {spatial_hash_grid} from './spatial_hash_grid.js';
import {spatial_grid_controller} from './spatial_grid_controller.js';
import { pickup_controller } from './pickup_controller.js';

const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

class LoadWorld {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';
    document.getElementById('container').appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(20, 20, -35);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-10, 500, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    this._sun = light;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(700, 700, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x1a2e16,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    this._mixers = [];
    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid(
      [[-1000, -1000], [1000, 1000]], [100, 100]);
    console.log(this._entityManager);
    this._LoadSky();
    this._LoadTrees();
    this._LoadRocks();
    this._LoadClouds();
    this._LoadApples();
    // this._LoadTrashCans();
    this._LoadBushes();
    this._LoadPlayer();

    this._previousRAF = null;
    this._RAF();
  }

  _LoadPlayer() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params));
    player.AddComponent(new player_entity.BasicCharacterController(params));
    player.AddComponent(
        new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    player.AddComponent(new pickup_controller.PickupController({timing: 0.7}));
    this._entityManager.Add(player, 'player');
    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player')}));
    this._entityManager.Add(camera, 'player-camera');
  }

  _LoadTrashCans() {
    const pos1 = new THREE.Vector3(30, 0, 20);
    const e1 = new entity.Entity();
    e1.AddComponent(new gltf_component.StaticModelComponent({
      scene: this._scene,
      resourcePath: './resources/trashcans/',
      resourceName: 'Trashcan_Cylindric.fbx',
      scale: 0.1,
      emissive: new THREE.Color(0x000000),
      specular: new THREE.Color(0x000000),
      receiveShadow: true,
      castShadow: true
    }));
    e1.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    e1.SetPosition(pos1);      
    this._entityManager.Add(e1);
    e1.SetActive(false);

    const pos2 = new THREE.Vector3(15, 0, 20);
    const e2 = new entity.Entity();
    e2.AddComponent(new gltf_component.StaticModelComponent({
      scene: this._scene,
      resourcePath: './resources/trashcans/',
      resourceName: 'Trashcan_Green.fbx',
      scale: 0.055,
      emissive: new THREE.Color(0x000000),
      specular: new THREE.Color(0x000000),
      receiveShadow: true,
      castShadow: true
    }));
    e2.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    e2.SetPosition(pos2);  
    this._entityManager.Add(e2);
    e2.SetActive(false);

    const pos3 = new THREE.Vector3(0, 0, 20);
    const e3 = new entity.Entity();
    e3.AddComponent(new gltf_component.StaticModelComponent({
      scene: this._scene,
      resourcePath: './resources/trashcans/',
      resourceName: 'Trashcan_Large.fbx',
      scale: 0.065,
      emissive: new THREE.Color(0x000000),
      specular: new THREE.Color(0x000000),
      receiveShadow: true,
      castShadow: true
    }));
    e3.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    e3.SetPosition(pos3);      
    this._entityManager.Add(e3);
    e3.SetActive(false);
  }

  _LoadTrees() {

    for(let i = 0; i < 20; i++) {

      const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 250, 0, (Math.random() * 2.0 - 1.0) * 250
      );
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trees/',
        resourceName: 'CommonTree_5.fbx',
        scale: 0.25,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true
      }));
      e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);      
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }


  _LoadBushes() {
     for(let i = 0; i < 20; i++) {

      const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 300, 0, (Math.random() * 2.0 - 1.0) * 300
      );
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trees/',
        resourceName: 'BushBerries_1.fbx',
        scale: 0.1,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true
      }));
      e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);      
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }

  _LoadGrass() {
    for(let i = 0; i < 50; i++) {

      const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 250, 0, (Math.random() * 2.0 - 1.0) * 250
      );
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trees/',
        resourceName: 'Grass_2.fbx',
        scale: 0.05,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true
      }));
      e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);      
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }

  _LoadApples() {
    for(let i = 0; i < 20; i++) {
      const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 250, 0, (Math.random() * 2.0 - 1.0) * 250
      );
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trash/',
        resourceName: 'Apple.fbx',
        scale: 0.05,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true
      }));
      e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);      
      this._entityManager.Add(e);
    }
  }

  _LoadRocks() {
     for(let i = 0; i < 10; i++) {

      const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 250, 0, (Math.random() * 2.0 - 1.0) * 250
      );
      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trees/',
        resourceName: 'Rock_2.fbx',
        scale: 0.15,
        emissive: new THREE.Color(0x000000),
        specular: new THREE.Color(0x000000),
        receiveShadow: true,
        castShadow: true
      }));
      e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      e.SetPosition(pos);      
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _LoadSky() {
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    const uniforms = {
      "topColor": { value: new THREE.Color(0x0077ff) },
      "bottomColor": { value: new THREE.Color(0xffffff) },
      "offset": { value: 33 },
      "exponent": { value: 0.6 }
    };
    uniforms["topColor"].value.copy(hemiLight.color);

    this._scene.fog.color.copy(uniforms["bottomColor"].value);

    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this._scene.add(sky);
  }
  
  _LoadClouds() {
    for (let i = 0; i < 20; ++i) {
    const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 700,
        100,
        (Math.random() * 2.0 - 1.0) * 700);

      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/trees/',
        resourceName: 'Cloud2.fbx',
        position: pos,
        scale: 0.25,
        emissive: new THREE.Color(0x808080),
      }));
      e.SetPosition(pos);
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    this._UpdateSun();

    this._entityManager.Update(timeElapsedS);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();
      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF)
      this._previousRAF = t;
    });
  }

  _UpdateSun() {
    const player = this._entityManager.Get('player');
    const pos = player._position;

    this._sun.position.copy(pos);
    this._sun.position.add(new THREE.Vector3(-10, 500, -10));
    this._sun.target.position.copy(pos);
    this._sun.updateMatrixWorld();
    this._sun.target.updateMatrixWorld();
  }

  _LoadControllers() {
    const ui = new entity.Entity();
    ui.AddComponent(new ui_controller.UIController());
    this._entityManager.Add(ui, 'ui');
  }

}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new LoadWorld();
});