const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
    start: function() {
        this.config = null;
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

        try {
            const response = await axios.post(
                `${this.config.shellyDevice.serverUri}/device/status`,
                `id=${this.config.shellyDevice.id}&auth_key=${this.config.shellyDevice.authKey}`,
                { timeout: 3000 }
            );

            const power = this.parsePower(response.data);
            this.sendUpdate(power);

        } catch (error) {
            console.error("FilterMonitor fetch error:", error.message);
            this.sendUpdate(null);
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