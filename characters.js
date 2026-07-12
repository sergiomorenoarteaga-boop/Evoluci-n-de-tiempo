// characters.js - Gestión de personajes
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene, randomPos, clampPos, resourcesGroup, constructionsGroup, trees, rocks, bushes, deadResources, wood, stone, food, woodSpan, stoneSpan, foodSpan, hutsSpan, firesSpan, createHut, createFire, updateRespawnTimers } from './world.js';

export let characters = [];
export let jefe = null;
let nextId = 4;

export class Character {
    constructor(name, color, startPos, labelText, isJefe = false) {
        this.name = name;
        this.isJefe = isJefe;
        this.health = 100;
        this.group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        this.body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.37, 0.65, 6), bodyMat);
        this.body.position.y = 0.32; this.body.castShadow = true; this.group.add(this.body);
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), new THREE.MeshStandardMaterial({ color: 0xdba56a }));
        this.head.position.y = 0.68; this.head.castShadow = true; this.group.add(this.head);
        const div = document.createElement('div');
        div.textContent = labelText;
        div.style.cssText = 'color:white; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:20px; font-size:12px; white-space:nowrap;';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 1.0, 0);
        this.group.add(this.label);
        this.tool = null;
        this.position = startPos.clone();
        this.position.y = 0;
        this.group.position.copy(this.position);
        scene.add(this.group);
        this.role = null;
        this.target = null;
        this.wanderTarget = null;
        this.workTimer = 0;
    }

    setRole(role) {
        this.role = role;
        this.target = null;
        this.wanderTarget = null;
        if (this.tool) this.group.remove(this.tool);
        const toolColor = role === 'lumberjack' ? 0x8B5A2B : role === 'miner' ? 0x888888 : role === 'builder' ? 0xcc9966 : role === 'gatherer' ? 0xff6666 : 0xaa8866;
        if (role) {
            const toolMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), new THREE.MeshStandardMaterial({ color: toolColor }));
            toolMesh.position.set(0.3, 0.2, 0.2);
            this.tool = toolMesh;
            this.group.add(this.tool);
        }
        const colors = { lumberjack: 0x4caf50, miner: 0x9e9e9e, builder: 0xff9800, gatherer: 0xe91e63 };
        if (role && colors[role]) this.body.material.color.setHex(colors[role]);
        else this.body.material.color.setHex(0xc49a6c);
        refreshCharacterList();
        showNotification(`${this.name} ahora es ${this.getRoleName()}`, 'toast-success');
    }

    getRoleName() {
        const names = { lumberjack: '🌲 Leñador', miner: '⛏️ Minero', builder: '🏠 Constructor', gatherer: '🍓 Recolector' };
        return this.role ? names[this.role] : 'Sin rol';
    }

    findTarget() {
        let list = [];
        if (this.role === 'lumberjack') list = trees;
        else if (this.role === 'miner') list = rocks;
        else if (this.role === 'gatherer') list = bushes;
        else return null;
        let closest = null, minDist = Infinity;
        for (let item of list) {
            const d = this.position.distanceTo(item.position);
            if (d < minDist) { minDist = d; closest = item; }
        }
        return closest;
    }

    getWanderTarget() {
        const margin = 2;
        const range = 30 / 2 - margin; // groundSize
        return new THREE.Vector3(
            (Math.random() - 0.5) * range * 2,
            0,
            (Math.random() - 0.5) * range * 2
        );
    }

    update(delta) {
        if (!this.role) {
            if (!this.wanderTarget || this.position.distanceTo(this.wanderTarget) < 0.3) {
                this.wanderTarget = this.getWanderTarget();
            }
            const dir = this.wanderTarget.clone().sub(this.position);
            if (dir.length() > 0.1) {
                dir.normalize();
                const newPos = this.position.clone().add(dir.multiplyScalar(1.5 * delta));
                clampPos(newPos);
                this.position.copy(newPos);
                this.group.position.copy(this.position);
            }
            return;
        }

        const speed = 2.5;
        if (this.role === 'builder') {
            // Construir cabaña si hay recursos
            if (wood >= 8 && stone >= 4) {
                wood -= 8; stone -= 4;
                woodSpan.innerText = wood; stoneSpan.innerText = stone;
                hutCount++;
                hutsSpan.innerText = hutCount;
                const buildPos = this.position.clone().add(new THREE.Vector3((Math.random()-0.5)*0.9, 0, (Math.random()-0.5)*0.9));
                clampPos(buildPos);
                const hut = createHut(buildPos);
                constructionsGroup.add(hut);
                showNotification('🏠 ¡Cabaña construida!', 'toast-success');
            }
            // Deambular
            if (!this.wanderTarget || this.position.distanceTo(this.wanderTarget) < 0.3) {
                this.wanderTarget = this.getWanderTarget();
            }
            const dir = this.wanderTarget.clone().sub(this.position);
            if (dir.length() > 0.1) {
                dir.normalize();
                const newPos = this.position.clone().add(dir.multiplyScalar(1.5 * delta));
                clampPos(newPos);
                this.position.copy(newPos);
                this.group.position.copy(this.position);
            }
            return;
        }

        // Trabajadores (lumberjack, miner, gatherer)
        if (!this.target || this.target.parent === null) {
            this.target = this.findTarget();
        }
        if (this.target) {
            const dir = this.target.position.clone().sub(this.position);
            if (dir.length() > 0.1) {
                dir.normalize();
                const newPos = this.position.clone().add(dir.multiplyScalar(speed * delta));
                clampPos(newPos);
                this.position.copy(newPos);
                this.group.position.copy(this.position);
            }
            if (this.position.distanceTo(this.target.position) < 0.6) {
                this.workTimer += delta;
                if (this.workTimer > 0.8) {
                    this.performWork();
                    this.workTimer = 0;
                    this.target = null;
                }
            } else {
                this.workTimer = 0;
            }
        } else {
            // Deambular si no hay recursos
            if (!this.wanderTarget || this.position.distanceTo(this.wanderTarget) < 0.3) {
                this.wanderTarget = this.getWanderTarget();
            }
            const dir = this.wanderTarget.clone().sub(this.position);
            if (dir.length() > 0.1) {
                dir.normalize();
                const newPos = this.position.clone().add(dir.multiplyScalar(1.2 * delta));
                clampPos(newPos);
                this.position.copy(newPos);
                this.group.position.copy(this.position);
            }
        }
    }

    performWork() {
        if (this.role === 'lumberjack' && this.target && this.target.parent) {
            const idx = trees.indexOf(this.target);
            if (idx !== -1) { trees.splice(idx,1); resourcesGroup.remove(this.target); wood += 3; woodSpan.innerText = wood; deadResources.push({ type: 'tree', timer: 15.0 }); }
        } else if (this.role === 'miner' && this.target && this.target.parent) {
            const idx = rocks.indexOf(this.target);
            if (idx !== -1) { rocks.splice(idx,1); resourcesGroup.remove(this.target); stone += 3; stoneSpan.innerText = stone; deadResources.push({ type: 'rock', timer: 15.0 }); }
        } else if (this.role === 'gatherer' && this.target && this.target.parent) {
            const idx = bushes.indexOf(this.target);
            if (idx !== -1) { bushes.splice(idx,1); resourcesGroup.remove(this.target); food += 4; foodSpan.innerText = food; deadResources.push({ type: 'bush', timer: 20.0 }); }
        }
    }
}

export function initCharacters() {
    jefe = new Character('Jefe', 0xc49a6c, new THREE.Vector3(0, 0, 0), '👑 Jefe', true);
    characters.push(jefe);
    characters.push(new Character('Kala', 0xccaa88, randomPos(), '👩 Kala'));
    characters.push(new Character('Boro', 0xaa8866, randomPos(), '👨 Boro'));
    return jefe;
}

export function addNewCharacter(name) {
    if (characters.length >= 30) { showNotification('¡Población máxima! (30)', 'toast-danger'); return; }
    const newChar = new Character(name, 0xaa9977, randomPos(), `🧑 ${name}`);
    characters.push(newChar);
    updatePopulationUI();
    refreshCharacterList();
    showNotification(`👶 ¡Ha nacido ${name}!`, 'toast-success');
}

export function updatePopulationUI() {
    document.getElementById('pop-count').innerText = characters.length;
}

export function refreshCharacterList() {
    const container = document.getElementById('character-list');
    container.innerHTML = '';
    for (let ch of characters) {
        const div = document.createElement('div');
        div.style.margin = '3px 0';
        const healthBar = ch.isJefe ? '👑' : `❤️${Math.floor(ch.health)}%`;
        div.innerHTML = `${ch.name}: ${ch.getRoleName()} ${healthBar}`;
        container.appendChild(div);
    }
}

// Función para notificaciones (temporal)
function showNotification(text, type = '') {
    const container = document.getElementById('notification-container');
    const msg = document.createElement('div');
    msg.className = `toast ${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}