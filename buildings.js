import * as THREE from 'three';
import { scene, groundSize, clampPos, checkMountainCollision } from './world.js';
import { showNotification } from './notifications.js';

export const constructionsGroup = new THREE.Group();
scene.add(constructionsGroup);

export let hutCount = 0;
export let fireCount = 0;
export const hutsSpan = document.getElementById('huts');
export const firesSpan = document.getElementById('fires');

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

export function buildFire(wood, stone, woodSpan, stoneSpan) {
    if (wood >= 8 && stone >= 4) {
        wood -= 8; stone -= 4;
        woodSpan.innerText = wood; stoneSpan.innerText = stone;
        fireCount++;
        firesSpan.innerText = fireCount;
        // Generar posición aleatoria
        const margin = 2.5;
        const range = groundSize / 2 - margin;
        let pos;
        let tries = 0;
        do {
            pos = new THREE.Vector3((Math.random() - 0.5) * range * 2, 0, (Math.random() - 0.5) * range * 2);
            tries++;
        } while ((checkMountainCollision(pos, 0.8) || pos.length() < 1.5) && tries < 30);
        const fire = createFire(pos);
        constructionsGroup.add(fire);
        showNotification('🔥 ¡Fogata construida! Reproducción más rápida.', 'toast-success');
    } else {
        showNotification('❌ Necesitas 8 Madera y 4 Piedra', 'toast-danger');
    }
    return { wood, stone };
}