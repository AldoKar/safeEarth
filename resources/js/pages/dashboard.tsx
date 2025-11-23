import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Map } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Earth from '../../assets/Planets/Earth';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const [simulationMode, setSimulationMode] = useState<'3D' | '2D'>('3D');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 gap-4 p-4">
                {/* Welcome Box */}
                <div className="relative w-80 overflow-hidden rounded-xl border border-sidebar-border/70 dark:bg-gray-900 dark:border-sidebar-border p-8 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Bienvenido, {auth.user.name}
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-300">
                            Sistema de Simulación SafeEarth
                        </p>
                    </div>
                </div>

                {/* Large Earth Canvas */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-black">
                    <Canvas
                        camera={{ position: [0, 0, 5]}}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            {/* Lighting */}
                            
                            <directionalLight position={[5, 3, 5]} intensity={2} />
                            
                            {/* Stars background */}
                            <Stars radius={300} depth={60} count={5000} factor={7} saturation={0} />
                            
                            {/* Earth component */}
                            <Earth />
                            
                            {/* Controls */}
                            <OrbitControls 
                                enableZoom={true}
                                enablePan={true}
                                minDistance={3}
                                maxDistance={10}
                            />
                        </Suspense>
                    </Canvas>
                </div>
            </div>
        </AppLayout>
    );
}
