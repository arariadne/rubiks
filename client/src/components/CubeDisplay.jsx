import React, { useRef } from 'react'; // Import React itself
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import styles from './CubeDisplay.module.css';

// --- Cubelet Sub-Component ---
// Wrap the component definition in React.memo()
const Cubelet = React.memo(function Cubelet({ position, colors, posKey, onFaceletUpdate }) {
  const meshRef = useRef();

  const handleClick = (event) => {
    event.stopPropagation();
    // Reduced logging
    // console.log('--- Cubelet Click ---');
    // console.log('event.faceIndex:', event.faceIndex);
    // console.log('posKey:', posKey);

    if (event.faceIndex === undefined) {
      // console.log('Click did not have faceIndex.');
      return;
    }
    const faceIndex = event.faceIndex;
    onFaceletUpdate(posKey, faceIndex);
    // console.log('Called onFaceletUpdate');
  };

  // console.log(`Rendering Cubelet: ${posKey}`); // Add this temporarily to see which cubelets re-render

  return (
    <Box ref={meshRef} args={[1, 1, 1]} position={position} onClick={handleClick}>
      {colors.map((color, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`}
          color={color}
        />
      ))}
    </Box>
  );
}); // End of React.memo wrapper


// --- Main Cube Display Component ---
function CubeDisplay({ cubeState, cubeRotation, onFaceletUpdate, selectedColor }) {
  const cubeletSize = 1;
  const spacing = 0.05;
  const totalSize = cubeletSize + spacing;
  const offset = totalSize;

  // --- Generate Cubelet Components ---
  const cubelets = [];
  for (const posKey in cubeState) {
    const [xStr, yStr, zStr] = posKey.split('_');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const z = parseInt(zStr, 10);
    const position = [x * offset, y * offset, z * offset];
    cubelets.push(
      // Render the memoized Cubelet component
      <Cubelet
        key={posKey}
        posKey={posKey}
        position={position}
        colors={cubeState[posKey]}
        onFaceletUpdate={onFaceletUpdate}
      />
    );
  }

  return (
    <div className={styles.cubeCanvasContainer}>
      <Canvas camera={{ position: [3, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7.5]} intensity={1.0} />
        {/* Apply rotation state to the group */}
        <group rotation={cubeRotation}>
          {cubelets}
        </group>
        <OrbitControls enableDamping />
      </Canvas>
      {/* Optional: Display selected color feedback */}
      <div style={{ marginTop: '10px', color: '#555', textAlign: 'center', fontSize: '0.9rem' }}>
        Selected:
        <span style={{
            display: 'inline-block',
            width: '15px',
            height: '15px',
            backgroundColor: selectedColor,
            border: '1px solid #333',
            verticalAlign: 'middle',
            marginLeft: '5px'
         }}></span>
      </div>
    </div>
  );
}

export default CubeDisplay;
