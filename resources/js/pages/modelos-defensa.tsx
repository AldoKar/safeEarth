import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
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
    },
    {
        id: 2,
        title: 'Deflexión por Impacto',
        description: 'Cambio de trayectoria mediante colisión controlada',
        modelPath: '/models/rocket.gltf',
    },
    {
        id: 3,
        title: 'Tractores Gravitacionales',
        description: 'Uso de gravedad artificial para desviar objetos',
        modelPath: '/models/rocket.gltf',
    },
    {
        id: 4,
        title: 'Sistema de Alerta Temprana',
        description: 'Detección y seguimiento de amenazas espaciales',
        modelPath: '/models/rocket.gltf',
    },
    {
        id: 5,
        title: 'Láser de Alta Potencia',
        description: 'Vaporización de superficie para alterar trayectoria',
        modelPath: '/models/rocket.gltf',
    },
    {
        id: 6,
        title: 'Explosión Nuclear',
        description: 'Detonación controlada para fragmentar o desviar',
        modelPath: '/models/rocket.gltf',
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {defenseModels.map((model) => {
                        return (
                            <div
                                key={model.id}
                                className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300"
                            >
                                {/* 3D Model Canvas */}
                                <div className="relative h-64 bg-black">
                                    <Canvas camera={{ position: [0, 0, 10]}}>
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
                                    
                                            {model.id === 1 && (
                                                <SpaceshipModel 
                                                    modelPath={model.modelPath}
                                                    scale={0.05}
                                                    position={[0, -1, 0]}
                                                    rotate={true}
                                                />
                                            )}
                                            
                                            <OrbitControls 
                                                enableZoom={true}
                                                enablePan={true}
                                                target={[0, 0, 0]}
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
                                    <Button className="w-full">
                                        Usar en Simulación
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
