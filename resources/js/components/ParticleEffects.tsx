import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DebrisFieldProps {
    count?: number;
    radius?: number;
}

export function DebrisField({ count = 200, radius = 50 }: DebrisFieldProps) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        if (!mesh.current) return;
        
        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            
            mesh.current?.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshPhongMaterial color="#ff4500" emissive="#ff0000" emissiveIntensity={0.5} />
        </instancedMesh>
    );
}

interface ExplosionParticlesProps {
    position: [number, number, number];
    count?: number;
}

export function ExplosionParticles({ position, count = 100 }: ExplosionParticlesProps) {
    const mesh = useRef<THREE.Points>(null);
    
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const velocities = [];
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = position[0];
            positions[i * 3 + 1] = position[1];
            positions[i * 3 + 2] = position[2];
            
            velocities.push({
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 0.5,
            });
        }
        
        return { positions, velocities };
    }, [count, position]);

    useFrame(() => {
        if (!mesh.current) return;
        
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] += particles.velocities[i].x;
            positions[i * 3 + 1] += particles.velocities[i].y;
            positions[i * 3 + 2] += particles.velocities[i].z;
        }
        
        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                    args={[particles.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.1}
                color="#ff4500"
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

interface ShockwaveProps {
    position: [number, number, number];
    maxRadius?: number;
}

export function Shockwave({ position, maxRadius = 10 }: ShockwaveProps) {
    const mesh = useRef<THREE.Mesh>(null);
    const [radius, setRadius] = useState(0.1);

    useFrame(() => {
        if (!mesh.current) return;
        
        setRadius((r: number) => Math.min(r + 0.2, maxRadius));
        
        if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
            mesh.current.material.opacity = 1 - (radius / maxRadius);
        }
    });

    return (
        <mesh ref={mesh} position={position} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.5, 32]} />
            <meshBasicMaterial
                color="#ff0000"
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
