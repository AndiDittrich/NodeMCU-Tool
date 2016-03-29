import subprocess
import json

# Capture Exception to handle the return_code
try:
    # Run NodeMCU-Tool to fetch a list of available devices
    output = subprocess.check_output(['node', '../bin/nodemcu-tool.js', 'devices', '--json'])

except subprocess.CalledProcessError as exc:
    print "NodeMCU-Tool Error: Code: ", exc.returncode, " - ", exc.output
    quit()

# Decode the json output
devices = json.loads(output)

# Check result
if len(devices) == 0:
    # Error, no devices
    print "No Devices found!"
    quit();

else:
    print "Possible NodeMCU Devices found:"

    # Output Device List
    for device in devices:
        print ">>", device["vendorId"], "(", device["pnpId"], ") on",  device["comName"]