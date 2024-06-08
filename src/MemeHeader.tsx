import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PermissionType } from 'arconnect';
import './MemeHeader.css';

const permissions: PermissionType[] = [
  'ACCESS_ADDRESS',
  'SIGNATURE',
  'SIGN_TRANSACTION',
  'DISPATCH'
];

const MemeHeader: React.FC = () => {
  const [address, setAddress] = useState('');

  const connectWallet = async () => {
    await window.arweaveWallet.connect(
      permissions,
      {
        name: "AO-GRAD",
        logo: "r0THy0vN0VqEhdg8sZNBVPfu30wBwgUefdGOTsQ0SaY"
      }
    );
    try {
      const address = await window.arweaveWallet.getActiveAddress();
      setAddress(address);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="meme-header">
      <div className="meme-header-container">
        <div className="meme-header-logo">
          <Link to="/">AO-Guard</Link>
        </div>
        <nav className="meme-header-nav">
          <ul className="meme-header-list">
            <li className="meme-header-item"><Link to="/">Home</Link></li>
            <li className="meme-header-item"><Link to="/vote">Vote</Link></li>
            <li className="meme-header-item">
              <button onClick={connectWallet} className="connect-wallet-button">
                {address ? `${address.slice(0, 5)}...${address.slice(-3)}` : 'Connect Wallet'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default MemeHeader;
