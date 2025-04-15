import React, { useState, useCallback, useEffect } from 'react';
import { produce } from 'immer';
import ColorPalette from './components/ColorPalette';
import CubeDisplay from './components/CubeDisplay';
import ControlButton from './components/ControlButton';
import RotationControls from './components/RotationControls';
import styles from './App.module.css';
import Cube from 'cubejs';

// --- Initial State Logic ---
const createInitialCubeState = () => {
    const initialState = {};
    const cubeletSize = 1;
    const spacing = 0.05; // Keep a small spacing
    const totalSize = cubeletSize + spacing;
    // Center the cube calculation: an offset of 1 means positions are -1, 0, 1
    const offset = 1 * totalSize;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                // Skip the center piece
                if (x === 0 && y === 0 && z === 0) continue;
                const posKey = `${x}_${y}_${z}`;
                // Colors based on outward face direction (standard Rubik's layout URFDLB - White, Red, Green, Yellow, Orange, Blue)
                initialState[posKey] = [
                    (x === 1) ? '#FF0000' : '#333333',  // R (Right face): Red
                    (x === -1) ? '#FFA500' : '#333333', // L (Left face): Orange
                    (y === 1) ? '#FFFFFF' : '#333333',  // U (Up face): White
                    (y === -1) ? '#FFFF00' : '#333333', // D (Down face): Yellow
                    (z === 1) ? '#008000' : '#333333',  // F (Front face): Green
                    (z === -1) ? '#0000FF' : '#333333'   // B (Back face): Blue
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
        default: return null; // Invalid or internal color ('#333333')
    }
};


// --- Helper Function: Convert App State to Solver String ---
// IMPORTANT: Verify this facelet order against the cubejs documentation/examples
// The standard order is often URFDLB (Up, Right, Front, Down, Left, Back)
// Facelets are usually read left-to-right, top-to-bottom within each face.
const convertStateToSolverString = (appState) => {
    // Define the mapping based on the EXPECTED order by the cubejs solver library
    // This is a LIKELY standard order (URFDLB), but MUST be verified.
    // Each array represents a face, listing the facelets in order (e.g., top-left to bottom-right)
    const faceMappings = {
        'U': [ { key: "-1_1_-1", faceIndex: 2 }, { key: "0_1_-1", faceIndex: 2 }, { key: "1_1_-1", faceIndex: 2 },
               { key: "-1_1_0",  faceIndex: 2 }, { key: "0_1_0",  faceIndex: 2 }, { key: "1_1_0",  faceIndex: 2 },
               { key: "-1_1_1",  faceIndex: 2 }, { key: "0_1_1",  faceIndex: 2 }, { key: "1_1_1",  faceIndex: 2 } ],
        'R': [ { key: "1_1_-1",  faceIndex: 0 }, { key: "1_1_0",  faceIndex: 0 }, { key: "1_1_1",  faceIndex: 0 },
               { key: "1_0_-1",  faceIndex: 0 }, { key: "1_0_0",  faceIndex: 0 }, { key: "1_0_1",  faceIndex: 0 },
               { key: "1_-1_-1", faceIndex: 0 }, { key: "1_-1_0", faceIndex: 0 }, { key: "1_-1_1", faceIndex: 0 } ],
        'F': [ { key: "-1_1_1",  faceIndex: 4 }, { key: "0_1_1",  faceIndex: 4 }, { key: "1_1_1",  faceIndex: 4 },
               { key: "-1_0_1",  faceIndex: 4 }, { key: "0_0_1",  faceIndex: 4 }, { key: "1_0_1",  faceIndex: 4 },
               { key: "-1_-1_1", faceIndex: 4 }, { key: "0_-1_1", faceIndex: 4 }, { key: "1_-1_1", faceIndex: 4 } ],
        'D': [ { key: "-1_-1_1", faceIndex: 3 }, { key: "0_-1_1", faceIndex: 3 }, { key: "1_-1_1", faceIndex: 3 },
               { key: "-1_-1_0", faceIndex: 3 }, { key: "0_-1_0", faceIndex: 3 }, { key: "1_-1_0", faceIndex: 3 },
               { key: "-1_-1_-1",faceIndex: 3 }, { key: "0_-1_-1",faceIndex: 3 }, { key: "1_-1_-1",faceIndex: 3 } ],
        'L': [ { key: "-1_1_1", faceIndex: 1 }, { key: "-1_1_0", faceIndex: 1 }, { key: "-1_1_-1", faceIndex: 1 },
               { key: "-1_0_1", faceIndex: 1 }, { key: "-1_0_0", faceIndex: 1 }, { key: "-1_0_-1", faceIndex: 1 },
               { key: "-1_-1_1",faceIndex: 1 }, { key: "-1_-1_0",faceIndex: 1 }, { key: "-1_-1_-1",faceIndex: 1 } ],
        'B': [ { key: "1_1_-1", faceIndex: 5 }, { key: "0_1_-1", faceIndex: 5 }, { key: "-1_1_-1", faceIndex: 5 },
               { key: "1_0_-1", faceIndex: 5 }, { key: "0_0_-1", faceIndex: 5 }, { key: "-1_0_-1", faceIndex: 5 },
               { key: "1_-1_-1",faceIndex: 5 }, { key: "0_-1_-1",faceIndex: 5 }, { key: "-1_-1_-1",faceIndex: 5 } ]
    };

    const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
    let solverString = "";
    let centerColorsFound = {};
    let faceletColors = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 }; // Count per color

    for (const faceLetter of faceOrder) {
        const mappings = faceMappings[faceLetter];
        if (!mappings) return { error: `Internal error: No mapping found for face ${faceLetter}.` };

        for (const mapping of mappings) {
             const colors = appState[mapping.key];
             if (!colors) return { error: `Invalid cube state: Missing key ${mapping.key}.` };

             const hexColor = colors[mapping.faceIndex];
             const currentFaceLetter = hexToFaceLetter(hexColor);

             if (!currentFaceLetter) {
                 // If it's an internal facelet (#333333), skip it for the string
                 if (hexColor === '#333333') continue;
                 // Otherwise, it's an invalid color set by the user
                 return { error: `Invalid color ${hexColor} found at ${mapping.key}, face index ${mapping.faceIndex}. Reset the cube or fix the color.` };
             }

             solverString += currentFaceLetter;
             faceletColors[currentFaceLetter]++; // Count the color

             // Check if it's a center piece (only one non-'#333' color)
            const isCenter = colors.filter(c => c !== '#333333').length === 1;
             if (isCenter) {
                 if (centerColorsFound[currentFaceLetter] && centerColorsFound[currentFaceLetter] !== mapping.key) {
                     return { error: `Invalid cube state: Duplicate center color ${currentFaceLetter}.` };
                 }
                 if (Object.values(centerColorsFound).includes(mapping.key) && centerColorsFound[currentFaceLetter] !== mapping.key) {
                    return { error: `Invalid cube state: Multiple colors assigned to center piece at ${mapping.key}.` };
                 }
                  centerColorsFound[currentFaceLetter] = mapping.key;
             }
        }
    }

    // Final validation
    if (solverString.length !== 54) {
        return { error: `Invalid cube state: Solver string length is ${solverString.length}, expected 54. Check facelet mapping.` };
    }
    if (Object.keys(centerColorsFound).length !== 6) {
         return { error: `Invalid cube state: Found ${Object.keys(centerColorsFound).length} unique center colors, expected 6.` };
    }
     for (const color in faceletColors) {
         if (faceletColors[color] !== 9) {
             return { error: `Invalid cube state: Expected 9 facelets for color ${color}, but found ${faceletColors[color]}.` };
         }
     }


    console.log("Generated Solver String:", solverString);
    return { solverString }; // Return object with string or error
};

// --- Main Application Component ---
function App() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [cubeState, setCubeState] = useState(createInitialCubeState);
  const [cubeRotation, setCubeRotation] = useState([Math.PI / 6, Math.PI / 4, 0]); // Initial rotation slightly angled
  const [solutionSteps, setSolutionSteps] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solverError, setSolverError] = useState('');
  const [isSolverReady, setIsSolverReady] = useState(false); // Track solver initialization

  // --- Initialize Cube.js ---
  useEffect(() => {
      console.log("Initializing Cube.js solver...");
      Cube.asyncInit()
          .then(() => {
              console.log("Cube.js solver initialized.");
              setIsSolverReady(true); // Set solver ready state
              setSolverError(''); // Clear any previous init error
           })
          .catch(err => {
              console.error("Failed to initialize Cube.js solver:", err);
              setSolverError("Failed to load the solver library. Please refresh.");
              setIsSolverReady(false); // Ensure solver is marked as not ready
           });
  }, []); // Run only once on component mount


  // --- Event Handlers ---
  const handleReset = useCallback(() => {
    console.log('Resetting cube state...');
    setCubeState(createInitialCubeState());
    setSelectedColor('#FFFFFF');
    setCubeRotation([Math.PI / 6, Math.PI / 4, 0]); // Reset rotation
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

    // Ensure Cube library is loaded and initialized
    if (!isSolverReady || !Cube || typeof Cube.fromString !== 'function' || typeof Cube.prototype.solve !== 'function') {
         setSolverError("Solver not ready. Please wait or refresh the page.");
         setIsSolving(false);
         return;
    }

    // 1. Convert current state to the solver's required string format
    const conversionResult = convertStateToSolverString(cubeState);

    if (conversionResult.error) {
        setSolverError(`Cube State Error: ${conversionResult.error}`);
        setIsSolving(false);
        return; // Stop if conversion failed
    }

    const { solverString } = conversionResult;

    try {
        const cube = Cube.fromString(solverString);

        // 3. Solve the cube
        console.log("Calling cube.solve()...");
        const solution = cube.solve(); // This might take time

        // 4. Update state with the solution
        if (solution && typeof solution === 'string') {
            // Apply optimization if available (some versions might have it built-in)
            let optimizedSolution = solution;
            if (typeof Cube.scramble === 'function' && typeof Cube.inverse === 'function') {
                // A common (though not guaranteed perfect) simplification technique
                try {
                     optimizedSolution = Cube.inverse(Cube.inverse(solution));
                } catch (optError) {
                    console.warn("Could not optimize solution string:", optError);
                    // Fallback to original solution if optimization fails
                    optimizedSolution = solution;
                }
            }
            setSolutionSteps(optimizedSolution.trim()); // Trim whitespace
            console.log("Solution found:", optimizedSolution.trim());
        } else if (solution === '') {
            // cubejs returns an empty string if the cube is already solved
            setSolutionSteps("(Cube is already solved)");
             console.log("Cube is already solved.");
        }
        else {
            setSolverError("Solver could not find a solution. The cube state might be invalid or unsolvable.");
            console.warn("Solver returned unexpected value:", solution);
        }

    } catch (error) {
        console.error("Solver Error:", error);
        // Check for common cubejs errors by message content
        if (error.message && error.message.toLowerCase().includes("invalid cube definition string")) {
             setSolverError("Invalid cube state detected by solver. Please check colors.");
        } else if (error.message && error.message.toLowerCase().includes("permutation")) {
             setSolverError("Invalid cube state (permutation error). Check corners/edges.");
        } else {
            setSolverError(`Solver Error: ${error.message || "An unknown error occurred."}`);
        }
    } finally {
        setIsSolving(false);
        console.log('Solving process finished.');
    }
  }, [cubeState, isSolverReady]); // Include isSolverReady dependency

  // Rotate handler - Rotates the *entire* cube group
  const handleRotate = useCallback((direction) => {
    const rotationAmount = Math.PI / 6; // Rotate by 30 degrees for smoother steps
    setCubeRotation(currentRotation => {
      const [x, y, z] = currentRotation;
      // Apply rotation based on direction (adjust axes if needed for desired effect)
      switch (direction) {
        case 'left': return [x, y + rotationAmount, z]; // Yaw left (around Y)
        case 'right': return [x, y - rotationAmount, z]; // Yaw right (around Y)
        case 'up': return [x + rotationAmount, y, z];   // Pitch up (around X)
        case 'down': return [x - rotationAmount, y, z]; // Pitch down (around X)
        default: return currentRotation;
      }
    });
     setSolutionSteps(''); // Clear solution/error on manual rotation
     setSolverError('');
  }, []); // No dependencies needed here

  // Handler for facelet clicks - uses Immer
  const handleFaceletUpdate = useCallback((posKey, faceIndex) => {
    setCubeState(produce(draft => {
        if (!draft[posKey]) {
            console.warn(`Attempted to update non-existent posKey: ${posKey}`);
            return; // Should not happen if state is consistent
        }
        const currentFaceColor = draft[posKey][faceIndex];
        // Allow updating only visible (non-internal) facelets
        if (currentFaceColor !== '#333333') {
             draft[posKey][faceIndex] = selectedColor;
             console.log(`Updated ${posKey}[${faceIndex}] to ${selectedColor}`);
        } else {
            console.log(`Prevented update on internal facelet: ${posKey}, face index ${faceIndex}`);
        }
    }));
    // Clear solution/error when user manually changes colors
    setSolutionSteps('');
    setSolverError('');
  }, [selectedColor]); // Dependency on selectedColor is correct


  // --- Render JSX ---
  return (
    <div className={styles.appContainer}>
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>
          RUBIK'S CUBE <br /> SOLVER
        </h1>
        {/* Display solver status */}
         <div style={{ margin: '10px 0', color: isSolverReady ? 'green' : 'orange', fontSize: '0.9rem', textAlign: 'center', minHeight: '1.2em' }}>
            {isSolverReady ? 'Solver Ready' : (solverError || 'Solver Initializing...')}
        </div>
        <ColorPalette
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
        <div className={styles.actionButtons}>
          <ControlButton label="RESET" onClick={handleReset} />
          {/* Disable SOLVE button while solving or if solver not ready */}
          <ControlButton
            label={isSolving ? "SOLVING..." : "SOLVE"}
            onClick={handleSolve}
            disabled={isSolving || !isSolverReady}
          />
        </div>
        {/* Display Area for Solution/Errors */}
        <div className={styles.solutionArea}>
            {/* Display solver error first if it exists */}
            {solverError && !isSolverReady && <p className={styles.errorMessage}>Error: {solverError}</p>}
            {solverError && isSolverReady && <p className={styles.errorMessage}>Error: {solverError}</p>}
            {/* Display solution steps only if no error and steps exist */}
            {solutionSteps && !solverError && (
                <div>
                    <h3 className={styles.solutionTitle}>Solution Steps:</h3>
                    <p className={styles.solutionText}>{solutionSteps}</p>
                </div>
            )}
            {/* Display loading indicator */}
            {isSolving && <p>Calculating solution...</p>}
        </div>
      </div>
      <div className={styles.rightPanel}>
        <CubeDisplay
          cubeState={cubeState}
          cubeRotation={cubeRotation} // Pass rotation state
          onFaceletUpdate={handleFaceletUpdate}
          selectedColor={selectedColor}
        />
        <RotationControls onRotate={handleRotate}/>
      </div>
    </div>
  );
}

export default App;