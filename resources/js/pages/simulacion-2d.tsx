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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    time_sec: number;
    x_m: number;
    y_m: number;
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

export default function Simulacion2D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [orbitData, setOrbitData] = useState<OrbitPoint[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(0.25);
    const [zoom, setZoom] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 });
    const [isControlsDragging, setIsControlsDragging] = useState(false);
    const [controlsDragStart, setControlsDragStart] = useState({ x: 0, y: 0 });
    const [showImpactModal, setShowImpactModal] = useState(false);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        // Cargar datos del endpoint de Kepler
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
                ...orbitData.map((p) => Math.abs(p.x_m)),
                ...orbitData.map((p) => Math.abs(p.y_m)),
            );
            const baseScale = Math.min(width, height) / (2 * maxDistance);
            const scale = baseScale * zoom;

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
                const x = centerX + point.x_m * scale;
                const y = centerY - point.y_m * scale;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);

            // Calcular tamaño real de la Tierra a escala
            const EARTH_RADIUS_M = 6.371e6; // Radio de la Tierra en metros
            const earthRadiusPixels = EARTH_RADIUS_M * scale; // Tamaño real a escala, sin mínimo forzado
            
            // Solo dibujar la Tierra si es visible (al menos 1 pixel)
            if (earthRadiusPixels >= 1) {
                // Atmósfera (glow azul suave)
                const earthGlow = ctx.createRadialGradient(
                    centerX, centerY, earthRadiusPixels, 
                    centerX, centerY, earthRadiusPixels * 1.5
                );
                earthGlow.addColorStop(0, 'rgba(100, 180, 255, 0.3)');
                earthGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
                ctx.fillStyle = earthGlow;
                ctx.beginPath();
                ctx.arc(centerX, centerY, earthRadiusPixels * 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Cuerpo de la Tierra
                const earthGradient = ctx.createRadialGradient(
                    centerX - earthRadiusPixels * 0.3,
                    centerY - earthRadiusPixels * 0.3,
                    earthRadiusPixels * 0.1,
                    centerX,
                    centerY,
                    earthRadiusPixels
                );
                earthGradient.addColorStop(0, '#6BA3D4');
                earthGradient.addColorStop(0.5, '#3B82F6');
                earthGradient.addColorStop(1, '#1E40AF');
                ctx.fillStyle = earthGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, earthRadiusPixels, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Si la Tierra es demasiado pequeña, dibújarla como un punto brillante
                ctx.fillStyle = '#3B82F6';
                ctx.shadowBlur = 3;
                ctx.shadowColor = '#60A5FA';
                ctx.beginPath();
                ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Dibujar trayectoria recorrida con efecto de desvanecimiento
            if (currentFrame > 0) {
                // Gradiente de la trayectoria
                const pathGradient = ctx.createLinearGradient(
                    centerX + orbitData[0].x_m * scale,
                    centerY - orbitData[0].y_m * scale,
                    centerX + orbitData[currentFrame].x_m * scale,
                    centerY - orbitData[currentFrame].y_m * scale
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
                    const x = centerX + point.x_m * scale;
                    const y = centerY - point.y_m * scale;
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
                    const x = centerX + point.x_m * scale;
                    const y = centerY - point.y_m * scale;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Dibujar meteorito en posición actual
            if (currentFrame < orbitData.length) {
                const currentPoint = orbitData[currentFrame];
                const x = centerX + currentPoint.x_m * scale;
                const y = centerY - currentPoint.y_m * scale;

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
                        const tx = centerX + tailPoint.x_m * scale;
                        const ty = centerY - tailPoint.y_m * scale;
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
                const distanceKm = (currentPoint.r_m / 1000).toFixed(0);
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
    }, [orbitData, currentFrame, zoom]);

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
                            setShowImpactModal(true);
                            return orbitData.length - 1; // Mantener en el último frame
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
        setShowImpactModal(false);
    };

    const handleControlsMouseDown = (e: React.MouseEvent) => {
        setIsControlsDragging(true);
        setControlsDragStart({ x: e.clientX - controlsPosition.x, y: e.clientY - controlsPosition.y });
    };

    const handleControlsMouseMove = (e: React.MouseEvent) => {
        if (isControlsDragging) {
            setControlsPosition({ x: e.clientX - controlsDragStart.x, y: e.clientY - controlsDragStart.y });
        }
    };

    const handleControlsMouseUp = () => {
        setIsControlsDragging(false);
    };

    const currentPoint =
        orbitData.length > 0 ? orbitData[currentFrame] : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulación 2D" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card className="flex-1">
                    <CardContent className="p-0 h-full relative">
                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[700px]">
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
                            <div className="relative w-full h-full min-h-[700px]">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full rounded-lg"
                                />
                                
                                {/* HUD Overlay */}
                                <div 
                                    className="absolute inset-0 flex flex-col p-6 text-white pointer-events-none"
                                    onMouseMove={handleControlsMouseMove}
                                    onMouseUp={handleControlsMouseUp}
                                >
                                    {/* Real-time data overlay - Top Right */}
                                    {currentPoint && (
                                        <div className="ml-auto bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-xs pointer-events-auto">
                                            <h3 className="font-bold mb-2 text-sm">Datos en Tiempo Real</h3>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Tiempo:</span>
                                                    <span className="font-mono">{(currentPoint.time_sec / 86400).toFixed(2)} días</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Posición X:</span>
                                                    <span className="font-mono">{(currentPoint.x_m / 1e6).toFixed(2)} Mm</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Posición Y:</span>
                                                    <span className="font-mono">{(currentPoint.y_m / 1e6).toFixed(2)} Mm</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Distancia:</span>
                                                    <span className="font-mono">{(currentPoint.r_m / 1000).toFixed(0)} km</span>
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
                                                ⋮⋮ Controles ⋮⋮
                                            </div>
                                            <div className="flex gap-3 items-center mb-4">
                                                <Button
                                                    onClick={handlePlayPause}
                                                    size="sm"
                                                    variant={isPlaying ? 'secondary' : 'default'}
                                                    disabled={orbitData.length === 0}
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
                                                <Button onClick={handleReset} variant="outline" size="sm" disabled={orbitData.length === 0}>
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
                                                        onChange={(e) => setSpeed(Number(e.target.value))}
                                                        className="w-full"
                                                        disabled={orbitData.length === 0}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-300 mb-1 block">
                                                        Zoom: {zoom.toFixed(1)}x
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0.5"
                                                        max="10"
                                                        step="0.5"
                                                        value={zoom}
                                                        onChange={(e) => setZoom(Number(e.target.value))}
                                                        className="w-full"
                                                        disabled={orbitData.length === 0}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-300 mb-1 block">
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
                                                        disabled={orbitData.length === 0}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={showImpactModal} onOpenChange={setShowImpactModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-red-600">Impacto Detectado</DialogTitle>
                            <DialogDescription className="text-base pt-4">
                                El meteorito ha impactado con la Tierra. La trayectoria orbital ha concluido en colisión.
                                <br /><br />
                                <span className="font-semibold">Este evento representa una amenaza significativa para el planeta.</span>
                            </DialogDescription>
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
