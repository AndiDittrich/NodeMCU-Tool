const _serialport = require('../transport/serialport');

// show connected serial devices
async function listDevices(showAll){
    // get all available serial ports
    const ports = (await _serialport.list()) || [];

    // just pass-through
    if (showAll){
        return ports;

    // filter by vendorIDs
    // NodeMCU v1.0 - CH341 Adapter | 0x1a86  QinHeng Electronics
    // NodeMCU v1.1 - CP2102 Adapter | 0x10c4  Cygnal Integrated Products, Inc
    }else{
        return ports.filter(function(item){
            return (item.vendorId == '1a86' || item.vendorId == '10c4');
        });
    }
}

module.exports = listDevices;