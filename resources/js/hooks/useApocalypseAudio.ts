import { useEffect, useRef } from 'react';

export function useApocalypseAudio(scene: number, isPlaying: boolean) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);

    useEffect(() => {
        if (!isPlaying) return;

        // Crear contexto de audio
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        
        // Limpiar osciladores anteriores
        oscillatorsRef.current.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Ignorar errores si el oscilador ya está detenido
            }
        });
        oscillatorsRef.current = [];

        // Crear ambiente sonoro según la escena
        const createAmbience = () => {
            const gainNode = ctx.createGain();
            gainNode.connect(ctx.destination);
            
            if (scene <= 2) {
                // Escenas iniciales: Tono bajo y misterioso
                gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(40, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 3);
                osc.connect(gainNode);
                osc.start();
                
                oscillatorsRef.current.push(osc);
            } else if (scene <= 4) {
                // Escenas de tensión: Aumentar frecuencia y agregar disonancia
                gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
                
                [60, 90, 120].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 2);
                    
                    const oscGain = ctx.createGain();
                    oscGain.gain.setValueAtTime(0.3 - i * 0.08, ctx.currentTime);
                    
                    osc.connect(oscGain);
                    oscGain.connect(gainNode);
                    osc.start();
                    
                    oscillatorsRef.current.push(osc);
                });
            } else {
                // Escenas finales: Sonido más intenso y dramático
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                
                [80, 120, 180, 240].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    
                    const lfo = ctx.createOscillator();
                    lfo.frequency.setValueAtTime(0.5 + i * 0.3, ctx.currentTime);
                    const lfoGain = ctx.createGain();
                    lfoGain.gain.setValueAtTime(20, ctx.currentTime);
                    
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    
                    const oscGain = ctx.createGain();
                    oscGain.gain.setValueAtTime(0.2 - i * 0.04, ctx.currentTime);
                    
                    osc.connect(oscGain);
                    oscGain.connect(gainNode);
                    
                    lfo.start();
                    osc.start();
                    
                    oscillatorsRef.current.push(osc, lfo);
                });
            }
        };

        createAmbience();

        return () => {
            oscillatorsRef.current.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Ignorar errores
                }
            });
            oscillatorsRef.current = [];
        };
    }, [scene, isPlaying]);

    const cleanup = () => {
        oscillatorsRef.current.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Ignorar errores
            }
        });
        oscillatorsRef.current = [];
        
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    return { cleanup };
}
