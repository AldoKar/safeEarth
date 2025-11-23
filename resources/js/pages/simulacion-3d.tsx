import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stars, Html, Line } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Physics, RigidBody, RapierRigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Play, Pause, RotateCcw, Zap, Target, Shield, Rocket, AlertTriangle } from 'lucide-react';

import EarthDayMap from "../../assets/textures/8k_earth_daymap.jpg"
import EarthNormalMap from "../../assets/textures/8k_earth_normal_map.jpg"
import EarthSpecularMap from '../../assets/textures/8k_earth_specular_map.jpg'
import EarthCloudsMap from '../../assets/textures/8k_earth_clouds.jpg'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Simulación 3D',
        href: '/simulacion-3d',
    },
];

interface OrbitPoint {
    t: number;
    x: number;
    y: number;
    z: number;
    vx?: number;
    vy?: number;
    vz?: number;
}

interface KeplerAPIResponse {
    metadata: {
        saved_points: number;
        total_recorded_points: number;
        requested_max_points: number;
        destroyed: boolean;
        asteroid_mass_kg?: number;
        asteroid_radius_m?: number;
        central_body?: string;
        inclination_deg?: number;
        raan_deg?: number;
        argp_deg?: number;
    };
    data: OrbitPoint[];
}

function EarthSmall() {
    const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        EarthDayMap,
        EarthNormalMap,
        EarthSpecularMap,
        EarthCloudsMap
    ]);

    const earthRef = useRef<THREE.Mesh>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        if (earthRef.current) earthRef.current.rotation.y = elapsedTime / 16;
        if (cloudsRef.current) cloudsRef.current.rotation.y = elapsedTime / 16;
    });

    return (
        <>
            <pointLight color="#ebe0c1" position={[2, 0, 5]} intensity={12} />

            <mesh ref={cloudsRef}>
                <sphereGeometry args={[35.25, 32, 32]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    opacity={0.4}
                    depthWrite={true}
                    transparent={true}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh ref={earthRef}>
                <sphereGeometry args={[35.25, 32, 32]} />
                <meshPhongMaterial specularMap={specularMap} />
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    metalness={0.4}
                    roughness={0.7}
                />
            </mesh>
        </>
    );
}

interface DebrisProps {
    position: [number, number, number];
}

function Debris({ position }: DebrisProps) {
    return (
        <RigidBody position={position} linearVelocity={[
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
        ]}>
            <BallCollider args={[1.0]} />
            <mesh>
                <sphereGeometry args={[1.0, 8, 8]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.5} />
            </mesh>
        </RigidBody>
    );
}

function AsteroidWithPhysics({ position, onCollision, isSolid }: { position: [number, number, number], onCollision: () => void, isSolid: boolean }) {
    const gltf = useGLTF('/models/asteroid.gltf');
    const meshRef = useRef<THREE.Group>(null);
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    useEffect(() => {
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.metalness = 0.1;
                    material.roughness = 0.9;
                    material.color.setRGB(0.4, 0.4, 0.4);
                    material.needsUpdate = true;
                }
            }
        });
    }, [gltf]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            position={position}
            onCollisionEnter={onCollision}
            sensor={!isSolid}
        >
            <BallCollider args={[1.18]} sensor={!isSolid} />
            <primitive ref={meshRef} object={gltf.scene} scale={0.008} />
        </RigidBody>
    );
}

// Defense mode components

interface RocketTrajectoryPropsExtended {
    points: Array<{ x: number; y: number; z: number; t: number }>;
    currentTime: number;
    launchTime: number;
}

function RocketTrajectory({ points, currentTime, launchTime }: RocketTrajectoryPropsExtended) {
    if (!points || points.length === 0) return null;

    const positions = points.map(p => [
        (p.x / 1e7) * 50,
        (p.y / 1e7) * 50,
        (p.z / 1e7) * 50
    ] as [number, number, number]);

    // Buscar posición actual del cohete
    let currentPos = points[0];
    for (let i = 0; i < points.length; i++) {
        if (points[i].t <= currentTime) {
            currentPos = points[i];
        } else {
            break;
        }
    }

    const scaledPosition: [number, number, number] = [
        (currentPos.x / 1e7) * 50,
        (currentPos.y / 1e7) * 50,
        (currentPos.z / 1e7) * 50
    ];

    // Mostrar cohete solo si ya fue lanzado
    const isLaunched = currentTime >= launchTime;

    return (
        <>
            {/* Trayectoria azul del cohete */}
            <Line
                points={positions}
                color="#3b82f6"
                lineWidth={2}
                opacity={0.8}
                transparent
            />
            
            {/* Cohete - esfera azul */}
            {isLaunched && (
                <mesh position={scaledPosition}>
                    <sphereGeometry args={[4, 32, 32]} />
                    <meshStandardMaterial
                        color="#3b82f6"
                        emissive="#3b82f6"
                        emissiveIntensity={1.5}
                    />
                </mesh>
            )}
        </>
    );
}

interface SatelliteTrajectoryProps {
    satellite: {
        id: number;
        trajectory: Array<{ x: number; y: number; z: number; t: number }>;
        deploy_timestamp: number;
        detonation_timestamp: number;
    };
    currentTime: number;
}

function SatelliteTrajectory({ satellite, currentTime }: SatelliteTrajectoryProps) {
    if (!satellite.trajectory || satellite.trajectory.length === 0) return null;

    // Solo mostrar si ya fue desplegado
    const isDeployed = currentTime >= satellite.deploy_timestamp;
    if (!isDeployed) return null;

    const positions = satellite.trajectory.map(p => [
        (p.x / 1e7) * 50,
        (p.y / 1e7) * 50,
        (p.z / 1e7) * 50
    ] as [number, number, number]);

    // Buscar posición actual en la trayectoria
    let currentPos = satellite.trajectory[0];
    for (let i = 0; i < satellite.trajectory.length; i++) {
        if (satellite.trajectory[i].t <= currentTime) {
            currentPos = satellite.trajectory[i];
        } else {
            break;
        }
    }

    const scaledPosition: [number, number, number] = [
        (currentPos.x / 1e7) * 50,
        (currentPos.y / 1e7) * 50,
        (currentPos.z / 1e7) * 50
    ];

    return (
        <>
            {/* Trayectoria verde */}
            <Line
                points={positions}
                color="#22c55e"
                lineWidth={2}
                opacity={0.7}
                transparent
            />
            
            {/* Satélite verde - visible después del deploy */}
            <mesh position={scaledPosition}>
                <sphereGeometry args={[4, 32, 32]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={1.5}
                />
            </mesh>
        </>
    );
}

interface ExplosionProps {
    position: [number, number, number];
    startTime: number;
    currentTime: number;
}

function Explosion({ position, startTime, currentTime }: ExplosionProps) {
    const timeSinceExplosion = currentTime - startTime;
    const maxDuration = 5; // 5 seconds
    
    if (timeSinceExplosion < 0 || timeSinceExplosion > maxDuration) return null;

    const progress = timeSinceExplosion / maxDuration;
    const scale = 2 + progress * 8; // Expand from 2 to 10
    const opacity = Math.max(0, 1 - progress); // Fade out

    return (
        <mesh position={position} scale={scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
                color="#f97316"
                emissive="#ea580c"
                emissiveIntensity={2 - progress * 2}
                transparent
                opacity={opacity}
            />
        </mesh>
    );
}

function AsteroidModel({ position }: { position: [number, number, number] }) {
    const gltf = useGLTF('/models/asteroid.gltf');
    const meshRef = useRef<THREE.Group>(null);

    useEffect(() => {
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.metalness = 0.1;
                    material.roughness = 0.9;
                    material.color.setRGB(0.4, 0.4, 0.4);
                    material.needsUpdate = true;
                }
            }
        });
    }, [gltf]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });

    return <primitive ref={meshRef} object={gltf.scene} scale={0.0005} position={position} />;
}

function OrbitPath({ points }: { points: OrbitPoint[] }) {
    const lineRef = useRef<THREE.Line>(null!);

    useEffect(() => {
        if (points.length === 0 || !lineRef.current) return;

        const positions = new Float32Array(points.length * 3);
        points.forEach((point, i) => {
            positions[i * 3] = (point.x / 1e7) * 50;
            positions[i * 3 + 1] = (point.y / 1e7) * 50;
            positions[i * 3 + 2] = (point.z / 1e7) * 50;
        });

        const geometry = lineRef.current.geometry;
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );
        geometry.attributes.position.needsUpdate = true;
    }, [points]);

    return (
        <>
            <primitive object={new THREE.Line(
                new THREE.BufferGeometry(),
                new THREE.LineBasicMaterial({ 
                    color: "#3b82f6", 
                    opacity: 0.5, 
                    transparent: true 
                })
            )} ref={lineRef} />
        </>
    );
}

interface HUDProps {
    currentPoint: OrbitPoint | null;
    currentFrame: number;
    totalFrames: number;
    isPlaying: boolean;
    speed: number;
    hasCollided: boolean;
    cameraFollow: boolean;
    isDefenseMode: boolean;
    defenseData: any;
    onPlayPause: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onFrameChange: (frame: number) => void;
    onCameraFollowToggle: () => void;
    onToggleDefense: () => void;
}

function HUD({ currentPoint, currentFrame, totalFrames, isPlaying, speed, hasCollided, cameraFollow, isDefenseMode, defenseData, onPlayPause, onReset, onSpeedChange, onFrameChange, onCameraFollowToggle, onToggleDefense }: HUDProps) {
    const [hudPosition, setHudPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 });
    const [isControlsDragging, setIsControlsDragging] = useState(false);
    const [controlsDragStart, setControlsDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - hudPosition.x, y: e.clientY - hudPosition.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setHudPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
        if (isControlsDragging) {
            setControlsPosition({ x: e.clientX - controlsDragStart.x, y: e.clientY - controlsDragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsControlsDragging(false);
    };

    const handleControlsMouseDown = (e: React.MouseEvent) => {
        setIsControlsDragging(true);
        setControlsDragStart({ x: e.clientX - controlsPosition.x, y: e.clientY - controlsPosition.y });
    };

    return (
        <Html fullscreen>
            <div
                className="pointer-events-none absolute inset-0 flex flex-col p-6 text-white"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* Real-time data overlay - Top Right */}
                {currentPoint && (
                    <div className="ml-auto space-y-2 pointer-events-auto">
                        {/* Botón de modo defensa */}
                        <Button
                            onClick={onToggleDefense}
                            variant={isDefenseMode ? "default" : "outline"}
                            size="sm"
                            className={isDefenseMode ? "bg-blue-600 hover:bg-blue-700 w-full" : "w-full"}
                        >
                            {isDefenseMode ? (
                                <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Modo Defensa Activo
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Activar Defensa
                                </>
                            )}
                        </Button>
                        
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-xs">
                            <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
                                {isDefenseMode ? (
                                    <>
                                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                        Sistema de Defensa
                                    </>
                                ) : (
                                    'Datos en Tiempo Real'
                                )}
                            </h3>
                            <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Tiempo:</span>
                                <span className="font-mono">{(currentPoint.t / 86400).toFixed(2)} días</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Posición X:</span>
                                <span className="font-mono">{(currentPoint.x / 1e6).toFixed(2)} Mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Posición Y:</span>
                                <span className="font-mono">{(currentPoint.y / 1e6).toFixed(2)} Mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Posición Z:</span>
                                <span className="font-mono">{(currentPoint.z / 1e6).toFixed(2)} Mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Distancia:</span>
                                <span className="font-mono">{(Math.sqrt(currentPoint.x**2 + currentPoint.y**2 + currentPoint.z**2) / 1000).toFixed(0)} km</span>
                            </div>
                            {currentPoint.vx !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Velocidad:</span>
                                    <span className="font-mono">
                                        {(Math.sqrt(
                                            Math.pow(currentPoint.vx, 2) +
                                            Math.pow(currentPoint.vy || 0, 2) +
                                            Math.pow(currentPoint.vz || 0, 2)
                                        ) / 1000).toFixed(2)} km/s
                                    </span>
                                </div>
                            )}
                        
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCameraFollowToggle();
                                }}
                                className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${cameraFollow
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                    }`}
                            >
                                {cameraFollow ? 'Siguiendo meteorito' : 'Seguir meteorito'}
                            </button>
                        </div>
                        </div>
                    </div>
                )}

                {/* Bottom controls (Draggable) */}
                <div className="mt-auto pointer-events-auto">
                    <div
                        className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-md mx-auto"
                        style={{ transform: `translate(${controlsPosition.x}px, ${controlsPosition.y}px)` }}
                    >
                        <div
                            className="text-xs font-semibold text-gray-300 mb-3 cursor-move select-none text-center"
                            onMouseDown={handleControlsMouseDown}
                        >
                            Controles de Simulación
                        </div>
                        <div className="flex gap-3 items-center mb-4 flex-wrap">
                            <Button
                                onClick={onPlayPause}
                                size="sm"
                                variant={isPlaying ? 'secondary' : 'default'}
                                disabled={totalFrames === 0}
                            >
                                {isPlaying ? (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                        Pausar
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Iniciar
                                    </>
                                )}
                            </Button>
                            <Button onClick={onReset} variant="outline" size="sm" disabled={totalFrames === 0}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-300 mb-1 block">
                                    Velocidad: {speed}x
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.25"
                                    value={speed}
                                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                                    className="w-full"
                                    disabled={totalFrames === 0}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-300 mb-1 block">
                                    Posición en órbita
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max={totalFrames - 1}
                                    value={currentFrame}
                                    onChange={(e) => onFrameChange(Number(e.target.value))}
                                    className="w-full"
                                    disabled={totalFrames === 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Html>
    );
}

export default function Simulacion3D() {
    const [orbitData, setOrbitData] = useState<OrbitPoint[]>([]);
    const [metadata, setMetadata] = useState<KeplerAPIResponse['metadata'] | null>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(0.25);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCollided, setHasCollided] = useState(false);
    const [debrisPositions, setDebrisPositions] = useState<[number, number, number][]>([]);
    const [cameraFollow, setCameraFollow] = useState(false);
    const [showImpactModal, setShowImpactModal] = useState(false);
    const [enableAsteroidCollision, setEnableAsteroidCollision] = useState(false);
    
    // Defense mode states
    const [isDefenseMode, setIsDefenseMode] = useState(false);
    const [defenseData, setDefenseData] = useState<any>(null);
    const animationRef = useRef<number | undefined>(undefined);

    const handleCollision = () => {
        if (!hasCollided) {
            setHasCollided(true);
            setIsPlaying(false);
            setShowImpactModal(true);

            // Generar fragmentos de meteorito
            const fragments: [number, number, number][] = [];
            const asteroidPos = asteroidPosition;
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                const verticalAngle = (Math.PI * (i % 3)) / 3;
                const radius = (0.2 + Math.random() * 0.2) * 50;
                fragments.push([
                    asteroidPos[0] + Math.cos(angle) * Math.cos(verticalAngle) * radius,
                    asteroidPos[1] + Math.sin(angle) * Math.cos(verticalAngle) * radius,
                    asteroidPos[2] + Math.sin(verticalAngle) * radius
                ]);
            }
            setDebrisPositions(fragments);
            console.log('Collision detected! Generated', fragments.length, 'debris fragments');
        }
    };

    useEffect(() => {
        setIsLoading(true);
        const endpoint = isDefenseMode ? '/defensa-datos-3d' : '/keppler-data-3d';
        
        fetch(endpoint)
            .then((response) => response.json())
            .then((apiResponse: any) => {
                console.log('API Response:', apiResponse);

                if (isDefenseMode) {
                    // Defense mode data structure
                    setDefenseData(apiResponse);
                    
                    // Transform meteor trajectory data from x_m/y_m/z_m/time_sec to x/y/z/t format
                    const transformedMeteorData = apiResponse.data?.map((point: any) => ({
                        x: point.x_m,
                        y: point.y_m,
                        z: point.z_m,
                        t: point.time_sec,
                        vx: point.vx_m_s,
                        vy: point.vy_m_s,
                        vz: point.vz_m_s
                    })) || [];
                    
                    setOrbitData(transformedMeteorData);
                    setMetadata(apiResponse.metadata || {});
                    console.log('Defense data loaded:', apiResponse);
                    console.log('Transformed meteor trajectory points:', transformedMeteorData.length);
                    console.log('Rocket trajectory points:', apiResponse.rocket?.trajectory?.length || 0);
                    console.log('Satellites:', apiResponse.satellites?.length || 0);
                    
                    // Auto-start animation in defense mode
                    if (transformedMeteorData.length > 0) {
                        setIsPlaying(true);
                    }
                } else {
                    // Standard mode data structure
                    console.log('Data length:', apiResponse.data?.length);
                    if (apiResponse.data && apiResponse.data.length > 0) {
                        // Transform standard mode data from x_m/y_m/z_m/time_sec to x/y/z/t format
                        const transformedData = apiResponse.data.map((point: any) => ({
                            x: point.x_m,
                            y: point.y_m,
                            z: point.z_m,
                            t: point.time_sec,
                            vx: point.vx_m_s,
                            vy: point.vy_m_s,
                            vz: point.vz_m_s
                        }));
                        setOrbitData(transformedData);
                        setMetadata(apiResponse.metadata);
                        setDefenseData(null);
                        console.log('Orbit data set with', transformedData.length, 'points');
                    } else {
                        console.error('No data received from API');
                    }
                }
            })
            .catch(error => {
                console.error('Error loading data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [isDefenseMode]);

    useEffect(() => {
        if (isPlaying && orbitData.length > 0) {
            let lastTime = Date.now();
            const frameDelay = 50;

            const animate = () => {
                const currentTime = Date.now();
                const deltaTime = currentTime - lastTime;

                if (deltaTime >= frameDelay / speed) {
                    lastTime = currentTime;
                    setCurrentFrame((prev) => {
                        if (prev >= orbitData.length - 1) {
                            setIsPlaying(false);
                            return orbitData.length - 1;
                        }
                        return prev + 1;
                    });
                }
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, orbitData, speed]);

    // Force impact on last frame (only in non-defense mode)
    useEffect(() => {
        if (!isDefenseMode && orbitData.length > 0 && currentFrame === orbitData.length - 1 && !hasCollided) {
            handleCollision();
        }
    }, [currentFrame, orbitData, hasCollided, isDefenseMode]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setCurrentFrame(0);
        setIsPlaying(false);
        setHasCollided(false);
        setDebrisPositions([]);
        setShowImpactModal(false);
        setEnableAsteroidCollision(false);
    };

    const handleToggleDefense = () => {
        setIsDefenseMode(!isDefenseMode);
        setCurrentFrame(0);
        setIsPlaying(false);
        setHasCollided(false);
        setDebrisPositions([]);
        setShowImpactModal(false);
        setEnableAsteroidCollision(false);
    };

    // Called by Earth sensor when the asteroid is within proximity
    const handleAsteroidNear = () => {
        if (!enableAsteroidCollision) {
            setEnableAsteroidCollision(true);
            console.log('Earth sensor: asteroid near — enabling asteroid collisions');
        }
    };

    const currentPoint = orbitData.length > 0 ? orbitData[currentFrame] : null;
    const asteroidPosition: [number, number, number] = currentPoint
        ? [(currentPoint.x / 1e7) * 50, (currentPoint.y / 1e7) * 50, (currentPoint.z / 1e7) * 50]
        : [500, 0, 0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulación 3D" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card className="flex-1">
                    <CardContent className="p-0 h-full relative">
                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[500px]">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-semibold">Cargando datos orbitales...</p>
                                    <p className="text-sm text-muted-foreground">Obteniendo datos de simulación de Kepler</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[700px] bg-black rounded-lg">
                                <Canvas>
                                    <ambientLight intensity={1.5} />
                                    <Stars radius={500} depth={100} count={10000} factor={6} saturation={0} fade speed={1} />

                                    {orbitData.length > 0 && (
                                        <OrbitPath points={orbitData} />
                                    )}

                                    {/* Defense mode visualizations */}
                                    {isDefenseMode && defenseData && (
                                        <>
                                            {defenseData.rocket?.trajectory && (
                                                <RocketTrajectory 
                                                    points={defenseData.rocket.trajectory}
                                                    currentTime={currentPoint?.t || 0}
                                                    launchTime={defenseData.rocket.launch_timestamp || 0}
                                                />
                                            )}
                                            
                                            {defenseData.satellites && defenseData.satellites.map((sat: any) => (
                                                <SatelliteTrajectory
                                                    key={sat.id}
                                                    satellite={sat}
                                                    currentTime={currentPoint?.t || 0}
                                                />
                                            ))}

                                            {defenseData.satellites && defenseData.satellites.map((sat: any) => {
                                                const lastPos = sat.trajectory[sat.trajectory.length - 1];
                                                return lastPos && currentPoint && currentPoint.t >= sat.detonation_timestamp ? (
                                                    <Explosion
                                                        key={`explosion-${sat.id}`}
                                                        position={[
                                                            (lastPos.x / 1e7) * 50,
                                                            (lastPos.y / 1e7) * 50,
                                                            (lastPos.z / 1e7) * 50
                                                        ]}
                                                        startTime={sat.detonation_timestamp}
                                                        currentTime={currentPoint.t}
                                                    />
                                                ) : null;
                                            })}
                                        </>
                                    )}

                                    <Physics gravity={[0, 0, 0]}>
                                        <RigidBody type="fixed" position={[0, 0, 0]}>
                                            <BallCollider args={[35.25]} />
                                            {/* Proximity sensor: when an asteroid enters this region, enable asteroid physical collisions */}
                                            <BallCollider args={[36.5]} sensor onIntersectionEnter={() => handleAsteroidNear()} />
                                            <EarthSmall />
                                        </RigidBody>

                                        {!hasCollided && currentPoint && (
                                            <AsteroidWithPhysics
                                                position={asteroidPosition}
                                                onCollision={handleCollision}
                                                isSolid={enableAsteroidCollision}
                                            />
                                        )}

                                        {hasCollided && debrisPositions.map((pos, i) => (
                                            <Debris key={i} position={pos} />
                                        ))}
                                    </Physics>

                                    <HUD
                                        currentPoint={currentPoint}
                                        currentFrame={currentFrame}
                                        totalFrames={orbitData.length}
                                        isPlaying={isPlaying}
                                        speed={speed}
                                        hasCollided={hasCollided}
                                        cameraFollow={cameraFollow}
                                        isDefenseMode={isDefenseMode}
                                        defenseData={defenseData}
                                        onPlayPause={handlePlayPause}
                                        onReset={handleReset}
                                        onSpeedChange={setSpeed}
                                        onFrameChange={(frame) => {
                                            setCurrentFrame(frame);
                                            setIsPlaying(false);
                                        }}
                                        onCameraFollowToggle={() => setCameraFollow(!cameraFollow)}
                                        onToggleDefense={handleToggleDefense}
                                    />

                                    <OrbitControls
                                        enableZoom={true}
                                        enablePan={true}
                                        enableRotate={true}
                                        minDistance={100}
                                        maxDistance={5000}
                                        target={cameraFollow && currentPoint ? [
                                            (currentPoint.x_m / 1e7) * 50,
                                            (currentPoint.y_m / 1e7) * 50,
                                            (currentPoint.z_m / 1e7) * 50
                                        ] : [0, 0, 0]}
                                    />
                                </Canvas>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={showImpactModal} onOpenChange={setShowImpactModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            {isDefenseMode && defenseData ? (
                                defenseData.metadata?.destroyed ? (
                                    <>
                                        <DialogTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
                                            <Shield className="w-6 h-6" />
                                            Defensa Exitosa
                                        </DialogTitle>
                                        <DialogDescription className="text-base pt-4">
                                            El sistema de defensa ha destruido exitosamente el asteroide amenazante.
                                            <br /><br />
                                            Los satélites interceptores detonaron en el momento preciso, fragmentando el objeto y desviando los escombros de una trayectoria de colisión directa con la Tierra.
                                            <br /><br />
                                            <span className="font-semibold text-green-600">¡El planeta está a salvo!</span>
                                        </DialogDescription>
                                    </>
                                ) : (
                                    <>
                                        <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                                            <AlertTriangle className="w-6 h-6" />
                                            Defensa Fallida
                                        </DialogTitle>
                                        <DialogDescription className="text-base pt-4">
                                            El sistema de defensa no logró detener el asteroide.
                                            <br /><br />
                                            A pesar de los esfuerzos, el objeto continuó su trayectoria y ha impactado con la Tierra, generando fragmentos que se dispersan por el espacio.
                                            <br /><br />
                                            <span className="font-semibold text-red-600">Este evento representa una amenaza significativa para el planeta.</span>
                                        </DialogDescription>
                                    </>
                                )
                            ) : (
                                <>
                                    <DialogTitle className="text-2xl font-bold text-red-600">Impacto Detectado</DialogTitle>
                                    <DialogDescription className="text-base pt-4">
                                        El meteorito ha impactado con la Tierra. La colisión ha generado fragmentos que se dispersan por el espacio.
                                        <br /><br />
                                        <span className="font-semibold">Este evento representa una amenaza significativa para el planeta.</span>
                                    </DialogDescription>
                                </>
                            )}
                        </DialogHeader>
                        <DialogFooter className="sm:justify-center">
                            <Button onClick={handleReset} className="w-full sm:w-auto">
                                Reiniciar Simulación
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
