# MMM-FilterMonitor

A MagicMirror² module that monitors filter status via Shelly device power consumption, providing visual alerts when filter maintenance is needed.

![Screenshot](./MMM-FilterMonitor.png)

## Features
- Real-time power monitoring via Shelly API
- Three-stage visual alerts (OK/Warning/Critical)
- Customizable threshold values
- Compact and clean display
- Configurable update interval

## Installation
1. Navigate to your MagicMirror `modules` directory
2. Clone this repository:
   ```bash
   cd ~/MagicMirror/modules
   git clone https://github.com/ChrisF1976/MMM-FilterMonitor.git
   ```


## Configuration
Add to your `config.js`:

```javascript
{
    module: "MMM-FilterMonitor",
    position: "top_center",  // Recommended position
    config: {
        shellyDevice: {
            id: "YOUR_SHELLY_ID",
            serverUri: "https://shelly-55-eu.shelly.cloud",
            authKey: "YOUR_API_KEY",
            channel: 0  // Only for multi-channel devices
        },
        thresholds: {
            ok: 50,        // Below this: Filter OK (green)
            warning: 100,  // Between ok-warning: Warning (yellow)
            critical: 150  // Above warning: Critical (red)
        },
        messages: {
            ok: "Filter OK",
            warning: "Check filter soon!",
            critical: "REPLACE FILTER!"
        },
        updateInterval: 30*1000,  // Refresh rate in ms - here: 30s
        showPower: true,       // Show current power value
        showIndicator: true    // Show status bar
    }
}
```
- See [MMM-ShellyPV](https://github.com/ChrisF1976/MMM-ShellyPV) for Shelly config instructions.
- Adjust the thresholds as you need it.
- see CSS to adjust width, font-size and so on...

## Requirements
- [MagicMirror²](https://magicmirror.builders) (v2.15.0 or newer)
- Shelly device with power monitoring capability
- Shelly Cloud API access

## Supported Devices
Tested with:
- Shelly Plug S
- Shelly 1PM
- Shelly 2.5
- Shelly Plus 1PM

## License
MIT © [ChrisF1976]

## Acknowledgments
- MagicMirror² team
- Shelly device support
