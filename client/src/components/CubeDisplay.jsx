import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import styles from './CubeDisplay.module.css';

// --- Cubelet Sub-Component (Memoized for performance) ---
const Cubelet = React.memo(function Cubelet({ position, colors, posKey, onFaceletUpdate }) {
  const meshRef = useRef();

  const handleClick = (event) => {
    // stopPropagation prevents the OrbitControls from activating on click
    event.stopPropagation();
    if (event.faceIndex === undefined) {
      // Click might not be directly on a face (e.g., edge case)
      console.log('Click detected, but no faceIndex.');
      return;
    }
    const faceIndex = event.faceIndex;
    // Call the update function passed from App
    onFaceletUpdate(posKey, faceIndex);
  };

  return (
    // Using <Box> for simplicity from @react-three/drei
    <Box ref={meshRef} args={[1, 1, 1]} position={position} onClick={handleClick}>
      {colors.map((color, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`} // Correct way to assign materials to Box faces
          color={color}
          // Improve visual distinction for non-colored faces
          metalness={color === '#333333' ? 0.1 : 0.3} // Less metallic overall
          roughness={color === '#333333' ? 0.9 : 0.6} // Rougher internal faces
          // Add a subtle emissive color to colored faces to make them pop slightly
          emissive={color !== '#333333' ? color : '#000000'}
          emissiveIntensity={color !== '#333333' ? 0.15 : 0}
        />
      ))}
    </Box>
  );
});


// --- Main Cube Display Component ---
function CubeDisplay({ cubeState, cubeRotation, onFaceletUpdate, selectedColor }) {
  const cubeletSize = 1;
  const spacing = 0.06; // Slightly larger gap
  const totalSize = cubeletSize + spacing;
  const offset = 1 * totalSize; // Positioning logic seems correct

  // --- Generate Cubelet Components ---
  // Use Object.entries for potentially cleaner mapping if order isn't critical here
  const cubelets = Object.entries(cubeState).map(([posKey, colors]) => {
    const [xStr, yStr, zStr] = posKey.split('_');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const z = parseInt(zStr, 10);
    // Position based on coordinates and spacing
    const position = [x * offset, y * offset, z * offset];

    return (
      <Cubelet
        key={posKey}
        posKey={posKey}
        position={position}
        colors={colors}
        onFaceletUpdate={onFaceletUpdate} // Pass the handler down
      />
    );
  });

  return (
    <div className={styles.cubeCanvasContainer}>
      <Canvas camera={{ position: [3.5, 3.5, 7], fov: 50 }}> {/* Slightly further back camera */}
        <ambientLight intensity={0.7} /> {/* Adjust lighting */}
        <directionalLight position={[8, 12, 10]} intensity={1.0} castShadow /> {/* Main light */}
        <pointLight position={[-8, -8, -8]} intensity={0.3} /> {/* Softer fill light */}

        {/* Group to apply rotation to all cubelets */}
        <group rotation={cubeRotation}>
          {cubelets}
        </group>
        {/* Added damping for smoother controls, adjusted zoom/pan limits */}
        <OrbitControls
            enableDamping
            dampingFactor={0.1}
            minDistance={5}   // Prevent zooming too close
            maxDistance={20}  // Prevent zooming too far
            enablePan={false} // Disable panning for a more focused cube view
        />
      </Canvas>
      {/* Display selected color */}
      <div style={{ marginTop: '15px', color: '#444', textAlign: 'center', fontSize: '1rem' }}>
        Selected:
        <span style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            backgroundColor: selectedColor,
            border: '2px solid #555', // Thicker border
            borderRadius: '3px',      // Slightly rounded
            verticalAlign: 'middle',
            marginLeft: '8px',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.2)' // Add shadow
         }}></span>
      </div>
    </div>
  );
}

export default CubeDisplay;