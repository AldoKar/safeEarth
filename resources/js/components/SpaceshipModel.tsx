import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceshipModelProps {
    modelPath: string;
    scale?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
    rotate?: boolean;
}

export default function SpaceshipModel({ 
    modelPath, 
    scale = 1, 
    rotation = [0, 0, 0],
    position = [0, 0, 0],
    rotate = false
}: SpaceshipModelProps) {
    const gltf = useGLTF(modelPath);
    const meshRef = useRef<THREE.Group>(null);

    useEffect(() => {
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    material.metalness = 0.1;
                    material.roughness = 0.9;
                    // White color
                    material.color.setRGB(1, 1, 1);
                    material.needsUpdate = true;
                }
            }
        });
    }, [gltf]);

    useFrame(() => {
        if (rotate && meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={meshRef} scale={scale} rotation={rotation} position={position}>
            <primitive object={gltf.scene} />
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/spaceship.gltf');

// Preload the model
useGLTF.preload('/resources/assets/DefenseModels/spaceship.gltf');
