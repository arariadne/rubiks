import React, { useState, useCallback } from 'react';
import { produce } from 'immer';
import ColorPalette from './components/ColorPalette';
import CubeDisplay from './components/CubeDisplay';
import ControlButton from './components/ControlButton';
import RotationControls from './components/RotationControls';
import styles from './App.module.css';
import Cube from 'cubejs'; // <-- Import the solver library

// --- Initial State Logic (Keep as before) ---
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
                initialState[posKey] = [
                    (x === 1) ? '#FF0000' : '#333333', // R (+x)
                    (x === -1) ? '#FFA500' : '#333333',// L (-x)
                    (y === 1) ? '#FFFFFF' : '#333333', // U (+y)
                    (y === -1) ? '#FFFF00' : '#333333',// D (-y)
                    (z === 1) ? '#008000' : '#333333', // F (+z)
                    (z === -1) ? '#0000FF' : '#333333'  // B (-z)
                ];
            }
        }
    }
    return initialState;
};

// --- Helper Function: Convert Hex Color to Face Letter ---
const hexToFaceLetter = (hex) => {
    switch (hex?.toUpperCase()) {
        case '#FFFFFF': return 'U'; // Up = White
        case '#FF0000': return 'R'; // Right = Red
        case '#008000': return 'F'; // Front = Green
        case '#FFFF00': return 'D'; // Down = Yellow
        case '#FFA500': return 'L'; // Left = Orange
        case '#0000FF': return 'B'; // Back = Blue
        default: return null; // Invalid or internal color
    }
};


const convertStateToSolverString = (appState) => {
  
    const faceletMap = [
        // Up Face (y=1) - Order: ULB, UB, UBR, UL, U, UR, ULF, UF, UFR (example, verify order)
        { key: "-1_1_-1", faceIndex: 2 }, { key: "0_1_-1", faceIndex: 2 }, { key: "1_1_-1", faceIndex: 2 },
        { key: "-1_1_0", faceIndex: 2 }, { key: "0_1_0", faceIndex: 2 }, { key: "1_1_0", faceIndex: 2 },
        { key: "-1_1_1", faceIndex: 2 }, { key: "0_1_1", faceIndex: 2 }, { key: "1_1_1", faceIndex: 2 },
        // Right Face (x=1) - Order: URF, UR, UBR, FR, R, BR, DRF, DR, DBR (example, verify order)
        { key: "1_1_1", faceIndex: 0 }, { key: "1_1_0", faceIndex: 0 }, { key: "1_1_-1", faceIndex: 0 },
        { key: "1_0_1", faceIndex: 0 }, { key: "1_0_0", faceIndex: 0 }, { key: "1_0_-1", faceIndex: 0 },
        { key: "1_-1_1", faceIndex: 0 }, { key: "1_-1_0", faceIndex: 0 }, { key: "1_-1_-1", faceIndex: 0 },
        // Front Face (z=1) - Order: ULF, UF, UFR, LF, F, RF, DLF, DF, DFR (example, verify order)
        { key: "-1_1_1", faceIndex: 4 }, { key: "0_1_1", faceIndex: 4 }, { key: "1_1_1", faceIndex: 4 },
        { key: "-1_0_1", faceIndex: 4 }, { key: "0_0_1", faceIndex: 4 }, { key: "1_0_1", faceIndex: 4 },
        { key: "-1_-1_1", faceIndex: 4 }, { key: "0_-1_1", faceIndex: 4 }, { key: "1_-1_1", faceIndex: 4 },
        // Down Face (y=-1) - Order: DLF, DF, DFR, DL, D, DR, DBL, DB, DBR (example, verify order)
        { key: "-1_-1_1", faceIndex: 3 }, { key: "0_-1_1", faceIndex: 3 }, { key: "1_-1_1", faceIndex: 3 },
        { key: "-1_-1_0", faceIndex: 3 }, { key: "0_-1_0", faceIndex: 3 }, { key: "1_-1_0", faceIndex: 3 },
        { key: "-1_-1_-1", faceIndex: 3 }, { key: "0_-1_-1", faceIndex: 3 }, { key: "1_-1_-1", faceIndex: 3 },
        // Left Face (x=-1) - Order: ULB, UL, ULF, BL, L, FL, DBL, DL, DLF (example, verify order)
        { key: "-1_1_-1", faceIndex: 1 }, { key: "-1_1_0", faceIndex: 1 }, { key: "-1_1_1", faceIndex: 1 },
        { key: "-1_0_-1", faceIndex: 1 }, { key: "-1_0_0", faceIndex: 1 }, { key: "-1_0_1", faceIndex: 1 },
        { key: "-1_-1_-1", faceIndex: 1 }, { key: "-1_-1_0", faceIndex: 1 }, { key: "-1_-1_1", faceIndex: 1 },
        // Back Face (z=-1) - Order: UBR, UB, ULB, BR, B, BL, DBR, DB, DBL (example, verify order)
        { key: "1_1_-1", faceIndex: 5 }, { key: "0_1_-1", faceIndex: 5 }, { key: "-1_1_-1", faceIndex: 5 },
        { key: "1_0_-1", faceIndex: 5 }, { key: "0_0_-1", faceIndex: 5 }, { key: "-1_0_-1", faceIndex: 5 },
        { key: "1_-1_-1", faceIndex: 5 }, { key: "0_-1_-1", faceIndex: 5 }, { key: "-1_-1_-1", faceIndex: 5 },
    ];

    let solverString = "";
    let centerColors = new Set();
    let faceletCount = 0;

    for (const mapping of faceletMap) {
        const colors = appState[mapping.key];
        if (!colors) {
            console.error(`Invalid cube state: Missing key ${mapping.key}`);
            throw new Error(`Invalid cube state: Missing key ${mapping.key}`);
        }
        const hexColor = colors[mapping.faceIndex];
        const faceLetter = hexToFaceLetter(hexColor);

        if (!faceLetter) {
            console.error(`Invalid cube state: Invalid color ${hexColor} at ${mapping.key}, face ${mapping.faceIndex}`);
            throw new Error(`Invalid color ${hexColor} found on cube.`);
        }
        solverString += faceLetter;
        faceletCount++;

        // Check center piece colors (positions like "0_1_0", "1_0_0", etc.)
        if (mapping.key === "0_1_0" || mapping.key === "1_0_0" || mapping.key === "0_0_1" ||
            mapping.key === "0_-1_0" || mapping.key === "-1_0_0" || mapping.key === "0_0_-1") {
             if (centerColors.has(faceLetter)) {
                 console.error(`Invalid cube state: Duplicate center color ${faceLetter}`);
                 throw new Error(`Invalid cube: Duplicate center color ${faceLetter}.`);
             }
             centerColors.add(faceLetter);
        }
    }

    if (faceletCount !== 54) {
         console.error(`Invalid cube state: Expected 54 facelets, found ${faceletCount}`);
         throw new Error("Invalid cube state: Incorrect number of facelets processed.");
    }
     if (centerColors.size !== 6) {
         console.error(`Invalid cube state: Expected 6 unique center colors, found ${centerColors.size}`);
         throw new Error("Invalid cube state: Missing or duplicate center colors.");
     }


    console.log("Generated Solver String:", solverString);
    return solverString;
};


// --- Main Application Component ---
function App() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [cubeState, setCubeState] = useState(createInitialCubeState);
  const [cubeRotation, setCubeRotation] = useState([0, 0, 0]);
  // --- New state for solver ---
  const [solutionSteps, setSolutionSteps] = useState(''); 
  const [isSolving, setIsSolving] = useState(false); 
  const [solverError, setSolverError] = useState('');

  // --- Event Handlers ---
  const handleReset = useCallback(() => {
    console.log('Resetting cube state...');
    setCubeState(createInitialCubeState());
    setSelectedColor('#FFFFFF');
    setCubeRotation([0, 0, 0]);
    setSolutionSteps('');
    setSolverError(''); 
    setIsSolving(false);
  }, []);

  // SOLVE button handler
  const handleSolve = useCallback(async () => {
    console.log('Attempting to solve cube...');
    setIsSolving(true);
    setSolutionSteps('');
    setSolverError('');

    try {
        // 1. Convert current state to the solver's required string format
        const solverString = convertStateToSolverString(cubeState);

        // 2. Initialize the solver (this might require specific setup)
        // Ensure Cube library is loaded (it might need initialization itself)
        if (!Cube || typeof Cube.fromString !== 'function' || typeof Cube.prototype.solve !== 'function') {
             throw new Error("Cube solver library not loaded correctly.");
        }
        await Cube.asyncInit(); // Some libraries might need async init for WASM/workers

        const cube = Cube.fromString(solverString);

        // 3. Solve the cube
        const solution = cube.solve(); // This might take time

        // 4. Update state with the solution
        if (solution) {
            setSolutionSteps(solution);
            console.log("Solution found:", solution);
        } else {
            setSolverError("Solver could not find a solution (cube might be unsolvable).");
        }

    } catch (error) {
        console.error("Solver Error:", error);
        setSolverError(error.message || "An error occurred during solving.");
    } finally {
        setIsSolving(false); // Hide loading indicator
    }
  }, [cubeState]); // Depends on the current cubeState

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
     setSolutionSteps(''); // Clear solution if cube is manually rotated
     setSolverError('');
  }, []);

  // Handler for facelet clicks - uses Immer
  const handleFaceletUpdate = useCallback((posKey, faceIndex) => {
    setCubeState(produce(draft => {
        if (!draft[posKey]) return;
        const currentFaceColor = draft[posKey][faceIndex];
        if (currentFaceColor === '#333333') return; // Prevent coloring internal
        draft[posKey][faceIndex] = selectedColor;
    }));
    setSolutionSteps(''); // Clear solution if colors are changed manually
    setSolverError('');
  }, [selectedColor]);

  // --- Render JSX ---
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
          {/* Disable SOLVE button while solving */}
          <ControlButton label={isSolving ? "SOLVING..." : "SOLVE"} onClick={handleSolve} disabled={isSolving} />
        </div>
        {/* --- Display Area for Solution/Errors --- */}
        <div className={styles.solutionArea}>
            {solverError && <p className={styles.errorMessage}>Error: {solverError}</p>}
            {solutionSteps && !solverError && (
                <div>
                    <h3 className={styles.solutionTitle}>Solution Steps:</h3>
                    <p className={styles.solutionText}>{solutionSteps}</p>
                </div>
            )}
            {isSolving && <p>Calculating solution...</p>}
        </div>
        {/* --- End Display Area --- */}
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
