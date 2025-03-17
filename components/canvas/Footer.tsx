import React from 'react';
import styles from './styles';

const Footer: React.FC = () => {
  return (
    <div style={styles.footer}>
      <div style={styles.status}>
        <span>Mirror • Collaborative Canvas • {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default Footer;