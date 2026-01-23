
export class InputManager {
    constructor() {
        this.keys = {};
        this.axis = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        this.isMouseDown = false;

        this._initListeners();
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this._updateAxis();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this._updateAxis();
        });

        window.addEventListener('mousemove', (e) => {
            // Mouse position will be relative to screen, 
            // but we might need world position later. 
            // For now, raw clientX/Y is stored, camera will transform it.
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    _updateAxis() {
        let x = 0;
        let y = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // Normalize if moving diagonally
        if (x !== 0 && y !== 0) {
            const mag = Math.hypot(x, y);
            x /= mag;
            y /= mag;
        }

        this.axis.x = x;
        this.axis.y = y;
    }

    /**
     * Returns the normalized movement vector {x, y}
     */
    getAxis() {
        return this.axis;
    }

    getMousePosition() {
        return this.mouse;
    }
}
