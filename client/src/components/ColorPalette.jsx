import React from 'react';
import styles from './ColorPalette.module.css'; // Ensure CSS module exists

// Define the standard Rubik's cube colors
const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Green', hex: '#008000' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
];

// Component to display the selectable color squares
function ColorPalette({ selectedColor, onColorSelect }) {

  // Intermediate handler to add logging before calling the prop function
  const handleColorClick = (color) => {
    // --- Debugging Logs ---
    console.log(`--- ColorPalette Click ---`);
    console.log(`Clicked color: ${color.name} (${color.hex})`); // Log which color was clicked
    // --- End Debugging Logs ---

    // Call the onColorSelect function passed down from App.jsx
    // This function should be the 'setSelectedColor' state setter from App
    onColorSelect(color.hex);
    console.log(`Called onColorSelect with: ${color.hex}`); // Confirm it was called with the correct value
  };

  return (
    // Container for the color squares, uses CSS grid for layout
    <div className={styles.palette}>
      {/* Map over the COLORS array to create a button for each color */}
      {COLORS.map((color) => (
        <button
          key={color.hex} // Unique key for React
          // Apply base style and 'selected' style if this color matches the selectedColor prop
          className={`${styles.colorSquare} ${
            selectedColor === color.hex ? styles.selected : ''
          }`}
          // Set the background color of the button directly
          style={{ backgroundColor: color.hex }}
          // Call the intermediate handler when the button is clicked
          onClick={() => handleColorClick(color)}
          // Accessibility attributes
          aria-label={`Select ${color.name} color`}
          title={color.name} // Tooltip showing color name on hover
        />
      ))}
    </div>
  );
}

export default ColorPalette;
