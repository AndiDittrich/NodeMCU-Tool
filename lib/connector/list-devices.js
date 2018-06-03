const _serialport = require('../transport/serialport');

const knownVendorIds = ['1a86', '10c4', '1A86'];

// show connected serial devices
async function listDevices(showAll) {
    // get all available serial ports
    const ports = (await _serialport.list()) || [];

    // just pass-through
    if (showAll) {
        return ports;

    } else {
        return ports.filter(function(item) {
            if (item.vendorId == null) {
                return false;
            }
            return (knownVendorIds.indexOf(item.vendorId) !== -1)
        });
    }
}

module.exports = listDevices;
