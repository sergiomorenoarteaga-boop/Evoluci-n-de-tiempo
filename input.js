// Manejo del teclado para el jefe
export const keys = { w: false, a: false, s: false, d: false };

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