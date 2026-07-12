import * as THREE from 'three';
import { scene, groundSize, checkMountainCollision, clampPos } from './world.js';
import { constructionsGroup } from './buildings.js';

export const resourcesGroup = new THREE.Group();
scene.add(resourcesGroup);

export let wood = 0, stone = 0, food = 20;
export const woodSpan = document.getElementById('wood');
export const stoneSpan = document.getElementById('stone');
export const foodSpan = document.getElementById('food');

export let trees = [], rocks = [], bushes = [];
export let deadResources = [];

function isNearMountain(pos, minDist = 1.2) {
    for (let m of mountainData) {
        if (new THREE.Vector3(pos.x, 0, pos.z).distanceTo(m.pos) < minDist + m.radius) return true;
    }
    return false;
}

function randomPos() {
    const margin = 2.5;
    const range = groundSize / 2 - margin;
    let pos, tries = 0;
    do {
        pos = new THREE.Vector3((Math.random() - 0.5) * range * 2, 0, (Math.random() - 0.5) * range * 2);
        tries++;
    } while ((isNearMountain(pos, 1.5) || pos.length() < 1.5) && tries < 50);
    return pos;
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
    for (let i = 0; i < 4; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4), berryMat);
        berry.position.set((Math.random() - 0.5) * 0.25, 0.05 + Math.random() * 0.15, (Math.random() - 0.5) * 0.25);
        g.add(berry);
    }
    g.position.copy(pos);
    return g;
}

export function generateResources() {
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

function respawnResource(type) {
    let newRes;
    const pos = randomPos();
    if (type === 'tree') { newRes = createTree(pos); resourcesGroup.add(newRes); trees.push(newRes); }
    else if (type === 'rock') { newRes = createRock(pos); resourcesGroup.add(newRes); rocks.push(newRes); }
    else if (type === 'bush') { newRes = createBush(pos); resourcesGroup.add(newRes); bushes.push(newRes); }
}

export function updateRespawnTimers(delta) {
    for (let i = deadResources.length - 1; i >= 0; i--) {
        deadResources[i].timer -= delta;
        if (deadResources[i].timer <= 0) {
            respawnResource(deadResources[i].type);
            deadResources.splice(i, 1);
        }
    }
}

// Inicializar recursos
generateResources();