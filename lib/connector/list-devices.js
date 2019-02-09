const _serialport = require('../transport/serialport');

// list of known vendor IDs
const knownVendorIDs = [
    // NodeMCU v1.0 - CH341 Adapter | 0x1a86  QinHeng Electronics
    '1a86',

    // NodeMCU v1.1 - CP2102 Adapter | 0x10c4  Cygnal Integrated Products, Inc
    '10c4',

    // NodeMCU v3 - CH340G Adapter | 0x1A86 Nanjing QinHeng Electronics Co., Ltd.
    '1A86'
];

// show connected serial devices
async function listDevices(showAll){
    // get all available serial ports
    const ports = (await _serialport.list()) || [];

    // just pass-through
    if (showAll){
        return ports;

    // filter by vendorIDs
    }else{
        return ports.filter(function(item){
            return knownVendorIDs.includes(item.vendorId);
        });
    }
}

module.exports = listDevices;