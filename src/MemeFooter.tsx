import React from 'react';
import { Link } from 'react-router-dom';
import './MemeFooter.css';

const MemeFooter: React.FC = () => {
  return (
    <footer className="meme-footer">
      <div className="meme-footer-container">
        <div className="meme-footer-logo">
          <Link to="/">
            <img src="logo.png" alt="AO-Guard Logo" className="meme-footer-logo-img" />
          </Link>
        </div>
        <div className="meme-footer-links">
          <Link to="/vote" className="meme-footer-link">Vote</Link>
          <a href="https://example.com/contribute" target="_blank" rel="noopener noreferrer" className="meme-footer-link">Contribute</a>
          <a href="https://example.com/terms" target="_blank" rel="noopener noreferrer" className="meme-footer-link">Terms and Conditions</a>
          <a href="https://example.com/contact" target="_blank" rel="noopener noreferrer" className="meme-footer-link">Contact Us</a>
          <a href="https://example.com/support" target="_blank" rel="noopener noreferrer" className="meme-footer-link">Support</a>
          <a href="https://example.com/faq" target="_blank" rel="noopener noreferrer" className="meme-footer-link">FAQ</a>
        </div>
      </div>
      <div className="meme-footer-bottom">
        <p>&copy; 2024 AO-Guard. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default MemeFooter;
