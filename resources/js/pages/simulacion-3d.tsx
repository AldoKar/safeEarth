import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

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

function AsteroidModel() {
    const gltf = useGLTF('/models/asteroid.gltf');

    useEffect(() => {
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.metalness = 0.1;
                    material.roughness = 0.9;
                    // Gray color
                    material.color.setRGB(0.4, 0.4, 0.4);
                    material.needsUpdate = true;
                }
            }
        });
    }, [gltf]);

    return <primitive object={gltf.scene} scale={0.025} />;
}

export default function Simulacion3D() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Simulación 3D" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 p-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Simulación 3D - Asteroide
                    </h1>
                    <div className="w-full h-[600px] bg-black rounded-lg overflow-hidden">
                        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>

                            <Stars />
                           
                            <directionalLight position={[10, 10, 5]} intensity={.2} />
                            <pointLight position={[-10, -10, -5]} intensity={10} />
                            <AsteroidModel />
                            <OrbitControls 
                                enableZoom={true}
                                enablePan={true}
                                enableRotate={true}
                                minDistance={2}
                                maxDistance={10}
                            />
                        </Canvas>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
