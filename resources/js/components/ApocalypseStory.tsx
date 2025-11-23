import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { DebrisField } from './ParticleEffects';
import { useApocalypseAudio } from '@/hooks/useApocalypseAudio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Datos del meteorito 35396 (1997 XF11)
const METEORITE_DATA = {
    name: "35396 (1997 XF11)",
    diameter_km: 1.4, // Promedio del rango estimado
    velocity_kmps: 22.8, // km/s aproximado
    approach_date: "26 de octubre de 2028",
    miss_distance_km: 930000, // ~930,000 km de la Tierra
    is_hazardous: false,
    discovery_year: 1997,
    impact_energy_megatons: 350, // Energía estimada si impactara
};

interface StoryScene {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    duration: number;
}

const STORY_SCENES: StoryScene[] = [
    {
        id: 1,
        title: "6 DICIEMBRE 1997",
        subtitle: "Observatorio Kitt Peak, Arizona",
        description: "Un objeto cercano a la Tierra es catalogado. Las primeras observaciones revelan una órbita que cruza la trayectoria terrestre con periodicidad regular.",
        cameraPosition: [0, 0, 50],
        cameraTarget: [0, 0, 0],
        duration: 6000,
    },
    {
        id: 2,
        title: "ASTEROIDE 35396",
        subtitle: "Designación: 1997 XF11 • Clase: Apollo • Diámetro: 0.7 - 1.4 km",
        description: "Composición rocosa con núcleo metálico. Masa estimada suficiente para generar un evento de extinción regional en caso de impacto directo.",
        cameraPosition: [5, 3, 10],
        cameraTarget: [0, 0, 0],
        duration: 6000,
    },
    {
        id: 3,
        title: "VELOCIDAD ORBITAL",
        subtitle: "28.25 km/s relativa a la Tierra • Magnitud Absoluta: 19.9",
        description: "La energía cinética del objeto es proporcional al cuadrado de su velocidad. A esta velocidad, incluso un objeto pequeño representa una amenaza significativa.",
        cameraPosition: [-8, 4, 12],
        cameraTarget: [0, 0, 0],
        duration: 6000,
    },
    {
        id: 4,
        title: "APROXIMACIÓN 2028",
        subtitle: "Fecha: 26 de octubre • Distancia mínima: 2.42 LD (929,000 km)",
        description: "El objeto pasará dentro del rango de observación óptima. Esta aproximación permitirá refinar los cálculos orbitales y evaluar el riesgo futuro con mayor precisión.",
        cameraPosition: [0, 10, 30],
        cameraTarget: [0, 0, 0],
        duration: 6000,
    },
    {
        id: 5,
        title: "ANÁLISIS DE IMPACTO",
        subtitle: "Energía potencial: Equivalente a cientos de megatones de TNT",
        description: "Un evento de impacto generaría una onda de choque supersónica, iniciando incendios en un radio de cientos de kilómetros. El polvo estratosférico resultante afectaría el clima global durante años.",
        cameraPosition: [15, 8, 25],
        cameraTarget: [0, 0, 0],
        duration: 6500,
    },
    {
        id: 6,
        title: "EVALUACIÓN DE RIESGO",
        subtitle: "Probabilidad de impacto en las próximas décadas: Estadísticamente baja pero no nula",
        description: "Los modelos orbitales indican que pequeñas perturbaciones gravitacionales podrían alterar la trayectoria. El monitoreo continuo es esencial para la evaluación precisa del riesgo.",
        cameraPosition: [20, 12, 35],
        cameraTarget: [0, 0, 0],
        duration: 6500,
    },
    {
        id: 7,
        title: "DEFENSA PLANETARIA",
        subtitle: "Estrategias de mitigación: Deflexión por impacto cinético, tractores gravitacionales, detonación nuclear",
        description: "Los sistemas de detección y respuesta temprana son operacionales. La capacidad tecnológica existe. La implementación depende de la coordinación internacional y la inversión sostenida.",
        cameraPosition: [0, 5, 40],
        cameraTarget: [0, 0, 0],
        duration: 7000,
    },
];

function AnimatedAsteroid({ scene }: { scene: number }) {
    const asteroidRef = useRef<THREE.Group>(null);
    const { scene: asteroidModel } = useGLTF('/models/Rocky_Asteroid_5.gltf');
    const [speed] = useState(0.5);

    useFrame((state) => {
        if (asteroidRef.current) {
            // Rotación del asteroide
            asteroidRef.current.rotation.y += 0.005;
            asteroidRef.current.rotation.x += 0.002;

            // Movimiento amenazante más agresivo en escenas posteriores
            const time = state.clock.getElapsedTime();
            const intensity = scene >= 3 ? 2 : 1;
            asteroidRef.current.position.z = Math.sin(time * speed) * 5 * intensity;
            asteroidRef.current.position.x = Math.cos(time * speed * 0.5) * 2 * intensity;

            // Escala más grande cuando se acerca (escena 4+)
            const scale = scene >= 4 ? 3.5 + Math.sin(time * 2) * 0.5 : 3.5;
            asteroidRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group ref={asteroidRef}>
            <primitive object={asteroidModel.clone()} scale={3.5} />
            {/* Iluminación realista del asteroide */}
            <pointLight color="#8b4513" intensity={scene >= 4 ? 1.2 : 0.6} distance={12} decay={2} />
            <pointLight color="#a0522d" intensity={scene >= 4 ? 0.8 : 0.4} distance={18} decay={2} />
            
            {/* Efecto de proximidad */}
            {scene >= 4 && (
                <mesh scale={4}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial
                        color="#663300"
                        transparent
                        opacity={0.04}
                        side={THREE.BackSide}
                    />
                </mesh>
            )}
        </group>
    );
}

function Earth({ scene }: { scene: number }) {
    const earthRef = useRef<THREE.Group>(null);
    const [intensity, setIntensity] = useState(1);

    useFrame((state) => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.001;

            // Efecto de peligro cuando el asteroide se acerca
            if (scene >= 4) {
                const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.3 + 0.7;
                setIntensity(pulse);
            }
        }
    });

    return (
        <group ref={earthRef} position={[25, 0, -10]}>
            <mesh>
                <sphereGeometry args={[5, 64, 64]} />
                <meshStandardMaterial
                    map={new THREE.TextureLoader().load('/textures/8k_earth_daymap.jpg')}
                    normalMap={new THREE.TextureLoader().load('/textures/8k_earth_normal_map.jpg')}
                    emissive="#0a1929"
                    emissiveIntensity={intensity * 0.15}
                />
            </mesh>
            {scene >= 5 && (
                <>
                    <pointLight color="#cc4400" intensity={intensity * 1.5} distance={20} />
                    <mesh scale={5.5}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshBasicMaterial
                            color="#663300"
                            transparent
                            opacity={0.06 * intensity}
                            side={THREE.BackSide}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}

function DefenseSystem({ visible }: { visible: boolean }) {
    const rocketRef = useRef<THREE.Group>(null);
    const satelliteRef = useRef<THREE.Group>(null);
    const { scene: rocketScene } = useGLTF('/models/rocket.gltf');
    const { scene: satelliteScene } = useGLTF('/models/satellite.gltf');

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        if (rocketRef.current && visible) {
            rocketRef.current.position.x = Math.cos(time * 0.5) * 15;
            rocketRef.current.position.y = Math.sin(time * 0.5) * 15 + 5;
            rocketRef.current.rotation.z = time * 0.5;
        }

        if (satelliteRef.current && visible) {
            satelliteRef.current.position.x = Math.sin(time * 0.3) * 20;
            satelliteRef.current.position.y = Math.cos(time * 0.3) * 10;
            satelliteRef.current.rotation.y += 0.01;
        }
    });

    if (!visible) return null;

    return (
        <>
            <group ref={rocketRef} scale={0.5}>
                <primitive object={rocketScene.clone()} />
                <pointLight color="#4a7c9e" intensity={1} distance={5} />
            </group>
            <group ref={satelliteRef} position={[0, 10, 5]} scale={0.3}>
                <primitive object={satelliteScene.clone()} />
                <pointLight color="#00ff00" intensity={1.5} distance={8} />
            </group>
        </>
    );
}

function CameraController({ scene, sceneIndex }: { scene: StoryScene; sceneIndex: number }) {
    const { camera } = useThree();
    const targetRef = useRef(new THREE.Vector3(...scene.cameraTarget));
    const positionRef = useRef(new THREE.Vector3(...scene.cameraPosition));

    useEffect(() => {
        targetRef.current.set(...scene.cameraTarget);
        positionRef.current.set(...scene.cameraPosition);
    }, [scene]);

    useFrame((state) => {
        // Smooth camera transition
        camera.position.lerp(positionRef.current, 0.05);
        
        const lookAtTarget = new THREE.Vector3();
        lookAtTarget.lerp(targetRef.current, 0.05);
        
        // Camera shake en escenas intensas (4 y 5)
        if (sceneIndex >= 4) {
            const shake = 0.1 * (sceneIndex >= 5 ? 2 : 1);
            camera.position.x += Math.sin(state.clock.elapsedTime * 10) * shake;
            camera.position.y += Math.cos(state.clock.elapsedTime * 15) * shake;
        }
        
        camera.lookAt(lookAtTarget);
    });

    return null;
}

function Scene3D({ currentScene }: { currentScene: number }) {
    const scene = STORY_SCENES[currentScene];

    return (
        <>
            <CameraController scene={scene} sceneIndex={currentScene} />
            
            {/* Iluminación ambiental */}
            <ambientLight intensity={0.05} />
            <directionalLight position={[10, 10, 5]} intensity={0.25} color="#8b9bb4" />
            
            {/* Campo estelar */}
            <Stars
                radius={300}
                depth={60}
                count={5000}
                factor={5}
                saturation={0}
                fade
                speed={0.3}
            />

            {/* Asteroide principal */}
            <AnimatedAsteroid scene={currentScene} />

            {/* La Tierra */}
            <Earth scene={currentScene} />

            {/* Sistema de defensa (aparece en la última escena) */}
            <DefenseSystem visible={currentScene >= 5} />

            {/* Campo de escombros amenazante */}
            {currentScene >= 2 && <DebrisField count={currentScene >= 4 ? 400 : 200} radius={50} />}
        </>
    );
}

function StoryText({ scene }: { scene: StoryScene }) {
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 px-4 sm:px-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 1.5 }}
                    className="text-center space-y-4 sm:space-y-8 max-w-5xl w-full"
                >
                    {/* Línea de clasificación superior */}
                    <motion.div
                        className="text-[10px] sm:text-xs font-mono text-gray-700 uppercase tracking-widest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                    >
                        INFORME CLASIFICADO • NASA JPL • CNEOS
                    </motion.div>

                    <motion.h1
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-200 tracking-wide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1.2 }}
                    >
                        {scene.title}
                    </motion.h1>
                    
                    <motion.h2
                        className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light text-gray-400 border-l-2 border-gray-700 pl-3 sm:pl-6 max-w-3xl mx-auto text-left"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 1 }}
                    >
                        {scene.subtitle}
                    </motion.h2>
                    
                    <motion.p
                        className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-500 font-light max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 1.2 }}
                    >
                        {scene.description}
                    </motion.p>

                    {/* Barra de progreso */}
                    <motion.div
                        className="w-48 sm:w-64 md:w-96 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto mt-4 sm:mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: scene.duration / 1000, ease: "linear" }}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function ApocalypseStory() {
    const [currentScene, setCurrentScene] = useState(0);
    const [started, setStarted] = useState(false);
    const [showCredits, setShowCredits] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Hook de audio ambiente
    const { cleanup } = useApocalypseAudio(currentScene, started && !showCredits && audioEnabled);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    useEffect(() => {
        if (!started || showCredits) return;

        const timer = setTimeout(() => {
            if (currentScene < STORY_SCENES.length - 1) {
                setCurrentScene(currentScene + 1);
            } else {
                setShowCredits(true);
            }
        }, STORY_SCENES[currentScene].duration);

        return () => clearTimeout(timer);
    }, [currentScene, started, showCredits]);

    if (!started) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden">
                {/* Fondo de estrellas muy sutil - más oscuro */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(60)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-px h-px bg-gray-400 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0.1, 0.4, 0.1],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                        />
                    ))}
                </div>

                {/* Efecto de vignette */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black pointer-events-none" />

                <motion.div
                    className="text-center space-y-6 sm:space-y-12 z-10 max-w-5xl px-4 sm:px-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                >
                    {/* Encabezado principal */}
                    <motion.div
                        className="space-y-4 sm:space-y-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1.2 }}
                    >
                        <div className="inline-block border-l-2 border-red-800 pl-3 sm:pl-6 text-left">
                            <p className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-widest mb-2">
                                CLASIFICADO • NASA JPL • CNEOS
                            </p>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-200 tracking-wide">
                                INFORME DE AMENAZA
                            </h1>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-100 mt-2">
                                ASTEROIDE 35396
                            </h2>
                        </div>
                    </motion.div>
                    
                    {/* Datos técnicos */}
                    <motion.div
                        className="space-y-2 sm:space-y-3 border-t border-b border-gray-800 py-4 sm:py-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1.2 }}
                    >
                        <div className="flex justify-between items-center text-left max-w-2xl mx-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Designación</span>
                            <span className="text-xs sm:text-sm md:text-lg text-gray-300 font-light">1997 XF11 • Clase Apollo</span>
                        </div>
                        <div className="flex justify-between items-center text-left max-w-2xl mx-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Diámetro Est.</span>
                            <span className="text-xs sm:text-sm md:text-lg text-gray-300 font-light">0.7 - 1.4 km</span>
                        </div>
                        <div className="flex justify-between items-center text-left max-w-2xl mx-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Velocidad</span>
                            <span className="text-xs sm:text-sm md:text-lg text-gray-300 font-light">28.25 km/s</span>
                        </div>
                        <div className="flex justify-between items-center text-left max-w-2xl mx-auto gap-2">
                            <span className="text-[10px] sm:text-xs font-mono text-gray-600 uppercase tracking-wider">Aprox. Cercano</span>
                            <span className="text-xs sm:text-sm md:text-lg text-gray-300 font-light">26 Oct 2028</span>
                        </div>
                    </motion.div>

                    {/* Mensaje de contexto */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                    >
                        <p className="text-xs sm:text-sm md:text-base text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
                            Este informe documenta la trayectoria y el riesgo potencial del objeto cercano a la Tierra
                            35396 (1997 XF11). Los datos presentados son de naturaleza crítica para la seguridad planetaria.
                        </p>
                    </motion.div>
                    
                    {/* Control de acceso */}
                    <motion.div
                        className="pt-4 sm:pt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                    >
                        <motion.button
                            onClick={() => setStarted(true)}
                            className="px-8 sm:px-12 md:px-16 py-3 sm:py-4 bg-gray-900 border border-gray-700 text-gray-300 text-xs sm:text-sm font-mono uppercase tracking-widest rounded-none hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 w-full sm:w-auto"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Acceder al Informe
                        </motion.button>
                        
                        <p className="text-[10px] sm:text-xs text-gray-700 mt-4 sm:mt-8 font-mono px-4">
                            VISUALIZACIÓN 3D • DATOS EN TIEMPO REAL • ANÁLISIS DE TRAYECTORIA
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // Pantalla de créditos épica
    if (showCredits) {
        return (
            <motion.div
                className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Efecto de estrellas de fondo */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(100)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-px h-px bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0.2, 0.8, 0.2],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                {/* Texto épico de créditos */}
                <div className="text-center z-10 px-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, type: "spring", stiffness: 100 }}
                    >
                        <motion.h1
                            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gray-200 tracking-widest mb-4 sm:mb-8"
                            animate={{
                                textShadow: [
                                    "0 0 20px rgba(255,255,255,0.3)",
                                    "0 0 40px rgba(255,255,255,0.5)",
                                    "0 0 20px rgba(255,255,255,0.3)",
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                        >
                            APOCALIPSIS
                        </motion.h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="flex items-center justify-center gap-2 sm:gap-4"
                    >
                        <motion.div
                            className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-gray-600"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                        />
                        <p className="text-lg sm:text-2xl font-light text-gray-400 tracking-[0.3em] uppercase">
                            by
                        </p>
                        <motion.div
                            className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-gray-600"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                        />
                    </motion.div>

                    <motion.h2
                        className="text-4xl sm:text-5xl md:text-6xl font-light text-gray-300 tracking-[0.2em] mt-4 sm:mt-6 mb-8 sm:mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 1 }}
                    >
                        SAERO
                    </motion.h2>

                    {/* Controles de navegación */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-8 sm:mt-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2, duration: 1 }}
                    >
                        <motion.button
                            onClick={() => {
                                setShowCredits(false);
                                setStarted(false);
                                setCurrentScene(0);
                            }}
                            className="px-6 sm:px-12 py-3 sm:py-4 bg-gray-900 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-gray-300 font-light text-xs sm:text-sm uppercase tracking-widest rounded-none transition-all duration-300 w-full sm:w-auto"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Revisar Informe
                        </motion.button>

                        <motion.a
                            href="/dashboard"
                            className="px-6 sm:px-12 py-3 sm:py-4 bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300 font-light text-xs sm:text-sm uppercase tracking-widest rounded-none transition-all duration-300 w-full sm:w-auto inline-block text-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Acceder a Simulaciones
                        </motion.a>
                    </motion.div>

                    {/* Footer discreto */}
                    <motion.p
                        className="text-center text-gray-700 text-xs mt-8 sm:mt-12 font-mono uppercase tracking-wider px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5, duration: 1 }}
                    >
                        Fuente: NASA JPL Small-Body Database • CNEOS
                    </motion.p>
                </div>

                {/* Vignette oscuro */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black pointer-events-none" />
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black">
            {/* Efectos cinematográficos */}
            {currentScene >= 3 && <div className="apocalypse-scan-line" />}
            <div className="apocalypse-vignette" />
            
            {/* Texto sobre la escena 3D */}
            <StoryText scene={STORY_SCENES[currentScene]} />

            {/* Escena 3D */}
            <Canvas
                camera={{ position: [0, 0, 50], fov: 60 }}
                gl={{ antialias: true, alpha: false }}
            >
                <Scene3D currentScene={currentScene} />
            </Canvas>

            {/* Controles superiores */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-20">
                <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-950/40 text-gray-500 rounded-none hover:bg-gray-900/60 hover:text-gray-400 transition-all backdrop-blur-sm border border-gray-800/50 text-[10px] sm:text-xs font-mono uppercase tracking-wider"
                    title={audioEnabled ? "Silenciar" : "Activar sonido"}
                >
                    {audioEnabled ? "Audio On" : "Audio Off"}
                </button>
                <button
                    onClick={() => {
                        setShowCredits(true);
                    }}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-950/40 text-gray-500 rounded-none hover:bg-gray-900/60 hover:text-gray-400 transition-all backdrop-blur-sm border border-gray-800/50 text-[10px] sm:text-xs font-mono uppercase tracking-wider"
                >
                    Saltar
                </button>
            </div>

            {/* Indicador de progreso */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 text-gray-700 font-mono text-[10px] sm:text-xs z-20 uppercase tracking-widest">
                Sección {currentScene + 1} / {STORY_SCENES.length}
            </div>

            {/* Panel de telemetría */}
            {currentScene >= 2 && (
                <div className="fixed bottom-16 sm:bottom-20 left-4 sm:left-10 text-left font-mono text-green-400 text-[10px] sm:text-sm space-y-0.5 sm:space-y-1 opacity-70 z-20">
                    <p>[ SISTEMA DE SEGUIMIENTO ACTIVO ]</p>
                    <p>OBJETIVO: {METEORITE_DATA.name}</p>
                    <p>DIÁMETRO: {METEORITE_DATA.diameter_km} km</p>
                    <p>VELOCIDAD: {METEORITE_DATA.velocity_kmps} km/s</p>
                    <p>APROXIMACIÓN: {METEORITE_DATA.approach_date}</p>
                    <p className="text-red-500 font-bold">
                        NIVEL DE AMENAZA: {METEORITE_DATA.is_hazardous ? "CRÍTICO" : "ALTO"}
                    </p>
                </div>
            )}
        </div>
    );
}

// Precargar modelos
useGLTF.preload('/models/Rocky_Asteroid_5.gltf');
useGLTF.preload('/models/rocket.gltf');
useGLTF.preload('/models/satellite.gltf');
