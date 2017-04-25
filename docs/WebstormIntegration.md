How to use with Webstorm IDE
=====================================

Step 1 - Add nodemcu-tool as a local dependency
-------------------------------------------

```terminal
npm install -s nodemcu-tool
```

Step 2 -  Add scripts like these into your package.json
-------------------------------------------

```json
"scripts": {
        "ls":"node_modules/.bin/nodemcu-tool fsinfo",
        "upload-app":"node_modules/.bin/nodemcu-tool upload app/*",
        "devices":"node_modules/.bin/node_modules/.bin/nodemcu-tool devices",
        "format":"node_modules/.bin/nodemcu-tool mkfs --noninteractive",
        "flash-fw":"esptool.py --port /dev/tty.SLAB_USBtoUART write_flash -fm qio 0x00000 firmware/nodemcu-master-10-modules-2017-04-12-15-24-09-float.bin",
        "flash-fw-dev":"esptool.py --port /dev/tty.SLAB_USBtoUART write_flash -fm qio 0x00000 firmware/nodemcu-dev-10-modules-2017-04-14-15-13-54-float.bin",
        "erease-flash-fw":"esptool.py --port /dev/tty.SLAB_USBtoUART erase_flash",
        "pwd": "pwd",

        "terminal":"node_modules/.bin/nodemcu-tool terminal",
        "terminal-py":"nodemcu-uploader --port /dev/tty.SLAB_USBtoUART terminal"
    },
    
 ```

Suggested Workflow
-------------------------------------------

The actual workflow is something like this:

1. ensure no (nodemcu) terminal is running; start upload-app via double click in npm window; look for errors
2. in (webstorm) terminal window enter npm run terminal-py
3. enter there node.restart()
4. ctrl+ü ends (nodemcu) terminal; repeat from 1
