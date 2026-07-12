// game.js - Lógica principal del juego
import * as THREE from 'three';
import { scene, camera, renderer, labelRenderer, controls, groundSize, constructionsGroup, resourcesGroup, wood, stone, food, woodSpan, stoneSpan, foodSpan, hutsSpan, firesSpan, updateRespawnTimers, clampPos } from './world.js';
import { characters, jefe, addNewCharacter, refreshCharacterList, updatePopulationUI } from './characters.js';
import { createFire, randomPos, hutCount, fireCount } from './world.js';

// Teclas
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', e => {
    switch(e.code) {
        case 'KeyW': keys.w = true; e.preventDefault(); break;
        case 'KeyA': keys.a = true; e.preventDefault(); break;
        case 'KeyS': keys.s = true; e.preventDefault(); break;
        case 'KeyD': keys.d = true; e.preventDefault(); break;
    }
});
window.addEventListener('keyup', e => {
    switch(e.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
    }
});

// Movimiento del jefe
function moveJefe(delta) {
    const speed = 4.0;
    let move = new THREE.Vector3(0,0,0);
    if (keys.w) move.z -= 1;
    if (keys.s) move.z += 1;
    if (keys.a) move.x -= 1;
    if (keys.d) move.x += 1;
    if (move.length() === 0) return;
    move.normalize();
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    const forward = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), forward).normalize();
    let worldMove = new THREE.Vector3(0,0,0);
    worldMove.addScaledVector(forward, -move.z);
    worldMove.addScaledVector(right, move.x);
    worldMove.normalize();
    let newPos = jefe.position.clone().add(worldMove.multiplyScalar(speed * delta));
    clampPos(newPos);
    let collision = false;
    constructionsGroup.children.forEach(obj => { if (newPos.distanceTo(obj.position) < 0.55) collision = true; });
    resourcesGroup.children.forEach(obj => { if (newPos.distanceTo(obj.position) < 0.45) collision = true; });
    if (!collision) {
        jefe.position.copy(newPos);
        jefe.group.position.copy(jefe.position);
    }
}

// Sistema de hambre
let hungerTimer = 0;
function updateHunger(delta) {
    hungerTimer += delta;
    if (hungerTimer >= 8.0) {
        hungerTimer = 0;
        if (food > 0) {
            const eaten = Math.min(characters.length, food);
            food -= eaten;
            foodSpan.innerText = food;
        } else {
            const victims = characters.filter(c => !c.isJefe);
            if (victims.length > 0) {
                const victim = victims[Math.floor(Math.random() * victims.length)];
                victim.health -= 15;
                if (victim.health <= 0) {
                    scene.remove(victim.group);
                    characters = characters.filter(c => c !== victim);
                    showNotification(`💀 ${victim.name} ha muerto de hambre`, 'toast-danger');
                    refreshCharacterList();
                    updatePopulationUI();
                } else {
                    showNotification(`💔 ${victim.name} tiene hambre (${victim.health}% vida)`, 'toast-danger');
                }
            }
        }
    }
}

// Reproducción
let reproductionTimer = 0;
function updateReproduction(delta) {
    let cooldown = 25.0;
    if (fireCount > 0) cooldown = 12.0;
    reproductionTimer += delta;
    if (reproductionTimer >= cooldown && characters.length >= 2 && hutCount > 0 && food >= 10) {
        reproductionTimer = 0;
        food -= 5;
        foodSpan.innerText = food;
        const newName = `Tribu${nextId++}`;
        addNewCharacter(newName);
    }
}

// Configurar UI
export function setupUI() {
    // Botón de fogata
    document.getElementById('btn-build-fire').addEventListener('click', () => {
        if (wood >= 8 && stone >= 4) {
            wood -= 8; stone -= 4;
            woodSpan.innerText = wood; stoneSpan.innerText = stone;
            fireCount++;
            firesSpan.innerText = fireCount;
            const pos = randomPos();
            const fire = createFire(pos);
            constructionsGroup.add(fire);
            showNotification('🔥 ¡Fogata construida!', 'toast-success');
        } else {
            showNotification('❌ Necesitas 8 Madera y 4 Piedra', 'toast-danger');
        }
    });
}

// Configurar drag and drop
export function setupDragDrop(scene, camera, renderer) {
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.role);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    document.body.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        const role = e.dataTransfer.getData('text/plain');
        if (!role) return;
        const mouseX = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
        const mouseY = -(e.clientY / renderer.domElement.clientHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const meshes = characters.map(c => c.group);
        const hits = raycaster.intersectObjects(meshes, true);
        if (hits.length > 0) {
            let hitGroup = hits[0].object.parent;
            while (hitGroup && !characters.find(c => c.group === hitGroup)) hitGroup = hitGroup.parent;
            const target = characters.find(c => c.group === hitGroup);
            if (target) target.setRole(role);
        } else {
            showNotification('Suelta el rol sobre un personaje', 'toast-danger');
        }
    });
}

// Función de actualización principal
export function updateGame(delta) {
    moveJefe(delta);
    for (let c of characters) {
        if (c !== jefe) c.update(delta);
    }
    updateRespawnTimers(delta);
    updateHunger(delta);
    updateReproduction(delta);
}

// Función de notificación (reutilizada)
function showNotification(text, type = '') {
    const container = document.getElementById('notification-container');
    const msg = document.createElement('div');
    msg.className = `toast ${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}