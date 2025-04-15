import React from 'react';
import styles from './ColorPalette.module.css';

const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Green', hex: '#008000' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
];

function ColorPalette({ selectedColor, onColorSelect }) {
  const handleColorClick = (color) => {
    onColorSelect(color.hex); // Call the passed-in function
  };

  return (
    <div className={styles.palette}>
      {COLORS.map((color) => (
        <button
          key={color.hex}
          className={`${styles.colorSquare} ${
            selectedColor === color.hex ? styles.selected : ''
          }`}
          style={{ backgroundColor: color.hex }}
          onClick={() => handleColorClick(color)}
          aria-label={`Select ${color.name} color`}
          title={color.name}
        />
      ))}
    </div>
  );
}

export default ColorPalette;