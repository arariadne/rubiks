// src/components/RotationControls.jsx (Should be correct already)
import React from 'react';
import styles from './RotationControls.module.css';

function RotationControls({ onRotate }) {
  return (
    <div className={styles.rotationContainer}>
      <button className={styles.rotateButton} onClick={() => onRotate('left')} aria-label="Rotate Left">
        &#x21B2; {/* Left arrow */}
      </button>
      <button className={styles.rotateButton} onClick={() => onRotate('up')} aria-label="Rotate Up">
        &#x2191; {/* Upwards arrow */}
      </button>
       <button className={styles.rotateButton} onClick={() => onRotate('right')} aria-label="Rotate Right">
        &#x21B3; {/* Right arrow */}
      </button>
    </div>
  );
}

export default RotationControls;
