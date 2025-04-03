import React, { useState, useCallback } from 'react';
import { produce } from 'immer'; // Import produce from Immer
import ColorPalette from './components/ColorPalette';
import CubeDisplay from './components/CubeDisplay';
import ControlButton from './components/ControlButton';
import RotationControls from './components/RotationControls';
import styles from './App.module.css';
// THREE import might not be needed here if not used directly
// import * as THREE from 'three';

// --- Function to create the initial state of the cube ---
const createInitialCubeState = () => {
    const initialState = {};
    const cubeletSize = 1;
    const spacing = 0.05;
    const totalSize = cubeletSize + spacing;
    const offset = totalSize;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                const posKey = `${x}_${y}_${z}`;
                // Face Order: +x(R), -x(O), +y(W), -y(Y), +z(G), -z(B)
                initialState[posKey] = [
                    (x === 1) ? '#FF0000' : '#333333',
                    (x === -1) ? '#FFA500' : '#333333',
                    (y === 1) ? '#FFFFFF' : '#333333',
                    (y === -1) ? '#FFFF00' : '#333333',
                    (z === 1) ? '#008000' : '#333333',
                    (z === -1) ? '#0000FF' : '#333333'
                ];
            }
        }
    }
    // console.log("Generated Initial Cube State"); // Keep if useful, remove if noisy
    return initialState;
};

// --- Main Application Component ---
function App() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [cubeState, setCubeState] = useState(createInitialCubeState);
  const [cubeRotation, setCubeRotation] = useState([0, 0, 0]);

  // --- Event Handlers ---
  const handleReset = useCallback(() => {
    console.log('Resetting cube state...');
    setCubeState(createInitialCubeState());
    setSelectedColor('#FFFFFF');
    setCubeRotation([0, 0, 0]);
  }, []);

  const handleSolve = () => {
    console.log('Solving cube... (Not Implemented)');
  };

  const handleRotate = useCallback((direction) => {
    const rotationAmount = Math.PI / 4;
    setCubeRotation(currentRotation => {
      const [x, y, z] = currentRotation;
      switch (direction) {
        case 'left': return [x, y + rotationAmount, z];
        case 'right': return [x, y - rotationAmount, z];
        case 'up': return [x + rotationAmount, y, z];
        default: return currentRotation;
      }
    });
  }, []);

  // Handler for facelet clicks - uses Immer
  const handleFaceletUpdate = useCallback((posKey, faceIndex) => {
    // Reduced logging - keep only essential info if needed
    // console.log(`--- handleFaceletUpdate --- Key: ${posKey}, Face: ${faceIndex}, Color: ${selectedColor}`);

    setCubeState(produce(draft => {
        if (!draft[posKey]) {
            // console.log('Error: Invalid posKey received:', posKey);
            return;
        }
        const currentFaceColor = draft[posKey][faceIndex];

        // Prevent changing internal faces
        if (currentFaceColor === '#333333') {
            // console.log("Prevented coloring internal face.");
            return;
        }

        // console.log(`Attempting to update ${posKey}[${faceIndex}] to ${selectedColor}`);
        // Mutate the draft - Immer handles immutability
        draft[posKey][faceIndex] = selectedColor;
    }));

    // console.log('setCubeState (with Immer) called.');

  }, [selectedColor]); // Dependency only on selectedColor

  // --- Render JSX ---
  return (
    <div className={styles.appContainer}>
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>
          RUBIKS CUBE <br /> SOLVER
        </h1>
        <ColorPalette
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor} // Pass state setter directly
        />
        <div className={styles.actionButtons}>
          <ControlButton label="RESET" onClick={handleReset} />
          <ControlButton label="SOLVE" onClick={handleSolve} />
        </div>
      </div>
      <div className={styles.rightPanel}>
        <CubeDisplay
          cubeState={cubeState}
          cubeRotation={cubeRotation}
          onFaceletUpdate={handleFaceletUpdate}
          selectedColor={selectedColor}
        />
        <RotationControls onRotate={handleRotate}/>
      </div>
    </div>
  );
}

export default App;
