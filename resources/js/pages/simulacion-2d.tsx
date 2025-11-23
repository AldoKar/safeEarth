import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
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
import * as THREE from 'three';
import EarthDayMap from '@/../../resources/assets/textures/8k_earth_daymap.jpg';
import EarthNormalMap from '@/../../resources/assets/textures/8k_earth_normal_map.jpg';
import EarthSpecularMap from '@/../../resources/assets/textures/8k_earth_specular_map.jpg';
import EarthCloudsMap from '@/../../resources/assets/textures/8k_earth_clouds.jpg';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Simulación 2D',
        href: '/simulacion-2d',
    },
];

interface OrbitPoint {
    time: number;
    x_orb: number;
    y_orb: number;
    'r(t)': number;
}

interface KeplerData {
    [key: string]: OrbitPoint[];
}

export default function Simulacion2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const earth3DRef = useRef<HTMLDivElement>(null);
    const [orbitData, setOrbitData] = useState<OrbitPoint[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const animationRef = useRef<number | undefined>(undefined);
    const threeSceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        earthMesh: THREE.Mesh;
        cloudsMesh: THREE.Mesh;
    } | null>(null);

    // Inicializar escena 3D de la Tierra
    useEffect(() => {
        const container = earth3DRef.current;
        if (!container) return;

        // Crear escena
        const scene = new THREE.Scene();
        
        // Crear cámara
        const camera = new THREE.PerspectiveCamera(
            45,
            1, 
            0.1,
            1000
        );
        camera.position.set(0, 0, 3);

        // Crear renderer
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        const size = 40;
        renderer.setSize(size, size);
        renderer.setClearColor(0x000000, 0); // Transparente
        container.appendChild(renderer.domElement);

        // Luz principal más intensa
        const light = new THREE.PointLight(0xffffff, 4, 100);
        light.position.set(5, 0, 5);
        scene.add(light);

        // Luz ambiental más brillante
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        // Luz de relleno adicional
        const fillLight = new THREE.PointLight(0xaabbff, 1, 100);
        fillLight.position.set(-5, 0, 3);
        scene.add(fillLight);

        // Cargar texturas
        const textureLoader = new THREE.TextureLoader();
        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);

        // Crear mesh de la Tierra con más brillo
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load(EarthDayMap),
            normalMap: textureLoader.load(EarthNormalMap),
            metalnessMap: textureLoader.load(EarthSpecularMap),
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x111111,
            emissiveIntensity: 0.2,
        });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        earthMesh.rotation.z = -0.3;
        scene.add(earthMesh);

        // Crear mesh de nubes
        const cloudGeometry = new THREE.SphereGeometry(1.01, 32, 32);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load(EarthCloudsMap),
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const cloudsMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudsMesh.rotation.z = -0.3;
        scene.add(cloudsMesh);

        // Guardar referencia
        threeSceneRef.current = {
            scene,
            camera,
            renderer,
            earthMesh,
            cloudsMesh,
        };

        // Animación de rotación
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            earthMesh.rotation.y += 0.001;
            cloudsMesh.rotation.y += 0.0012;
            
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            renderer.dispose();
            earthGeometry.dispose();
            cloudGeometry.dispose();
            earthMaterial.dispose();
            cloudMaterial.dispose();
            container.removeChild(renderer.domElement);
            threeSceneRef.current = null;
        };
    }, []);

    useEffect(() => {
        // Cargar datos de la simulación
        fetch('/kepler_simulation.json')
            .then((response) => response.json())
            .then((data: KeplerData) => {
                const points: OrbitPoint[] = [];
                Object.keys(data)
                    .sort(
                        (a, b) =>
                            parseInt(a.split(':')[1]) -
                            parseInt(b.split(':')[1]),
                    )
                    .forEach((key) => {
                        points.push(data[key][0]);
                    });
                setOrbitData(points);
            });
    }, []);

    useEffect(() => {
        if (orbitData.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configurar tamaño del canvas
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                drawSimulation();
            }
        };

        const drawSimulation = () => {
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;

            // Limpiar canvas con fondo espacial
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                // Fondo negro espacial
                ctx.fillStyle = '#0a0a0f';
                ctx.fillRect(0, 0, width, height);
                
                // Añadir estrellas
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 100; i++) {
                    const x = (i * 7919) % width;
                    const y = (i * 3571) % height;
                    const size = ((i * 13) % 3) * 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = '#f5f5f7';
                ctx.fillRect(0, 0, width, height);
            }

            // Encontrar escala con zoom in para ver más cerca
            const maxDistance = Math.max(
                ...orbitData.map((p) => Math.abs(p.x_orb)),
                ...orbitData.map((p) => Math.abs(p.y_orb)),
            );
            const scale = Math.min(width, height) / (2 * maxDistance) / 0.8; 

            // Centro del canvas
            const centerX = width / 2;
            const centerY = height / 2;

            // Dibujar órbita completa con gradiente
            const orbitGradient = ctx.createLinearGradient(
                centerX - maxDistance * scale,
                centerY,
                centerX + maxDistance * scale,
                centerY
            );
            orbitGradient.addColorStop(0, 'rgba(100, 100, 100, 0.3)');
            orbitGradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.5)');
            orbitGradient.addColorStop(1, 'rgba(100, 100, 100, 0.3)');
            ctx.strokeStyle = orbitGradient;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            orbitData.forEach((point, index) => {
                const x = centerX + point.x_orb * scale;
                const y = centerY - point.y_orb * scale;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);

            // La Tierra 3D se renderiza en un div superpuesto
            const earthRadius = 20; // Radio de referencia
            
            // Atmósfera (glow azul suave alrededor de la Tierra 3D)
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(100, 180, 255, 0.5)';
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, earthRadius + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Dibujar trayectoria recorrida con efecto de desvanecimiento
            if (currentFrame > 0) {
                // Gradiente de la trayectoria
                const pathGradient = ctx.createLinearGradient(
                    centerX + orbitData[0].x_orb * scale,
                    centerY - orbitData[0].y_orb * scale,
                    centerX + orbitData[currentFrame].x_orb * scale,
                    centerY - orbitData[currentFrame].y_orb * scale
                );
                pathGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                pathGradient.addColorStop(1, 'rgba(59, 130, 246, 1)');
                
                ctx.strokeStyle = pathGradient;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                for (let i = 0; i <= currentFrame && i < orbitData.length; i++) {
                    const point = orbitData[i];
                    const x = centerX + point.x_orb * scale;
                    const y = centerY - point.y_orb * scale;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
                
                // Añadir puntos de seguimiento cada ciertos frames
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                for (let i = 0; i <= currentFrame && i < orbitData.length; i += 5) {
                    const point = orbitData[i];
                    const x = centerX + point.x_orb * scale;
                    const y = centerY - point.y_orb * scale;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Dibujar meteorito en posición actual
            if (currentFrame < orbitData.length) {
                const currentPoint = orbitData[currentFrame];
                const x = centerX + currentPoint.x_orb * scale;
                const y = centerY - currentPoint.y_orb * scale;

                // Línea a la Tierra (radio vector) - dibujada primero
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 6]);
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Estela del meteorito
                if (currentFrame > 0) {
                    const tailLength = Math.min(5, currentFrame);
                    for (let i = 1; i <= tailLength; i++) {
                        const tailPoint = orbitData[currentFrame - i];
                        const tx = centerX + tailPoint.x_orb * scale;
                        const ty = centerY - tailPoint.y_orb * scale;
                        const alpha = 1 - (i / tailLength);
                        const size = 6 * alpha;
                        
                        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(tx, ty, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Glow exterior del meteorito
                const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 16);
                outerGlow.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
                outerGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
                outerGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.fill();

                // Meteorito principal con gradiente
                const meteorGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 8);
                meteorGradient.addColorStop(0, '#ff6b6b');
                meteorGradient.addColorStop(0.7, '#ef4444');
                meteorGradient.addColorStop(1, '#dc2626');
                ctx.fillStyle = meteorGradient;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();

                // Borde brillante
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.stroke();

                // Información de distancia
                const distance = Math.sqrt(
                    Math.pow(currentPoint.x_orb, 2) + Math.pow(currentPoint.y_orb, 2)
                );
                const distanceKm = (distance / 1000).toFixed(0);
                ctx.fillStyle = isDark ? '#fff' : '#000';
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${distanceKm} km`, x, y - 20);
            }

            // Dibujar ejes de coordenadas con marcadores
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1;
            
            // Eje X con flechas
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            // Flecha derecha
            ctx.beginPath();
            ctx.moveTo(width - 10, centerY - 5);
            ctx.lineTo(width, centerY);
            ctx.lineTo(width - 10, centerY + 5);
            ctx.stroke();
            
            // Eje Y con flechas
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.stroke();
            // Flecha arriba
            ctx.beginPath();
            ctx.moveTo(centerX - 5, 10);
            ctx.lineTo(centerX, 0);
            ctx.lineTo(centerX + 5, 10);
            ctx.stroke();
            
            // Etiquetas de ejes
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('X', width - 5, centerY - 10);
            ctx.textAlign = 'center';
            ctx.fillText('Y', centerX + 15, 15);
            
            // Círculos de referencia de distancia
            const refDistances = [0.3, 0.6, 0.9];
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 0.5;
            refDistances.forEach(factor => {
                const radius = Math.min(width, height) / 2 * factor;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            });
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [orbitData, currentFrame]);

    useEffect(() => {
        if (isPlaying && orbitData.length > 0) {
            let lastTime = Date.now();
            const frameDelay = 50; // Delay en milisegundos entre frames
            
            const animate = () => {
                const currentTime = Date.now();
                const deltaTime = currentTime - lastTime;
                
                if (deltaTime >= frameDelay / speed) {
                    lastTime = currentTime;
                    setCurrentFrame((prev) => {
                        if (prev >= orbitData.length - 1) {
                            setIsPlaying(false);
                            return 0;
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

    const currentPoint =
        orbitData.length > 0 ? orbitData[currentFrame] : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulación 2D" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Simulación Orbital 2D
                                </CardTitle>
                                <CardDescription>
                                    Órbita del meteorito según las leyes de
                                    Kepler
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                Frame {currentFrame + 1} / {orbitData.length}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
                    <div className="lg:col-span-3">
                        <Card className="h-full">
                            <CardContent className="p-0 h-full relative">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full rounded-lg"
                                />
                                {/* Contenedor del modelo 3D de la Tierra - posicionado en el centro */}
                                <div
                                    ref={earth3DRef}
                                    className="absolute"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '40px',
                                        height: '40px',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Controles
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handlePlayPause}
                                        className="flex-1"
                                        variant={
                                            isPlaying ? 'secondary' : 'default'
                                        }
                                    >
                                        {isPlaying ? (
                                            <>
                                                <svg
                                                    className="w-4 h-4 mr-2"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                                </svg>
                                                Pausar
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-4 h-4 mr-2"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                Iniciar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
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
                                        onChange={(e) =>
                                            setSpeed(Number(e.target.value))
                                        }
                                        className="w-full"
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
                                            setCurrentFrame(
                                                Number(e.target.value),
                                            );
                                            setIsPlaying(false);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {currentPoint && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Datos Actuales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Tiempo (s)
                                        </p>
                                        <p className="text-sm font-mono">
                                            {currentPoint.time.toFixed(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Posición X (m)
                                        </p>
                                        <p className="text-sm font-mono">
                                            {currentPoint.x_orb.toExponential(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Posición Y (m)
                                        </p>
                                        <p className="text-sm font-mono">
                                            {currentPoint.y_orb.toExponential(2)}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Radio (m)
                                        </p>
                                        <p className="text-sm font-mono">
                                            {currentPoint['r(t)'].toExponential(
                                                2,
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Leyenda
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#4fa3d1] to-[#2b7da8] border border-blue-300"></div>
                                    <span className="text-sm">Tierra</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#ef4444]"></div>
                                    <span className="text-sm">Meteorito</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-1 bg-[#3b82f6]"></div>
                                    <span className="text-sm">
                                        Trayectoria recorrida
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-0.5 border-t-2 border-dashed"
                                        style={{ borderColor: '#666' }}
                                    ></div>
                                    <span className="text-sm">
                                        Órbita completa
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
