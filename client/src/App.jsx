import React, { useState, useCallback } from 'react';
import { produce } from 'immer'; // <-- Import produce from Immer
import ColorPalette from './components/ColorPalette';
import CubeDisplay from './components/CubeDisplay';
import ControlButton from './components/ControlButton';
import RotationControls from './components/RotationControls';
import styles from './App.module.css';
import * as THREE from 'three'; // Keep THREE import if needed elsewhere, maybe not strictly needed here now

// --- Function to create the initial state of the cube ---
// Moved outside the component as it doesn't depend on props or state
const createInitialCubeState = () => {
    const initialState = {};
    // Define cubelet size and spacing - ensure these match CubeDisplay if defined there too
    const cubeletSize = 1;
    const spacing = 0.05;
    const totalSize = cubeletSize + spacing;
    const offset = totalSize;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                // Skip the invisible center cubelet
                if (x === 0 && y === 0 && z === 0) continue;
                // Create a unique key for each cubelet based on its position
                const posKey = `${x}_${y}_${z}`;
                // Define the initial colors for the 6 faces of this cubelet
                // Order: +x (Right/Red), -x (Left/Orange), +y (Top/White), -y (Bottom/Yellow), +z (Front/Green), -z (Back/Blue)
                // Use a distinct color (like dark grey '#333333') for internal faces
                initialState[posKey] = [
                    (x === 1) ? '#FF0000' : '#333333', // Right (+x) Red / Dark Grey
                    (x === -1) ? '#FFA500' : '#333333',// Left (-x) Orange / Dark Grey
                    (y === 1) ? '#FFFFFF' : '#333333', // Top (+y) White / Dark Grey
                    (y === -1) ? '#FFFF00' : '#333333',// Bottom (-y) Yellow / Dark Grey
                    (z === 1) ? '#008000' : '#333333', // Front (+z) Green / Dark Grey
                    (z === -1) ? '#0000FF' : '#333333'  // Back (-z) Blue / Dark Grey
                ];
            }
        }
    }
    console.log("Generated Initial Cube State"); // Log when state is first created
    return initialState;
};
// --- End Initial State Logic ---


// --- Main Application Component ---
function App() {
  // State for the currently selected color in the palette
  const [selectedColor, setSelectedColor] = useState('#FFFFFF'); // Default White
  // State holding the color information for all cubelet faces
  const [cubeState, setCubeState] = useState(createInitialCubeState);
  // State for the overall rotation of the cube group in the 3D view
  const [cubeRotation, setCubeRotation] = useState([0, 0, 0]); // [x, y, z] Euler angles

  // --- Event Handlers ---

  // Handler for the RESET button
  const handleReset = useCallback(() => {
    console.log('Resetting cube state...');
    setCubeState(createInitialCubeState()); // Reset colors to initial state
    setSelectedColor('#FFFFFF'); // Reset selected color to white
    setCubeRotation([0, 0, 0]); // Reset cube rotation
  }, []); // Empty dependency array as it doesn't depend on changing props/state

  // Handler for the SOLVE button (Placeholder)
  const handleSolve = () => {
    console.log('Solving cube... (Not Implemented)');
    // Future: Add logic to trigger the solving process
  };

  // Handler for the rotation arrow buttons
  const handleRotate = useCallback((direction) => {
    const rotationAmount = Math.PI / 4; // Rotate by 45 degrees (adjust as needed)
    // Update the cubeRotation state based on the direction clicked
    setCubeRotation(currentRotation => {
      const [x, y, z] = currentRotation;
      switch (direction) {
        case 'left': // Rotate view left (rotate cube around world Y axis positively)
          return [x, y + rotationAmount, z];
        case 'right': // Rotate view right (rotate cube around world Y axis negatively)
          return [x, y - rotationAmount, z];
        case 'up': // Rotate view up (rotate cube around world X axis positively)
          return [x + rotationAmount, y, z];
        // Add 'down' case if needed: return [x - rotationAmount, y, z];
        default:
          return currentRotation; // Return unchanged if direction is unknown
      }
    });
  }, []); // Empty dependency array

  // Handler for when a facelet on the 3D cube is clicked
  // Uses Immer's produce function for safe and easy immutable state updates
  const handleFaceletUpdate = useCallback((posKey, faceIndex) => {
    // --- Debugging Logs ---
    console.log('--- handleFaceletUpdate ---');
    console.log('Received posKey:', posKey);
    console.log('Received faceIndex:', faceIndex);
    console.log('Current selectedColor:', selectedColor);
    // --- End Debugging Logs ---

    // Update cubeState using Immer
    setCubeState(produce(draft => {
        // 'draft' is a mutable proxy of the current cubeState

        // Safety check: Ensure the cubelet key exists in the state
        if (!draft[posKey]) {
            console.log('Error: Invalid posKey received:', posKey);
            return; // Exit the produce callback if key is invalid
        }

        // Get the current color of the specific facelet being clicked
        const currentFaceColor = draft[posKey][faceIndex];
        console.log('Current face color:', currentFaceColor);

        // Prevent changing the color of internal faces (dark grey)
        if (currentFaceColor === '#333333') { // Ensure this matches the internal color string exactly
            console.log("Prevented coloring internal face.");
            return; // Exit the produce callback
        }

        console.log(`Attempting to update ${posKey}[${faceIndex}] to ${selectedColor}`);
        // Directly mutate the draft state. Immer handles the immutable update behind the scenes.
        draft[posKey][faceIndex] = selectedColor;
        console.log('Immer draft updated:', draft[posKey]); // Log the modified part

    })); // Pass the update function to produce

    console.log('setCubeState (with Immer) called.'); // Confirm the state setter was invoked

  // Depend only on selectedColor. Immer's produce handles the previous state implicitly.
  }, [selectedColor]);


  // --- Render JSX ---
  return (
    <div className={styles.appContainer}>
      {/* Left panel containing title, palette, and action buttons */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>
          RUBIKS CUBE <br /> SOLVER
        </h1>
        {/* Color Palette Component */}
        <ColorPalette
          selectedColor={selectedColor} // Pass current selection
          onColorSelect={setSelectedColor} // Pass state setter function
        />
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <ControlButton label="RESET" onClick={handleReset} />
          <ControlButton label="SOLVE" onClick={handleSolve} />
        </div>
      </div>

      {/* Right panel containing the 3D cube display and rotation controls */}
      <div className={styles.rightPanel}>
        {/* 3D Cube Display Component */}
        <CubeDisplay
          cubeState={cubeState} // Pass the current colors
          cubeRotation={cubeRotation} // Pass the current rotation
          onFaceletUpdate={handleFaceletUpdate} // Pass the click handler
          selectedColor={selectedColor} // Pass selected color (might be useful for hover effects later)
        />
        {/* Rotation Control Buttons */}
        <RotationControls onRotate={handleRotate}/>
      </div>
    </div>
  );
}

export default App;
