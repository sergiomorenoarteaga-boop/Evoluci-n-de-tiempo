// world.js - Creación del mundo 3D (planeta plano, recursos, etc.)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export let scene, camera, renderer, labelRenderer, controls;
export let groundSize = 30;
export let trees = [], rocks = [], bushes = [];
export let deadResources = [];
export let wood = 0, stone = 0, food = 20;
export let hutCount = 0, fireCount = 0;
export const constructionsGroup = new THREE.Group();
export const resourcesGroup = new THREE.Group();
export let woodSpan, stoneSpan, foodSpan, hutsSpan, firesSpan;

export function initWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 40, 75);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(20, 16, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.zoomSpeed = 1.2;
    controls.rotateSpeed = 0.8;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 2, 0);

    // Luces
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);
    const fill = new THREE.PointLight(0x5577aa, 0.3);
    fill.position.set(-10, 10, -10);
    scene.add(fill);

    // Césped
    function createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4a8f3f';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const green = 80 + Math.random() * 80;
            const red = 40 + Math.random() * 30;
            const blue = 30 + Math.random() * 40;
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            const w = 0.5 + Math.random() * 1.5;
            const h = 1 + Math.random() * 3;
            ctx.fillRect(x, y, w, h);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        texture.anisotropy = 4;
        return texture;
    }

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(groundSize, groundSize),
        new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Recursos
    scene.add(constructionsGroup);
    scene.add(resourcesGroup);

    woodSpan = document.getElementById('wood');
    stoneSpan = document.getElementById('stone');
    foodSpan = document.getElementById('food');
    hutsSpan = document.getElementById('huts');
    firesSpan = document.getElementById('fires');

    generateResources();
    return { scene, camera, renderer, labelRenderer, controls };
}

export function randomPos() {
    const margin = 2;
    const range = groundSize / 2 - margin;
    return new THREE.Vector3(
        (Math.random() - 0.5) * range * 2,
        0,
        (Math.random() - 0.5) * range * 2
    );
}

function createTree(pos) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.6, 5), new THREE.MeshStandardMaterial({ color: 0x8B5A2B }));
    trunk.position.y = 0.3; trunk.castShadow = true; g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x5c9e3e });
    const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 8), leafMat);
    leaf1.position.y = 0.65; leaf1.castShadow = true; g.add(leaf1);
    const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 8), leafMat);
    leaf2.position.y = 1.0; leaf2.castShadow = true; g.add(leaf2);
    g.position.copy(pos);
    return g;
}

function createRock(pos) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 }));
    rock.position.copy(pos); rock.position.y = 0.1;
    rock.castShadow = true;
    return rock;
}

function createBush(pos) {
    const g = new THREE.Group();
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6), bushMat);
    bush.position.y = 0.1; bush.castShadow = true; g.add(bush);
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    for (let i=0; i<4; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), berryMat);
        berry.position.set((Math.random()-0.5)*0.25, 0.05 + Math.random()*0.15, (Math.random()-0.5)*0.25);
        g.add(berry);
    }
    g.position.copy(pos);
    return g;
}

export function createHut(pos) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), new THREE.MeshStandardMaterial({ color: 0xbc9a6c }));
    base.position.y = 0.15; base.castShadow = true; g.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
    roof.position.y = 0.5; roof.castShadow = true; g.add(roof);
    g.position.copy(pos);
    return g;
}

export function createFire(pos) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 16, 32), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    ring.rotation.x = Math.PI/2; ring.position.y = 0.05; ring.castShadow = true; g.add(ring);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff2200, emissiveIntensity: 0.6 }));
    fire.position.y = 0.15; g.add(fire);
    const glow = new THREE.PointLight(0xff5500, 0.4, 1.5);
    glow.position.y = 0.15; g.add(glow);
    g.position.copy(pos);
    return g;
}

function generateResources() {
    for (let i = 0; i < 45; i++) {
        const pos = randomPos(); const tree = createTree(pos); resourcesGroup.add(tree); trees.push(tree);
    }
    for (let i = 0; i < 30; i++) {
        const pos = randomPos(); const rock = createRock(pos); resourcesGroup.add(rock); rocks.push(rock);
    }
    for (let i = 0; i < 20; i++) {
        const pos = randomPos(); const bush = createBush(pos); resourcesGroup.add(bush); bushes.push(bush);
    }
}

export function respawnResource(type) {
    const pos = randomPos();
    if (type === 'tree') { const t = createTree(pos); resourcesGroup.add(t); trees.push(t); }
    else if (type === 'rock') { const r = createRock(pos); resourcesGroup.add(r); rocks.push(r); }
    else if (type === 'bush') { const b = createBush(pos); resourcesGroup.add(b); bushes.push(b); }
}

export function updateRespawnTimers(delta) {
    for (let i = deadResources.length - 1; i >= 0; i--) {
        deadResources[i].timer -= delta;
        if (deadResources[i].timer <= 0) {
            respawnResource(deadResources[i].type);
            deadResources.splice(i,1);
        }
    }
}

export function clampPos(pos) {
    const limit = groundSize / 2 - 0.5;
    pos.x = Math.max(-limit, Math.min(limit, pos.x));
    pos.z = Math.max(-limit, Math.min(limit, pos.z));
    return pos;
}