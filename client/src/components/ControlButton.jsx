import React from 'react';
import styles from './ControlButton.module.css';

function ControlButton({ label, onClick }) {
  return (
    <button className={styles.controlButton} onClick={onClick}>
      {label}
    </button>
  );
}

export default ControlButton;