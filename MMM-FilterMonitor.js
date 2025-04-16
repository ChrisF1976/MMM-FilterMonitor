Module.register("MMM-FilterMonitor", {
    defaults: {
        shellyDevice: {
            name: "Filterpumpe",
            id: "IHR_SHELLY_ID",       // Beispiel: "a12b34c56d78"
            serverUri: "https://shelly-55-eu.shelly.cloud",
            authKey: "IHR_API_KEY",    // 32-stelliger Shelly Cloud Key
            channel: 0                 // Optional für mehrkanalige Geräte
        },
        thresholds: {
            ok: 50,        // Unter diesem Wert: Filter OK
            warning: 100,  // Zwischen ok und warning: Warnung
            critical: 150,  // Über warning: Kritisch
        },
        messages: {
            ok: "Filter OK ✓",
            warning: "Filter bald wechseln!",
            critical: "FILTER WECHSELN!",
            error: "Keine Verbindung"
        },
        updateInterval: 5000,  // 5 Sekunden
        showPower: true,       // Stromverbrauch anzeigen
        showIndicator: true    // Balken-Anzeige
    },

    start: function() {
        this.status = "loading";
        this.power = null;
        this.sendConfig();
    },

    getStyles: function() {
        return ["MMM-FilterMonitor.css"];
    },

    sendConfig: function() {
        this.sendSocketNotification("CONFIG", this.config);
        this.scheduleUpdate();
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.sendSocketNotification("GET_STATUS");
        }, this.config.updateInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "STATUS_UPDATE") {
            this.power = payload.power;
            this.updateStatus();
            this.updateDom(500);
        }
    },

updateStatus: function() {
    // Sicherstellen dass die Werte numerisch sind
    const power = parseFloat(this.power);
    const t = {
        ok: parseFloat(this.config.thresholds.ok),
        warning: parseFloat(this.config.thresholds.warning),
        critical: parseFloat(this.config.thresholds.critical)
    };

    // Debug-Ausgabe der Werte
    console.log(`Power: ${power}W, Thresholds: ok=${t.ok}, warning=${t.warning}, critical=${t.critical}`);

    if (isNaN(power)) {
        this.status = "error";
        return;
    }

    // Korrigierte Logik mit klaren Grenzen
    if (power <= t.ok) {
        this.status = "ok";
    } else if (power > t.ok && power <= t.warning) {
        this.status = "warning";
    } else if (power > t.warning && power <= t.critical) {
        this.status = "critical";
    } else {
        this.status = "critical"; // Für Werte über critical
    }

    // Debug-Ausgabe des berechneten Status
    console.log(`Calculated status: ${this.status}`);
},


    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "filter-monitor";

        // Status-Anzeige
        const statusEl = document.createElement("div");
        statusEl.className = `status ${this.status}`;
        statusEl.innerHTML = this.getStatusText();
        wrapper.appendChild(statusEl);

        // Balken-Anzeige
        if (this.config.showIndicator) {
            wrapper.appendChild(this.createIndicator());
        }

        return wrapper;
    },

    getStatusText: function() {
        let text = this.config.messages[this.status];
        if (this.config.showPower && this.power !== null) {
            text += ` <span class="power">(${this.power.toFixed(1)}W)</span>`;
        }
        return text;
    },

    createIndicator: function() {
        const indicator = document.createElement("div");
        indicator.className = "indicator";

        const maxPower = this.config.thresholds.critical;
        const width = this.power !== null 
            ? Math.min((this.power / maxPower) * 100, 100) 
            : 0;

        indicator.innerHTML = `
            <div class="bar ${this.status}" style="width: ${width}%"></div>
            <div class="marker ok" style="left: ${(this.config.thresholds.ok / maxPower) * 100}%"></div>
            <div class="marker warning" style="left: ${(this.config.thresholds.warning / maxPower) * 100}%"></div>
        `;

        return indicator;
    }
});