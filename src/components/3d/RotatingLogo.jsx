import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const SLogo = (props) => {
    const group = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        group.current.rotation.y = Math.sin(t * 0.5) * 0.15; // Gentle sway
        group.current.position.y = Math.sin(t) * 0.1; // Float
    });

    return (
        <group ref={group} {...props}>
            <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.8} floatingRange={[-0.2, 0.2]}>
                <mesh>
                    <planeGeometry args={[3.8, 3.8]} /> {/* Increased size */}
                    <meshBasicMaterial transparent side={THREE.DoubleSide}>
                        <primitive attach="map" object={new THREE.TextureLoader().load('/logo.png')} />
                    </meshBasicMaterial>
                </mesh>
            </Float>
        </group>
    );
};

const RotatingLogoScene = () => {
    return (
        <div className="w-full h-full relative">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={55} />

                {/* Enhanced Lighting Setup for "More Color" */}
                <ambientLight intensity={2} /> {/* Increased ambient light */}
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ffcccc" /> {/* Warm backlight */}

                <Environment preset="sunset" /> {/* Warmer, more colorful preset */}

                {/* Stronger, reddish shadow for "glow" effect */}
                <ContactShadows position={[0, -2, 0]} opacity={0.7} scale={12} blur={2.5} far={4} color="#ef4444" /> {/* Brighter red shadow */}

                <SLogo position={[0, 0, 0]} />
            </Canvas>
        </div>
    );
};

export default RotatingLogoScene;
