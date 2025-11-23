import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import SpaceshipModel from '@/components/SpaceshipModel';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Modelos de Defensa',
        href: '/modelos-defensa',
    },
];

const defenseModels = [
    {
        id: 1,
        title: 'Sistema de Interceptación',
        description: 'Tecnología de misiles para interceptar asteroides',
        modelPath: '/models/rocket.gltf',
        scale: 0.05,
        position: [2, -3, 0] as [number, number, number],
        cameraPosition: [0, 0, 10] as [number, number, number],
        target: [0, -1, 0] as [number, number, number],
    },
    {
        id: 2,
        title: 'Deflexión por Impacto',
        description: 'Cambio de trayectoria mediante colisión controlada',
        modelPath: '/models/spaceship.gltf',
        scale: .01,
        position: [-10, -5, -25] as [number, number, number],
        cameraPosition: [0, 0, 10] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
    },
    {
        id: 3,
        title: 'Tractores Gravitacionales',
        description: 'Uso de gravedad artificial para desviar objetos',
        modelPath: '/models/satellite.gltf',
        scale: 0.6,
        position: [0, 0.5, 0] as [number, number, number],
        cameraPosition: [2, 1, 8] as [number, number, number],
        target: [0, 0.5, 0] as [number, number, number],
    },
];

export default function ModelosDefensa() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modelos de Defensa" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Modelos de Defensa Planetaria
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                            Sistemas de protección contra amenazas espaciales
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {defenseModels.map((model) => {
                        return (
                            <div
                                key={model.id}
                                className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300"
                            >
                                {/* 3D Model Canvas */}
                                <div className="relative h-64 bg-black">
                                    <Canvas camera={{ position: model.cameraPosition }}>
                                        <Suspense fallback={
                                            <mesh>
                                                <boxGeometry args={[1, 1, 1]} />
                                                <meshStandardMaterial color="white" wireframe />
                                            </mesh>
                                        }>
                                            {/* Improved lighting setup */}
                                            <ambientLight intensity={2} />
                                            <directionalLight position={[5, 5, 5]} intensity={3} />
                                            <directionalLight position={[-5, -5, -5]} intensity={2} />
                                            <pointLight position={[0, 10, 0]} intensity={2} />
                                    
                                            {/* Grid */}
                                            <Grid 
                                                args={[20, 20]}
                                                cellSize={0.5}
                                                cellThickness={0.5}
                                                cellColor="#6b7280"
                                                sectionSize={2}
                                                sectionThickness={1}
                                                sectionColor="#9ca3af"
                                                fadeDistance={25}
                                                fadeStrength={1}
                                                followCamera={false}
                                                infiniteGrid={false}
                                            />

                                            {(model.id === 1 || model.id === 2 || model.id === 3) && (
                                                <SpaceshipModel 
                                                    modelPath={model.modelPath}
                                                    scale={model.scale}
                                                    position={model.position}
                                                    rotate={false}
                                                />
                                            )}
                                            
                                            <OrbitControls 
                                                enableZoom={true}
                                                enablePan={true}
                                                target={model.target}
                                                minDistance={0.5}
                                                maxDistance={20}
    
                            
                                            />
                                        </Suspense>
                                    </Canvas>
                                </div>

                                {/* Info Section */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {model.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {model.description}
                                    </p>
                                    <Link href="/simulacion-3d">
                                        <Button className="w-full">
                                            Usar en Simulación
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
