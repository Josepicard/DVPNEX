import Libp2p from 'libp2p';
import WebSockets from 'libp2p-websockets';
import MDNS from 'libp2p-mdns';
import kadDHT from 'libp2p-kad-dht';
import { TLS } from 'libp2p-tls';  // TLS for encrypted connections
import { createLibp2p } from 'libp2p';
import { randomBytes } from 'crypto';  // For creating HMAC signatures

// Constants for reputation system
const MIN_REPUTATION = -100;
const MAX_REPUTATION = 100;
const REPUTATION_INCREMENT = 5;
const REPUTATION_DECREMENT = 10;
const REPUTATION_BAD_THRESHOLD = -50;

// Function to update PAC script with the peer's IP
function updatePACScript(peerIp) {
  const pacScript = `
    function FindProxyForURL(url, host) {
      return "PROXY ${peerIp}:8080";  // Replace with actual peer's IP and port
    }
  `;
  
  chrome.proxy.settings.set({
    value: {
      mode: "pac_script",  // Use PAC script mode
      pacScript: {
        data: pacScript,  // The dynamically generated PAC script
      }
    },
    scope: "regular"  // Apply to regular browsing
  }, function () {
    console.log("Proxy settings updated with peer IP:", peerIp);
  });
}

// Set up libp2p configuration with TLS encryption
async function setupLibp2p() {
  const node = await createLibp2p({
    modules: {
      transport: [WebSockets, TLS],  // Use TLS for encrypted connections
      peerDiscovery: [MDNS],
      dht: kadDHT,
    },
    config: {
      transport: {
        tls: {
          enabled: true,  // Enable TLS encryption
        },
      },
      peerDiscovery: {
        mdns: {
          enabled: true,
          interval: 1000,  // Discover peers over local network
        },
      },
      dht: {
        enabled: true,  // Enable the DHT module
      },
    },
  });

  // Start the libp2p node
  await node.start();
  console.log('libp2p Node started!');

  // Log the node's peer ID
  console.log('Peer ID:', node.peerId.toB58String());

  // Store connected peers and reputation data
  const peers = new Map();

  // Handle when we receive a new peer
  node.on('peer:discovery', (peerId) => {
    console.log('Discovered peer:', peerId.toB58String());
    peers.set(peerId.toB58String(), { reputation: 0, uptime: 0, traffic: 0 });
    connectToPeer(node, peerId, peers);
  });

  // Set up connection handling for when peers connect
  node.on('peer:connect', (peerId) => {
    console.log('Connected to peer:', peerId.toB58String());

    // Get the peer's IP address dynamically (WebRTC/WebSockets)
    const peerIp = getPeerIp(peerId);  // Replace with actual method to retrieve peer IP

    // Update the PAC script with the peer's IP
    updatePACScript(peerIp);

    // Update peer's reputation based on connection
    updateReputation(peerId, peers, 'connect');
  });

  // Set up disconnection event to track peer uptime
  node.on('peer:disconnect', (peerId) => {
    console.log('Disconnected from peer:', peerId.toB58String());
    updateReputation(peerId, peers, 'disconnect');
  });

  return node;
}

// Function to get the peer's IP address
function getPeerIp(peerId) {
  const peerInfo = node.peerStore.get(peerId);
  if (peerInfo && peerInfo.multiaddrs.length > 0) {
    // Extract the IP address from the multiaddr
    const multiaddr = peerInfo.multiaddrs[0].toString();
    const ipMatch = multiaddr.match(/\/ip4\/([^/]+)\//);
    if (ipMatch) {
      return ipMatch[1];
    }
  }
  return null;  // Return null if IP address is not found
}

// Function to update peer's reputation
function updateReputation(peerId, peers, action) {
  let peer = peers.get(peerId.toB58String());
  
  if (!peer) {
    return;
  }

  if (action === 'connect') {
    // Increase reputation for connecting successfully
    peer.reputation += REPUTATION_INCREMENT;
    peer.uptime += 1;  // Track uptime in minutes (or another unit)
  } else if (action === 'disconnect') {
    // Decrease reputation if disconnected early or unexpectedly
    peer.reputation -= REPUTATION_DECREMENT;
    peer.uptime = Math.max(0, peer.uptime - 1);  // Ensure uptime does not go below zero
  }

  // Check if peer reputation goes below the bad threshold
  if (peer.reputation < REPUTATION_BAD_THRESHOLD) {
    console.log('Peer has bad reputation, disconnecting:', peerId.toB58String());
    node.hangUp(peerId).then(() => {
      console.log('Disconnected from peer due to bad reputation:', peerId.toB58String());
      peers.delete(peerId.toB58String());  // Remove from peers list
    }).catch((err) => {
      console.error('Error disconnecting from peer:', err);
    });
  }

  if (peer.reputation > MAX_REPUTATION) {
    peer.reputation = MAX_REPUTATION;
    console.log('Peer reputation adjusted to MAX_REPUTATION:', peerId.toB58String());
  } else if (peer.reputation < MIN_REPUTATION) {
    peer.reputation = MIN_REPUTATION;
    console.log('Peer reputation adjusted to MIN_REPUTATION:', peerId.toB58String());
  }
}



// Function to send messages/data to peers
function sendDataToPeer(node, data) {
  const peers = Array.from(node.peerStore.peers.keys());
  if (peers.length === 0) {
    console.error('No peers available to send data');
    return;
  }

  const peerId = peers.find(peerId => node.connectionManager.get(peerId));
  if (!peerId) {
    console.error('No connected peers available to send data');
    return;
  }

  node.dialProtocol(peerId, ['/my-protocol/1.0.0']).then(({ stream }) => {
    stream.sink([data]);
    console.log('Data sent to peer:', peerId.toB58String());
  }).catch((err) => {
    console.error('Failed to send data to peer:', err);
  });
}

// Call the function to set up the libp2p node
setupLibp2p();
