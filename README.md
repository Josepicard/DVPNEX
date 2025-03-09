# DVPN Chrome Extension

## Overview
The **DVPN Chrome Extension** is a decentralized VPN built using **libp2p** to enable peer-to-peer network routing without relying on centralized servers. It leverages **libp2p-kad-dht** for peer discovery, updates the browser's proxy settings dynamically using a PAC script, and includes a reputation system for managing peer trust.

## Features
- **Peer-to-peer VPN** using `libp2p`
- **Decentralized peer discovery** with `libp2p-kad-dht` and `libp2p-mdns`
- **Proxy auto-configuration (PAC script)** updates dynamically based on connected peers
- **Reputation-based peer management** to ensure security and reliability
- **Browser UI** to control VPN settings

## Project Structure
```
DVPN-Chrome-Extension/
│── background.js      # Handles networking, proxy settings, and reputation system
│── popup.html         # Frontend UI
│── popup.js           # Handles UI interactions
│── manifest.json      # Chrome extension manifest
│── README.md          # Documentation
```

## How It Works
### 1. `background.js`
- Initializes a `libp2p` node for peer discovery and communication.
- Manages a **peer reputation system** to track peer reliability.
- Updates **proxy settings** dynamically by modifying the PAC script.

### 2. `popup.html` & `popup.js`
- Provides a simple user interface to control the VPN.
- Allows users to start/stop the VPN and view connected peers.

### 3. `manifest.json`
- Defines permissions for proxy settings, storage, and web requests.
- Configures the background script and popup UI.

## Security Considerations
- **Reputation system**: Peers with bad reputation are disconnected.
- **Encryption**: Ensure secure peer communication using TLS.
- **Traffic filtering**: Prevent abuse by monitoring peer behavior.

## Future Enhancements
- WebRTC support for improved peer-to-peer connectivity
- Better UI/UX for managing peers and VPN status
- Advanced security mechanisms (e.g., rate limiting, encryption improvements)

## License
MIT License

