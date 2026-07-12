import { characters } from './characters.js';

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