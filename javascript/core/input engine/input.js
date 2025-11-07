class InputEngine {
    constructor() {
        this.keyboardBindings = new Map();
        this.gamepadApiCallback = null;
        this.isPolling = false;
        this.lastGamepadState = [];

        this.context = {
            input: () => this.enterBindingContext()
        };
        this.input = {
            keyboard: (key) => new KeyboardBinder(this, key.toLowerCase()),
            api: {
                gamepad: (callback) => this.setGamepadApiCallback(callback)
            }
        };

        this.setupKeyboardListeners();
        this.startGamepadPolling();

    }

    enterBindingContext() {
        return this.input;
    }

    registerKeyboardBinding(key, callback) {
        if (!this.keyboardBindings.has(key)) {
            this.keyboardBindings.set(key, []);
        }
        this.keyboardBindings.get(key).push(callback);
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            
            if (this.keyboardBindings.has(key)) {
                this.keyboardBindings.get(key).forEach(callback => callback(event));
            }
        });
        
    }

    setGamepadApiCallback(callback) {
        this.gamepadApiCallback = callback;
    }

    startGamepadPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        const checkGamepads = () => {
            const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(gp => gp) : [];

            if (this.gamepadApiCallback) {
                this.gamepadApiCallback(gamepads);
            }
            
            this.handleGamepadButtonEvents(gamepads);

            requestAnimationFrame(checkGamepads);
        };
        
        requestAnimationFrame(checkGamepads);
    }

    handleGamepadButtonEvents(gamepads) {
        gamepads.forEach((gp, index) => {
            if (!gp) return;

            const lastState = this.lastGamepadState[index] || {};

            gp.buttons.forEach((button, buttonIndex) => {
                const isPressedNow = button.pressed;
                const wasPressedLast = lastState[buttonIndex] || false;

                if (isPressedNow && !wasPressedLast) {
                }
            });

            this.lastGamepadState[index] = gp.buttons.map(b => b.pressed);
        });
    }
}

class KeyboardBinder {
    constructor(engine, key) {
        this.engine = engine;
        this.key = key;
    }
    
    onPress(callback) {
        this.engine.registerKeyboardBinding(this.key, callback);
        return this;
    }
    
}

