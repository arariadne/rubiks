import React, { useState } from 'react';
import ColorPalette from './components/ColorPalette';
import CubeDisplay from './components/CubeDisplay';
import ControlButton from './components/ControlButton';
import RotationControls from './components/RotationControls';
import styles from './App.module.css'; // We'll create this CSS file

function App() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF'); // Default to white

  const handleReset = () => {
    console.log('Resetting cube state...');
    // Add logic to reset the cube face colors here
    setSelectedColor('#FFFFFF'); // Reset selected color
  };

  const handleSolve = () => {
    console.log('Solving cube...');
    // Add logic to trigger the solving process here
  };

  const handleRotate = (direction) => {
    console.log(`Rotate cube: ${direction}`);
    // Add logic to visually rotate the CubeDisplay component
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>
          RUBIKS CUBE <br /> SOLVER
        </h1>
        <ColorPalette
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
        <div className={styles.actionButtons}>
          <ControlButton label="RESET" onClick={handleReset} />
          <ControlButton label="SOLVE" onClick={handleSolve} />
        </div>
      </div>
      <div className={styles.rightPanel}>
        <CubeDisplay selectedColor={selectedColor} />
        <RotationControls onRotate={handleRotate}/>
      </div>
    </div>
  );
}

export default App;