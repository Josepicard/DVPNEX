document.addEventListener("DOMContentLoaded", async function () {
    const statusText = document.getElementById("status");
    const toggleButton = document.getElementById("toggle-vpn");
    const peersList = document.getElementById("peers-list");
    
    // Function to update the VPN status
    async function updateStatus() {
        chrome.storage.local.get(["vpnEnabled", "peers"], function (data) {
            const vpnEnabled = data.vpnEnabled || false;
            toggleButton.textContent = vpnEnabled ? "Disconnect" : "Connect";
            statusText.textContent = vpnEnabled ? "VPN is Active" : "VPN is Off";
            updatePeersList(data.peers || []);
        });
    }
    
    // Function to update the peers list
    function updatePeersList(peers) {
        peersList.innerHTML = "";
        if (peers.length === 0) {
            peersList.innerHTML = "<li>No peers connected</li>";
            return;
        }
        peers.forEach(peer => {
            const li = document.createElement("li");
            li.textContent = `Peer: ${peer.id} (${peer.ip}) - Reputation: ${peer.reputation}`;
            peersList.appendChild(li);
        });
    }
    
    // Toggle VPN status
    toggleButton.addEventListener("click", function () {
        chrome.storage.local.get(["vpnEnabled"], function (data) {
            const newStatus = !data.vpnEnabled;
            chrome.storage.local.set({ vpnEnabled: newStatus }, function () {
                chrome.runtime.sendMessage({ action: "toggleVPN", status: newStatus });
                updateStatus();
            });
        });
    });
    
    // Listen for peer updates from background script
    chrome.runtime.onMessage.addListener(function (message) {
        if (message.action === "updatePeers") {
            updatePeersList(message.peers);
        }
    });
    
    // Initial status update
    updateStatus();
});
