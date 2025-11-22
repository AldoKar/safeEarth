import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

interface SpaceshipModelProps {
    modelPath: string;
    scale?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
}

export default function SpaceshipModel({ 
    modelPath, 
    scale = 1, 
    rotation = [0, 0, 0],
    position = [0, 0, 0]
}: SpaceshipModelProps) {
    const gltf = useGLTF(modelPath);

    useEffect(() => {
        // Fix missing textures by applying a default material
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Replace material if texture is missing
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    
                    materials.forEach((mat) => {
                        // If texture loading failed, use a solid color
                        if (mat.map && !mat.map.image) {
                            mat.map = null;
                            mat.color = new THREE.Color(0x888888); // Gray color
                        }
                        
                        // Ensure material responds to lights
                        if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.metalness = 0.6;
                            mat.roughness = 0.4;
                        }
                        
                        mat.needsUpdate = true;
                    });
                }
                
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [gltf.scene]);

    return (
        <group scale={scale} rotation={rotation} position={position}>
            <primitive object={gltf.scene} />
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/spaceship.gltf');

// Preload the model
useGLTF.preload('/resources/assets/DefenseModels/spaceship.gltf');
