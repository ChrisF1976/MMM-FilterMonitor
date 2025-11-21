const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        this.config = null;
        this.isFetching = false; // Lock für parallele Abfragen
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "GET_STATUS") {
            this.fetchStatus();
        }
    },

    fetchStatus: async function() {
        if (!this.config?.shellyDevice) return;
        
        // Verhindere parallele Ausführungen
        if (this.isFetching) {
            console.log("FilterMonitor: Fetch already in progress, skipping...");
            return;
        }

        this.isFetching = true;

        try {
            let retryCount = 0;
            const maxRetries = 1;
            
            while (retryCount <= maxRetries) {
                try {
                    console.log(`FilterMonitor: Fetching status for ${this.config.shellyDevice.name || this.config.shellyDevice.id}...`);
                    
                    const response = await axios.post(
                        `${this.config.shellyDevice.serverUri}/device/status`,
                        `id=${this.config.shellyDevice.id}&auth_key=${this.config.shellyDevice.authKey}`,
                        { 
                            timeout: 10000, // Erhöht auf 10 Sekunden
                            headers: { "Content-Type": "application/x-www-form-urlencoded" }
                        }
                    );

                    const power = this.parsePower(response.data);
                    console.log(`FilterMonitor: ✓ Successfully fetched ${this.config.shellyDevice.name || this.config.shellyDevice.id}: ${power !== null ? power + 'W' : 'No power data'}`);
                    
                    this.sendUpdate(power);
                    break; // Erfolg - Schleife verlassen
                    
                } catch (error) {
                    if (error.response?.status === 429 && retryCount < maxRetries) {
                        console.error(`FilterMonitor: ✗ Rate limit hit (Retry ${retryCount + 1}/${maxRetries})`);
                        
                        console.log("FilterMonitor: Waiting 11 seconds before retry...");
                        await new Promise(resolve => setTimeout(resolve, 11000));
                        retryCount++;
                        continue; // Nochmal versuchen
                    } else {
                        // Endgültiger Fehler
                        if (error.response?.status === 429) {
                            console.error("FilterMonitor: ✗ Rate limit hit - no more retries");
                        } else {
                            console.error("FilterMonitor: ✗ Fetch error:", error.message);
                        }
                        
                        this.sendUpdate(null);
                        break;
                    }
                }
            }

        } catch (error) {
            console.error("FilterMonitor: Unexpected error:", error);
            this.sendUpdate(null);
        } finally {
            this.isFetching = false; // Lock immer freigeben
        }
    },

    parsePower: function(data) {
        const status = data?.data?.device_status;
        if (!status) return null;

        // Unterstützt alle Shelly-Gerätetypen
        if (status.relays) {
            const channel = this.config.shellyDevice.channel || 0;
            return status.meters?.[channel]?.power || null;
        }
        if (status["pm1:0"]) return status["pm1:0"].apower;
        if (status["switch:0"]) return status["switch:0"].apower;
        if (status.lights) return status.meters?.[0]?.power || null;

        return null;
    },

    sendUpdate: function(power) {
        this.sendSocketNotification("STATUS_UPDATE", {
            power: power,
            status: power !== null ? 'on' : 'off'
        });
    }
});
