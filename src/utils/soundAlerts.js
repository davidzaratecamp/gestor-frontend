// Utilidades para sonidos de alerta más avanzadas

// Crear un tono más suave y profesional
export const createAlertTone = (frequency, duration, volume = 0.1, type = 'sine') => {
    return new Promise((resolve) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            // Fade in y fade out suaves
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - 0.1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
            
            setTimeout(() => resolve(), duration * 1000);
        } catch (error) {
            console.warn('Error creating audio context:', error);
            resolve();
        }
    });
};

// Secuencias de sonido para diferentes niveles
export const playWarningAlert = async () => {
    await createAlertTone(800, 0.3, 0.05); // Tono suave amarillo
};

export const playCriticalAlert = async () => {
    await createAlertTone(1000, 0.2, 0.08); // Tono medio rojo
    await new Promise(resolve => setTimeout(resolve, 100));
    await createAlertTone(1000, 0.2, 0.08); // Doble tono
};

export const playUrgentAlert = async () => {
    // Secuencia más intensa para urgente
    for (let i = 0; i < 3; i++) {
        await createAlertTone(1200, 0.15, 0.1);
        await new Promise(resolve => setTimeout(resolve, 150));
    }
};

// Función principal que decide qué sonido reproducir
export const playAlertByLevel = (level) => {
    switch (level) {
        case 'warning':
            return playWarningAlert();
        case 'critical':
            return playCriticalAlert();
        case 'urgent':
            return playUrgentAlert();
        default:
            return Promise.resolve();
    }
};