// main.js - Punto de entrada
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { initWorld, getGroundSize, getScene, getCamera, getRenderer, getLabelRenderer, getControls } from './world.js';
import { createCharacter, getCharacters, addNewCharacter, getJefe, setJefe, initCharacters, getNextId } from './characters.js';
import { setupDragDrop, setupUI } from './game.js';

// Inicializar mundo
const { scene, camera, renderer, labelRenderer, controls } = initWorld();

// Inicializar personajes
const jefe = initCharacters();

// Configurar UI
setupUI();

// Configurar drag & drop
setupDragDrop(scene, camera, renderer);

// Variables globales para el bucle
let lastTime = performance.now();

// Función de animación
function animate() {
    const now = performance.now();
    let delta = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    // Aquí llamaremos a las actualizaciones del juego
    // que estarán en game.js
    import('./game.js').then(module => {
        module.updateGame(delta);
    });

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Redimensionar
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});