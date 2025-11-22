import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Shield, Zap, Rocket, Satellite } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import SpaceshipModel from '@/components/SpaceshipModel';

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
        icon: Rocket,
        color: 'from-red-500 to-orange-500',
        modelPath: '/models/spaceship.gltf',
    },
    {
        id: 2,
        title: 'Deflexión por Impacto',
        description: 'Cambio de trayectoria mediante colisión controlada',
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
        modelPath: '/models/spaceship.gltf',
    },
    {
        id: 3,
        title: 'Tractores Gravitacionales',
        description: 'Uso de gravedad artificial para desviar objetos',
        icon: Satellite,
        color: 'from-purple-500 to-pink-500',
        modelPath: '/models/spaceship.gltf',
    },
    {
        id: 4,
        title: 'Sistema de Alerta Temprana',
        description: 'Detección y seguimiento de amenazas espaciales',
        icon: Shield,
        color: 'from-green-500 to-emerald-500',
        modelPath: '/models/spaceship.gltf',
    },
    {
        id: 5,
        title: 'Láser de Alta Potencia',
        description: 'Vaporización de superficie para alterar trayectoria',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        modelPath: '/models/spaceship.gltf',
    },
    {
        id: 6,
        title: 'Explosión Nuclear',
        description: 'Detonación controlada para fragmentar o desviar',
        icon: Rocket,
        color: 'from-red-600 to-rose-500',
        modelPath: '/models/spaceship.gltf',
    },
];

export default function ModelosDefensa() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modelos de Defensa" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Shield className="h-10 w-10 text-primary" />
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
                        const Icon = model.icon;
                        return (
                            <div
                                key={model.id}
                                className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300"
                            >
                                {/* 3D Model Canvas */}
                                <div className="relative h-64 bg-gradient-to-b from-gray-900 to-black">
                                    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                                        <Suspense fallback={
                                            <mesh>
                                                <boxGeometry args={[1, 1, 1]} />
                                                <meshStandardMaterial color="white" wireframe />
                                            </mesh>
                                        }>
                                            {/* Improved lighting setup */}
                                            <ambientLight intensity={1} />
                                            <directionalLight position={[5, 5, 5]} intensity={2} />
                                            <directionalLight position={[-5, -5, -5]} intensity={1} />
                                            <pointLight position={[0, 10, 0]} intensity={1.5} />
                                            
                                            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} />
                                            
                                            {/* Grid helper to see the space */}
                                            <gridHelper args={[10, 10]} position={[0, -2, 0]} />
                                            
                                            <SpaceshipModel 
                                                modelPath={model.modelPath}
                                                scale={1}
                                                position={[0, 0, 0]}
                                            />
                                            
                                            <OrbitControls 
                                                enableZoom={true}
                                                enablePan={true}
                                                minDistance={2}
                                                maxDistance={15}
                                            />
                                        </Suspense>
                                    </Canvas>
                                </div>

                                {/* Info Section */}
                                <div className="p-6">
                                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${model.color} mb-4`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {model.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {model.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
