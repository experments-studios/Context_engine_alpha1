class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.soundCache = {};
        this.activeSounds = {};

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
        }
        this.AudioContextConstructor = AudioContext;
    }

    initContext() {
        if (this.audioContext === null) {
            this.audioContext = new this.AudioContextConstructor();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
            });
        }
    }
    
    async loadSound(url) {
        if (!this.audioContext) {
            throw new Error("AudioContext not initialized. Please call initContext() first.");
        }
        
        if (this.soundCache[url]) {
            return this.soundCache[url];
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.soundCache[url] = audioBuffer;
            return audioBuffer;

        } catch (error) {
            throw error;
        }
    }

    async sound(url, loop = false, volume = 1.0, id = url) {
        if (!this.audioContext) {
            return;
        }

        if (this.activeSounds[id] && !loop) {
            this.stop(id);
        }
        
        if (this.activeSounds[id] && this.activeSounds[id].paused && loop) {
             this.resume(id);
             return id;
        }

        try {
            const buffer = await this.loadSound(url);
            
            this.activeSounds[id] = {
                url: url,
                buffer: buffer,
                sourceNode: null,
                gainNode: null,
                startTime: 0,
                startOffset: 0,
                paused: false,
                volume: volume,
                loop: loop
            };
            
            this._startSound(id);

            return id;

        } catch (e) {
        }
    }
    
    _startSound(id, offset = this.activeSounds[id].startOffset) {
        const soundObj = this.activeSounds[id];
        if (!soundObj || !soundObj.buffer) return;

        if (soundObj.sourceNode) {
            soundObj.sourceNode.disconnect();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = soundObj.buffer;
        source.loop = soundObj.loop;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(soundObj.volume, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.onended = () => {
            if (!source.loop) {
                delete this.activeSounds[id];
            }
        };

        soundObj.sourceNode = source;
        soundObj.gainNode = gainNode;
        soundObj.startTime = this.audioContext.currentTime;
        soundObj.startOffset = offset;
        soundObj.paused = false;

        source.start(0, offset);
    }


    pause(id) {
        const soundObj = this.activeSounds[id];
        if (!soundObj || soundObj.paused) {
            return false;
        }

        const elapsed = this.audioContext.currentTime - soundObj.startTime;
        soundObj.startOffset += elapsed;
        
        soundObj.sourceNode.stop();
        soundObj.paused = true;
        
        return true;
    }

    resume(id) {
        const soundObj = this.activeSounds[id];
        if (!soundObj || !soundObj.paused) {
            return false;
        }
        
        this._startSound(id, soundObj.startOffset);
        return true;
    }

    stop(id) {
        const soundObj = this.activeSounds[id];
        if (!soundObj) return false;
        
        if (soundObj.sourceNode) {
             try {
                 soundObj.sourceNode.stop(0);
                 soundObj.sourceNode.disconnect();
             } catch (e) {
             }
        }
        
        delete this.activeSounds[id];
        
        return true;
    }
}
