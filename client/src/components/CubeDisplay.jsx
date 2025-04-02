import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three'; // Still needed for things like THREE.Color
import styles from './CubeDisplay.module.css'; // For styling the Canvas container

// --- Cubelet Component ---
function Cubelet({ position, colors }) {
  // colors should be an array of 6 color strings/numbers
  // matching the face order: +x, -x, +y, -y, +z, -z
  const meshRef = useRef();

   // Example: Make cubelets clickable (requires event setup in Canvas)
   const handleClick = (event) => {
       event.stopPropagation(); // prevent click from bubbling to OrbitControls
       console.log('Clicked cubelet at', position);
       // Apply selectedColor logic here, maybe get face index from event.faceIndex
       // You'd need a way to update the central cube state
   }

  return (
    <Box ref={meshRef} args={[1, 1, 1]} position={position} onClick={handleClick}>
      {/* Map the 6 colors to 6 materials */}
      {colors.map((color, index) => (
         <meshStandardMaterial key={index} attach={`material-${index}`} color={color} />
      ))}
    </Box>
  );
}

// --- Main Cube Display Component ---
function CubeDisplay({ selectedColor /* Add cube state prop later */ }) {
  const cubeletSize = 1;
  const spacing = 0.05;
  const totalSize = cubeletSize + spacing;
  const offset = totalSize;

  // === IMPORTANT: Cube State ===
  // You need a state representation of the cube's colors.
  // This is a simplified example; a real app needs a robust state.
  const [cubeState, setCubeState] = useState(() => {
      const initialState = {};
      for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
              for (let z = -1; z <= 1; z++) {
                  if (x === 0 && y === 0 && z === 0) continue;
                  const posKey = `<span class="math-inline">\{x\}\_</span>{y}_${z}`;
                  initialState[posKey] = [ // Default colors for a solved cube facelet
                      (x === 1) ? '#FF0000' : '#111111', // Right (+x) Red / Black
                      (x === -1) ? '#FFA500' : '#111111',// Left (-x) Orange / Black
                      (y === 1) ? '#FFFFFF' : '#111111', // Top (+y) White / Black
                      (y === -1) ? '#FFFF00' : '#111111',// Bottom (-y) Yellow / Black
                      (z === 1) ? '#008000' : '#111111', // Front (+z) Green / Black
                      (z === -1) ? '#0000FF' : '#111111'  // Back (-z) Blue / Black
                  ];
              }
          }
      }
      return initialState;
  });


  // --- Generate Cubelet Components ---
  const cubelets = [];
  for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
              if (x === 0 && y === 0 && z === 0) continue; // Skip center
              const position = [x * offset, y * offset, z * offset];
              const posKey = `<span class="math-inline">\{x\}\_</span>{y}_${z}`;
              cubelets.push(
                  <Cubelet
                      key={posKey}
                      position={position}
                      colors={cubeState[posKey]}
                  />
              );
          }
      }
  }


  return (
    <div className={styles.cubeCanvasContainer}> {/* Style this container */}
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            {/* Lights */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 7.5]} intensity={0.8} />

            {/* Group to hold all cubelets - makes rotation easier */}
            <group>
                {cubelets}
            </group>

            {/* Controls */}
            <OrbitControls enableDamping />
        </Canvas>
         {/* Instructions or other UI elements can go here */}
    </div>
  );
}

export default CubeDisplay;

