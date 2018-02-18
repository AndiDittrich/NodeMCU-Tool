Behind the Scene
==================================

Many beginners may ask how the tool is working because there is no binary interface documented like FTP to access files.

The answer is quite simple: **NodeMCU-Tool** implements a serial terminal connection to the Module and runs some command line based lua commands like file.open(), file.write() to access the filesystem. That's it!

Since Version 1.2 it's also possible to transfer **binary** files to your device. NodeMCU-Tool uses a hexadecimal encode/decoding to transfer the files binary save!
The required encoding (file downloads) / decoding (file uploads) functions are automatically uploaded on each operation.

### Systems Architecture ###

The Tool is separated into the following components (ordered by its invocation)

  1. `bin/nodemcu-tool.js` - the command line user interface handler based on [commander](https://www.npmjs.com/package/commander)
  2. `cli/nodemcu-tool.js` - Highlevel Access to the main functions. Error and Status messages are handled there
  3. `lib/nodemcu-connector.js` - the Core which handles the Lua command based communication to the NodeMCU Module
  4. `lib/connector/*.js` - low-level command handlers
  5. `lib/transport/scriptable-serial-terminal.js` - the lowlevel part - a terminal session to the NodeMCU Module to run the Lua commands
  6. `lib/transport/serialport.js` - a wrapper to handle the serial transport

### Application Stack ###

```
CLI User Frontend
+----------------------+
|                      |
|    nodemcu-tool      |
|                      |
++---------------------+
|| Message and Error Handling
++---------------------+
|                      |
|  lib/NodeMCU-Tool.js |
|                      |
++---------------------+
|| Core Functions
++---------------------+
|                      |
| lib/NodeMcuConnector |
|                      |
++---------------------+
|| Low|Level Command Transport
++---------------------+
|                      |
|lib/ScriptableSerial- |
|Terminal              |
++---------------------+
|| Serial Communication
++---------------------+
|  node|serialport     |
+----------------------+
```