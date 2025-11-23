import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stars } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Physics, RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
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
    time_sec: number;
    x_m: number;
    y_m: number;
    z_m: number;
    r_m: number;
}

interface KeplerAPIResponse {
    metadata: {
        saved_points: number;
        total_recorded_points: number;
        requested_max_points: number;
        destroyed: boolean;
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
                <sphereGeometry args={[0.705, 32, 32]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    opacity={0.4}
                    depthWrite={true}
                    transparent={true}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh ref={earthRef}>
                <sphereGeometry args={[0.705, 32, 32]} />
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
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ]}>
            <CuboidCollider args={[0.02, 0.02, 0.02]} />
            <mesh>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#666" />
            </mesh>
        </RigidBody>
    );
}

function AsteroidWithPhysics({ position, onCollision }: { position: [number, number, number], onCollision: () => void }) {
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
        >
            <CuboidCollider args={[0.05, 0.05, 0.05]} />
            <primitive ref={meshRef} object={gltf.scene} scale={0.0005} />
        </RigidBody>
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
    const lineRef = useRef<THREE.Line>(null);

    useEffect(() => {
        if (points.length === 0) return;

        const positions = new Float32Array(points.length * 3);
        points.forEach((point, i) => {
            positions[i * 3] = point.x_m / 1e7;
            positions[i * 3 + 1] = point.y_m / 1e7;
            positions[i * 3 + 2] = (point.z_m || 0) / 1e7 + 3;
        });

        if (lineRef.current) {
            lineRef.current.geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(positions, 3)
            );
        }
    }, [points]);

    return (
        <line ref={lineRef}>
            <bufferGeometry />
            <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
        </line>
    );
}

export default function Simulacion3D() {
    const [orbitData, setOrbitData] = useState<OrbitPoint[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCollided, setHasCollided] = useState(false);
    const [debrisPositions, setDebrisPositions] = useState<[number, number, number][]>([]);
    const animationRef = useRef<number | undefined>(undefined);

    const handleCollision = () => {
        if (!hasCollided) {
            setHasCollided(true);
            setIsPlaying(false);
            
            // Generar fragmentos de meteorito
            const fragments: [number, number, number][] = [];
            const asteroidPos = asteroidPosition;
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const radius = 0.3;
                fragments.push([
                    asteroidPos[0] + Math.cos(angle) * radius,
                    asteroidPos[1] + Math.sin(angle) * radius,
                    asteroidPos[2] + (Math.random() - 0.5) * radius
                ]);
            }
            setDebrisPositions(fragments);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetch('/keppler-data')
            .then((response) => response.json())
            .then((apiResponse: KeplerAPIResponse) => {
                if (apiResponse.data && apiResponse.data.length > 0) {
                    setOrbitData(apiResponse.data);
                }
            })
            .catch(error => {
                console.error('Error loading Kepler data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

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

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setCurrentFrame(0);
        setIsPlaying(false);
    };

    const currentPoint = orbitData.length > 0 ? orbitData[currentFrame] : null;
    const asteroidPosition: [number, number, number] = currentPoint
        ? [currentPoint.x_m / 1e7, currentPoint.y_m / 1e7, (currentPoint.z_m || 0) / 1e7 + 3]
        : [3, 1, 3];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulación 3D" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Simulación Orbital 3D
                                </CardTitle>
                                <CardDescription>
                                    Órbita del meteorito según las leyes de Kepler
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {currentFrame === orbitData.length - 1 && orbitData.length > 0 && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        ⚠️ IMPACTO
                                    </Badge>
                                )}
                                <Badge variant="secondary">
                                    Frame {currentFrame + 1} / {orbitData.length}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
                    <div className="lg:col-span-3">
                        <Card className="h-full">
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
                                    <div className="w-full h-full min-h-[500px] bg-black rounded-lg">
                                        <Canvas>
                                            <ambientLight intensity={1.5} />
                                            <Stars />
                                            
                                            {orbitData.length > 0 && (
                                                <OrbitPath points={orbitData} />
                                            )}
                                            
                                            <Physics gravity={[0, 0, 0]}>
                                                <RigidBody type="fixed" position={[0, 0, 3]}>
                                                    <CuboidCollider args={[0.705, 0.705, 0.705]} />
                                                    <EarthSmall />
                                                </RigidBody>
                                                
                                                {!hasCollided && (
                                                    <AsteroidWithPhysics 
                                                        position={asteroidPosition} 
                                                        onCollision={handleCollision}
                                                    />
                                                )}
                                                
                                                {hasCollided && debrisPositions.map((pos, i) => (
                                                    <Debris key={i} position={pos} />
                                                ))}
                                            </Physics>
                                            
                                            <OrbitControls 
                                                enableZoom={true}
                                                enablePan={true}
                                                enableRotate={true}
                                                minDistance={2}
                                                maxDistance={20}
                                            />
                                        </Canvas>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Controles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handlePlayPause}
                                        className="flex-1"
                                        variant={isPlaying ? 'secondary' : 'default'}
                                        disabled={isLoading || orbitData.length === 0}
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
                                    <Button onClick={handleReset} variant="outline" disabled={isLoading || orbitData.length === 0}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </Button>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm text-muted-foreground mb-2 block">
                                        Velocidad: {speed}x
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={speed}
                                        onChange={(e) => setSpeed(Number(e.target.value))}
                                        className="w-full"
                                        disabled={isLoading}
                                    />
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm text-muted-foreground mb-2 block">
                                        Posición en órbita
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={orbitData.length - 1}
                                        value={currentFrame}
                                        onChange={(e) => {
                                            setCurrentFrame(Number(e.target.value));
                                            setIsPlaying(false);
                                        }}
                                        className="w-full"
                                        disabled={isLoading || orbitData.length === 0}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {currentPoint && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Datos Actuales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Tiempo</p>
                                        <p className="text-sm font-mono">
                                            {(currentPoint.time_sec / 86400).toFixed(2)} días
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Posición X (Mm)</p>
                                        <p className="text-sm font-mono">
                                            {(currentPoint.x_m / 1e6).toFixed(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Posición Y (Mm)</p>
                                        <p className="text-sm font-mono">
                                            {(currentPoint.y_m / 1e6).toFixed(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Posición Z (Mm)</p>
                                        <p className="text-sm font-mono">
                                            {(currentPoint.z_m / 1e6).toFixed(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Distancia (km)</p>
                                        <p className="text-sm font-mono">
                                            {(currentPoint.r_m / 1000).toFixed(0)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Leyenda</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#2b7da8]"></div>
                                    <span className="text-sm">Tierra</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                                    <span className="text-sm">Asteroide</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-1 bg-[#3b82f6] opacity-50"></div>
                                    <span className="text-sm">Trayectoria orbital</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
