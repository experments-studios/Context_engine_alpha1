/**
 * Gelişmiş Tarayıcı Girdi Motoru (Input Engine)
 * Klavye ve Gamepad API'lerini yönetir.
 */
class InputEngine {
    constructor() {
        this.keyboardBindings = new Map(); // Klavye tuşları için bağlamalar
        this.gamepadApiCallback = null;    // Gamepad durumunu işleyecek fonksiyon
        this.isPolling = false;            // Gamepad döngüsünün durumunu tutar
        this.lastGamepadState = [];        // Düğme basma durumunu takip etmek için

        // Kullanıcının komut yapısına uygun arayüz nesneleri
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

        console.log("Input Engine başlatıldı. Klavye ve Gamepad API'leri dinleniyor.");
    }

    // `context.input()` komutunun işlevi (şu an sadece yer tutucu,
    // gerçekte bir sınıf içinde gerekli değil ancak komut yapınız için bırakıldı)
    enterBindingContext() {
        // Gelişmiş motorlarda bu, kayıt modunu veya bağlamı değiştirir.
        return this.input;
    }

    // KLAVYE YÖNETİMİ
    
    // Klavye tuş basma bağlamasını kaydetme
    registerKeyboardBinding(key, callback) {
        if (!this.keyboardBindings.has(key)) {
            this.keyboardBindings.set(key, []);
        }
        this.keyboardBindings.get(key).push(callback);
    }

    // Klavye olay dinleyicilerini tarayıcıya ekleme
    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            // Varsayılan tarayıcı davranışını engellemek isterseniz: event.preventDefault();
            
            if (this.keyboardBindings.has(key)) {
                this.keyboardBindings.get(key).forEach(callback => callback(event));
            }
        });
        
        // Keyup olayını da dinlemek gerekebilir
        // document.addEventListener('keyup', (event) => { /* ... */ });
    }

    // GAMEPAD YÖNETİMİ

    // Gamepad API callback fonksiyonunu ayarlama
    setGamepadApiCallback(callback) {
        this.gamepadApiCallback = callback;
        console.log("Gamepad API callback ayarlandı.");
    }

    // Gamepad durumunu düzenli olarak kontrol etme (Polling Döngüsü)
    startGamepadPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        const checkGamepads = () => {
            // Gamepad'leri al (varsa)
            const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(gp => gp) : [];

            if (this.gamepadApiCallback) {
                // Kayıtlı Gamepad callback'ini güncel verilerle çağır
                this.gamepadApiCallback(gamepads);
            }
            
            // Gamepad düğme basma olaylarını takip etmek için state karşılaştırması
            this.handleGamepadButtonEvents(gamepads);

            // Bir sonraki frame için tekrar çağır
            requestAnimationFrame(checkGamepads);
        };
        
        requestAnimationFrame(checkGamepads);
    }

    // Gamepad düğme basma olaylarını algılama (basılı tutma değil, tıklama anı)
    handleGamepadButtonEvents(gamepads) {
        gamepads.forEach((gp, index) => {
            if (!gp) return;

            // Önceki durumu al veya oluştur
            const lastState = this.lastGamepadState[index] || {};

            gp.buttons.forEach((button, buttonIndex) => {
                const isPressedNow = button.pressed;
                const wasPressedLast = lastState[buttonIndex] || false;

                // Tuşa *yeni* basıldıysa (KeyDown olayı)
                if (isPressedNow && !wasPressedLast) {
                    // Gamepad KeyDown/onPress olayını burada tetikleyebilirsiniz (Gelişmiş motorlar için)
                    // console.log(`Gamepad ${index} - Düğme ${buttonIndex} - Tıklandı`);
                }
            });

            // Mevcut durumu kaydet
            this.lastGamepadState[index] = gp.buttons.map(b => b.pressed);
        });
    }
}

/**
 * Klavye bağlamasını gerçekleştiren yardımcı sınıf (Fluent Interface için)
 */
class KeyboardBinder {
    constructor(engine, key) {
        this.engine = engine;
        this.key = key;
    }
    
    // Kullanıcının istediği komut yapısı: input.keyboard('a').onPress(() => {})
    // Not: İstekteki `input.keyboard(a); kod; }` yapısı JavaScript syntax'ına uymaz,
    // bu yüzden `.onPress` metodunu kullanıyoruz.
    onPress(callback) {
        this.engine.registerKeyboardBinding(this.key, callback);
        return this; // Zincirleme için (method chaining)
    }
    
    // İsteğe bağlı olarak keyup (tuşu bırakma) olayı da eklenebilir
    // onRelease(callback) { ... }
}

