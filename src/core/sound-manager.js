class SoundManager {
  constructor() {
    this.isMuted = false;
    this.sounds = {};
    this.activeSounds = [];
    this.soundTypes = {};
    window._isMuted = false;
    window._currentSound = null;
  }

  saveState() {
    import('./persistence.js').then(({ persistence }) => {
      persistence.save();
    });
  }

  registerSound(name, url, loop = false, type = 'background', volume = 1) {
    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = volume;
    this.sounds[name] = audio;
    this.soundTypes[name] = type;
    return audio;
  }

  play(name) {
    if (this.sounds[name]) {
      if (this.activeSounds.indexOf(name) === -1) {
        this.activeSounds.push(name);
      }

      if (!this.isMuted) {
        this.sounds[name].play().catch((err) => {
          console.log('Could not play sound ' + name + ':', err);
        });
      }
      
      const soundType = this.soundTypes[name] || 'background';
      if (soundType === 'background') {
        window._currentSound = name;
        this.saveState();
      }
    }
  }

  pause(name) {
    if (this.sounds[name]) {
      this.sounds[name].pause();
    }
  }

  stop(name) {
    if (this.sounds[name]) {
      this.sounds[name].pause();
      this.sounds[name].currentTime = 0;

      const index = this.activeSounds.indexOf(name);
      if (index > -1) {
        this.activeSounds.splice(index, 1);
      }
      const soundType = this.soundTypes[name] || 'background';
      if (soundType === 'background' && window._currentSound === name) {
        window._currentSound = null;
        this.saveState();
      }
    }
  }

  fadeOut(name, duration = 1000, onComplete = null) {
    if (!this.sounds[name]) {
      if (onComplete) onComplete();
      return;
    }

    const audio = this.sounds[name];
    const startVolume = audio.volume;
    const startTime = Date.now();
    const fadeInterval = 25;

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newVolume = startVolume * (1 - progress);
      audio.volume = Math.max(0, newVolume);

      if (progress < 1) {
        setTimeout(fade, fadeInterval);
      } else {
        audio.pause();
        audio.volume = startVolume;
        if (onComplete) onComplete();
      }
    };

    fade();
  }

  setMuted(muted) {
    if (this.isMuted === muted) return this.isMuted;

    this.isMuted = muted;
    window._isMuted = muted;

    if (this.isMuted) {
      for (let i = 0; i < this.activeSounds.length; i++) {
        const soundName = this.activeSounds[i];
        const soundType = this.soundTypes[soundName] || 'background';

        if (soundType === 'background') {
          this.pause(soundName);
        } else {
          this.stop(soundName);
        }
      }
    } else {
      for (let i = 0; i < this.activeSounds.length; i++) {
        const soundName = this.activeSounds[i];
        const soundType = this.soundTypes[soundName] || 'background';

        if (soundType === 'background') {
          this.play(soundName);
        }
      }
    }

    this.saveState();
    return this.isMuted;
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();

