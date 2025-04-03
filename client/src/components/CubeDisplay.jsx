import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import styles from './CubeDisplay.module.css'; // Make sure you have corresponding CSS

// --- Cubelet Sub-Component ---
// Represents a single small cube (facelet piece) within the Rubik's Cube.
// It receives its position, colors, unique key, and the update handler from its parent.
function Cubelet({ position, colors, posKey, onFaceletUpdate }) {
  // Ref for potential direct manipulation (though often not needed with R3F)
  const meshRef = useRef();

  // Handler for when a facelet on this specific cubelet is clicked
  const handleClick = (event) => {
    // Stop the event from propagating further (e.g., to OrbitControls).
    // This prevents the camera from moving when trying to click a facelet.
    event.stopPropagation();

    // --- Debugging Logs ---
    // Log information about the click event to the browser console
    console.log('--- Cubelet Click ---');
    console.log('event:', event); // Log the full event object for inspection
    // event.faceIndex tells us which of the 6 faces of the BoxGeometry was clicked
    console.log('event.faceIndex:', event.faceIndex); // Log the index of the clicked face (0-5)
    console.log('posKey:', posKey); // Log the identifier of this cubelet (e.g., "1_0_1")
    // --- End Debugging Logs ---

    // Ensure faceIndex exists (it might not if the click missed the geometry somehow)
    if (event.faceIndex === undefined) {
      console.log('Click did not have faceIndex.');
      return; // Exit if we don't know which face was clicked
    }

    // The faceIndex directly corresponds to the material index (0-5)
    // The standard order is: +x, -x, +y, -y, +z, -z
    const faceIndex = event.faceIndex;

    // Call the update handler function that was passed down as a prop from App.jsx
    // Pass the unique identifier (posKey) of this cubelet and the index of the clicked face
    onFaceletUpdate(posKey, faceIndex);
    console.log('Called onFaceletUpdate'); // Confirm the handler function was invoked
  };

  // Return the 3D mesh for this cubelet
  return (
    // Use the <Box> helper component from @react-three/drei for simplicity
    // It creates a THREE.BoxGeometry and a THREE.Mesh
    // args: [width, height, depth] for the BoxGeometry
    // position: The 3D coordinates for this cubelet
    // onClick: Attach the handleClick function to the mesh's click event
    <Box ref={meshRef} args={[1, 1, 1]} position={position} onClick={handleClick}>
      {/*
        Map the 6 color props (received in the 'colors' array) to 6 materials
        for the 6 faces of the Box geometry.
        The 'attach' prop specifies which property of the parent object (the Box mesh)
        the child component (the material) should be assigned to.
        `material-0` corresponds to the first face, `material-1` to the second, etc.
      */}
      {colors.map((color, index) => (
        <meshStandardMaterial
          key={index} // React key for list rendering
          attach={`material-${index}`} // Attaches material to the correct face slot
          color={color} // Set the color for this face material
        />
      ))}
    </Box>
  );
}


// --- Main Cube Display Component ---
// This component sets up the 3D scene and renders the entire Rubik's Cube
// using the Cubelet components based on the state passed down from App.jsx.
function CubeDisplay({ cubeState, cubeRotation, onFaceletUpdate, selectedColor }) {
  // Constants defining the appearance of the cube
  const cubeletSize = 1; // The size of each individual small cube
  const spacing = 0.05; // The small gap between adjacent cubelets
  const totalSize = cubeletSize + spacing; // Size including spacing
  const offset = totalSize; // How far each cubelet is from the center along an axis (e.g., x=1 is at offset*1)

  // --- Generate Cubelet Components ---
  // Create an array to hold all the <Cubelet /> component instances
  const cubelets = [];
  // Iterate over the keys (e.g., "1_0_-1", "0_1_1") in the cubeState object received from props
  for (const posKey in cubeState) {
    // Parse the position key (like "1_0_-1") back into x, y, z integer coordinates
    const [xStr, yStr, zStr] = posKey.split('_');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const z = parseInt(zStr, 10);
    // Calculate the actual 3D position in the scene based on coordinates and offset
    const position = [x * offset, y * offset, z * offset];

    // Add a Cubelet component to the array for each entry in cubeState
    // Pass down all necessary props:
    // - key: Unique key for React's rendering optimization
    // - posKey: The string identifier ("x_y_z") for this cubelet
    // - position: The calculated 3D coordinates array [x, y, z]
    // - colors: The array of 6 color strings for this cubelet's faces
    // - onFaceletUpdate: The callback function to call when a facelet is clicked
    cubelets.push(
      <Cubelet
        key={posKey}
        posKey={posKey}
        position={position}
        colors={cubeState[posKey]}
        onFaceletUpdate={onFaceletUpdate}
      />
    );
  }

  // Return the JSX structure for the 3D display area
  return (
    // A standard div container used for layout and sizing via CSS
    <div className={styles.cubeCanvasContainer}>
      {/*
        The <Canvas> component from react-three-fiber sets up the core
        THREE.js Scene and WebGLRenderer. It provides a context for
        all the 3D elements within it.
        'camera' prop configures the initial camera settings:
          - position: [x, y, z] where the camera starts
          - fov: Field of view (angle of vision)
      */}
      <Canvas camera={{ position: [3, 3, 6], fov: 50 }}>
        {/* --- Lighting --- */}
        {/* Ambient light provides baseline illumination for the whole scene */}
        <ambientLight intensity={0.7} />
        {/* Directional light simulates a light source like the sun */}
        <directionalLight position={[5, 10, 7.5]} intensity={1.0} />

        {/* --- Cube Structure --- */}
        {/*
          A <group> element acts like a container in the 3D scene.
          Applying the 'rotation' prop here rotates the entire group,
          and thus all the cubelets contained within it.
          The 'cubeRotation' prop (e.g., [xAngle, yAngle, zAngle]) is received from App.jsx.
        */}
        <group rotation={cubeRotation}>
          {/* Render all the generated Cubelet components inside the group */}
          {cubelets}
        </group>

        {/* --- Controls --- */}
        {/*
          <OrbitControls> from @react-three/drei allows users to rotate
          the camera around the scene using the mouse (click & drag),
          zoom (scroll wheel), and pan (right-click & drag).
          'enableDamping' provides smoother camera movement inertia.
        */}
        <OrbitControls enableDamping />
      </Canvas>

      {/* Optional: Display feedback showing the currently selected color */}
      <div style={{ marginTop: '10px', color: '#555', textAlign: 'center', fontSize: '0.9rem' }}>
        Selected:
        <span style={{
            display: 'inline-block',
            width: '15px',
            height: '15px',
            backgroundColor: selectedColor, // Use the selectedColor prop
            border: '1px solid #333',
            verticalAlign: 'middle',
            marginLeft: '5px'
         }}></span>
      </div>
    </div>
  );
}

// Export the component for use in other files (like App.jsx)
export default CubeDisplay;
