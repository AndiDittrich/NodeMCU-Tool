NodeMCU-Tool
============
Upload/Download Lua files to your ESP8266/ESP32 module with NodeMCU firmware.

**Simple. Command Line. Cross-Platform. File Management. [NodeMCU](http://nodemcu.com/index_en.html).**

```shell
$ npm install nodemcu-tool -g
```

![Demo](https://github.com/AndiDittrich/NodeMCU-Tool/raw/master/video.gif)

Tool Summary
-------------
NodeMCU Tool allows you to

* Upload Lua files to your ESP8266/ESP32/NodeMCU module
* Upload any file-types (binary save)
* Bulk/Multi file uploads
* Download any file-type (binary save)
* Delete files
* Format the file system
* Simple Serial Terminal to interact with NodeMCU
* Show existing files on your module
* Precompile Lua files live on NodeMCU
* Minimize Lua files before uploading (provided by [luamin](https://www.npmjs.com/package/luamin))
* Use the **NodeMcuConnector API** in your own projects
* Apply Project based configurations
* Hard-Reset the module using DTR/RTS reset circuit (like NodeMCU DEV Kit)
* Run files on NodeMCU and display the output

directly from the command line.

*Successful tested on Windows10, Debian 8,9 and Ubuntu 14,15,16,17 - works out of the box without any tweaks*

Compatibility
-------------
The following NodeMCU firmware versions are verified

**ESP8266**
* NodeMCU LUA 1.4
* NodeMCU LUA 1.5.1
* NodeMCU LUA 1.5.4

**ESP32**
* preliminary support (esp32-dev.latest)

Related Documents
-----------------

* [Command Reference](docs/CommandReference.md)
* [Common Use-Cases and Examples](docs/Examples.md)
* [Programmatic Usage](docs/ProgrammaticUsage.md)
* [Fixing Reset-on-Connect Issue](docs/Reset_on_Connect.md)
* [File Transfer Encoding](docs/TransferEncoding.md)
* [Webstorm Integration](docs/WebstormIntegration.md)
* [Contribution Guidelines](CONTRIBUTE.md)
* [NodeMCU DEVKIT Schematics](https://github.com/nodemcu/nodemcu-devkit-v1.0/blob/master/NODEMCU_DEVKIT_V1.0.PDF)
* [Changelog](CHANGES.md)
* [License](LICENSE.md)

Terminology
-----------
* **NodeMCU** Original [NodeMCU](http://nodemcu.com/index_en.html) Module **OR** any [ESP8266](http://espressif.com/en/products/esp8266/) platform with [NodeMCU Firmware](https://github.com/nodemcu/nodemcu-firmware)
* **Upload** Transfer files from your PC to NodeMCU/ESP8266 module
* **Download** Transfer files/obtaining information from the module


Requirements
------------

To use/install the NodeMCU-Tool, you have to prepare your system to match the following requirements. Especially as beginner, you should read this part **carefully**

### NodeMCU Serial Driver ###

Depending on your Module-Type you have to install the platform-specific driver for the usb-serial-interface. 
The original NodeMCU v0.9 comes with a CH341 chip with may requires manual driver installation. Modern versions like 1.0 use a CP210x chip with work out of the box on most common systems.
Other ESP8266 platforms may user other interfaces - please refer to their user manuals!


### Node.js ###

The NodeMCU-Tool is written in javascript and requires [Node.js](https://nodejs.org) as runtime environment. And please don't worry about the wording - NodeMCU and Node.js are two **complete different** things!

In case you're not familiar with [Node.js](https://nodejs.org) and [NPM](https://www.npmjs.com) it's recommended to read some [basic introductions](https://docs.npmjs.com/getting-started/what-is-npm) first!
Please [download the Node.js installer](https://nodejs.org/en/download/) and install on your system in case it's not already there.

Installation
------------

Thanks to Node.js, the NodeMCU-Tool is platform independent and will run on Windows, Linux und OSX. There are different installation variants available (system wide or project based). 

### via NPM (Node.js Package Manager) ###

#### Global Installation ####

It's recommended to install nodemcu-tool as [global package](https://docs.npmjs.com/getting-started/installing-npm-packages-globally).
NPM will register the binary automatically in your path - it will be directly available on the command line.

```shell
$ npm install nodemcu-tool -g
```

#### Global Installation as root ####

The global installation may require administrator(root) privileges because the package is added to the systems library path. If you get any permission errors on Linux/Mac OS run the command as root or via `sudo`

```shell
$ sudo npm install nodemcu-tool -g
```

#### Local/Project related Installation ####

You can also install it in your local project directory. When using this method, the `nodemcu-tool` command is **not registered** within your path!

```shell
$ npm install nodemcu-tool
```

In this case, the binary file is located in `node_modules/nodemcu-tool/bin/nodemcu-tool.js`

### As Archive from GitHub ###

You can also download the [latest release](https://github.com/AndiDittrich/NodeMCU-Tool/releases/latest) directly from [GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/releases) and extract the sources to your project directory.
When using this method, the `nodemcu-tool` command is **not registered** within your path. You have to register it manually using a symlink - or the recommended way: call the binary file `./bin/nodemcu-tool.js` directly.

First Steps
-----------

### 1. The Location of the binary file ###

After installing **NodeMCU-Tool** you should open a **new** terminal window and check if the tool is working by obtaining the current version. It should output the current semantic-version tag.
Depending on your installation type (global ==> file is registered into your path) you can use the tool directly or you have to go into the module directory:

#### For Global Installations (Win/Linux/OSX) ####

The binary file is registered within your path. This tutorial assumes that you have installed the tool globally. Otherwise you have to modify the program-call as described below.

```bash
$ nodemcu-tool --version
1.5.0
```

#### For Local Installations ####

This means you have installed nodemcu-tool via NPM **without** the `-g` (global) flag or via the `.zip` / `.tar` package.
There will be **no** global shortcut to the nodemcu-tool binary! The binary is located in `node_modules/nodemcu-tool/bin/nodemcu-tool.js`

##### Linux, OSX #####

```bash
$ cd node_modules/nodemcu-tool/bin
$ ./nodemcu-tool.js --version
1.5.0
```

##### Windows #####

You have to call the node.exe runtime in your command!

```bash
$ cd node_modules/nodemcu-tool/bin
$ node nodemcu-tool.js --version
1.5.0
```

### 2. Identify Your NodeMCU Device ###

Now you can connect the NodeMCU Module to your computer. The module will be accessible via a virtual serial port. You can identify the port by using the `devices` command.
In this example, it is connected via `/dev/ttyUSB0`. Keep in mind that you have to provide the device-name to NodeMCU-Tool on each command!

```shell
./nodemcu-tool devices
[NodeMCU] Connected Devices | Total: 1
          |- /dev/ttyUSB0 (Silicon_Labs, usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0)
```

### 3. Create the initial File System ###
This will remove all existing files on the module but is required when running the module **for the first time**. You can skip this step in case you've already done that manually!

```shell
$ nodemcu-tool mkfs --port=/dev/ttyUSB0
[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Formatting the file system...this will take around ~30s
[NodeMCU] File System created | format done.
```

### 4. Upload a new File ###

**Hint** include the native [encoder Module](http://nodemcu.readthedocs.io/en/master/en/modules/encoder/) into your firmware to speed-up the uploading by factor 4..10!

```shell
$ nodemcu-tool upload --port=/dev/ttyUSB0 helloworld.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "main.lua" ...
[NodeMCU-Tool] Data Transfer complete!
```

### 5. Run It directly and view the output ###

```shell
$ nodemcu-tool run helloworld.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Running "helloworld.lua"
>----------------------------->
Hello World!
YEAH!!! HELLO WORLD!!!
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
>----------------------------->
```

### Available Commands ###

All commands a well documented within the [Command Reference](docs/CommandReference.md)

Project based configuration
---------------------------

In case you're using different serial port or the baudrate-settings, it's possible to create a configuration file with specific settings for your project.
To initially create the configuration file, use the `init` command:

```shell
$ nodemcu-tool init
[NodeMCU-Tool] Creating project based configuration file..
[NodeMCU-Tool] Baudrate in Bit per Seconds, e.g. 9600 (default) (9600) 9600
[NodeMCU-Tool] Serial connection to use, e.g. COM1 or /dev/ttyUSB2 (/dev/ttyUSB0) COM3
```

This will create a JSON based configuration file named `.nodemcutool` in your **current directory** - you can edit this file manually

### Example Configuration ###

In this Example, the baudrate is changed to 19.2k and COM3 is selected as default port. Additionally the `--minify` and `--compile` flags are set permanently.

```json
{
    "baudrate": "19200",
    "port": "COM3",
    "connectionDelay": 100,
    "compile": true,
    "minify": true,
    "keeppath": true
}
```
 
### Configuration Keys ###

All configuration options are **optional**

* **baudrate** (int) - the default baudrate in bits per second
* **port** (string) - the comport to use
* **connectionDelay** (int) - connection-delay in ms
* **compile** (boolean) - compile lua files after upload
* **minify** (boolean) - minifies files before uploading
* **keeppath** (boolean) - keep the relative file path in the destination filename (i.e: static/test.html will be named static/test.html)
 
 
### Notes ###
  
* NodeMCU-Tool will only search in the **current directory** for the `.nodemcutool` file!
* All default options can be overwritten by using the command line options
* The `.nodemcutool` file is only recognized in `CLI Mode` **NOT** in `API Mode`

Behind the Scene
----------------
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

Programmatic Usage and Low Level API
------------------------------------
It's possible to use the underlying "NodeMcuConnector" in your own projects to communicate with a NodeMCU based device.
Or you can call the `bin` file with an external tool. For more details, take a look into the [Programmatic Usage Guide](docs/ProgrammaticUsage.md)

FAQ
---

#### Do you provide more Examples/Use Cases ? ####
Of course, check the [Examples](docs/Examples.md) file (tool usage) as well as the `examples/` directory for third party examples

#### The serial file transfer is pretty slow ####
By default, the serial connection uses a 9600 baud with 8N1 - this means maximal 960 bytes/s raw data rate.
Due to the limitations of a line-wise file upload, these maximal transfer rate cannot be reached, because every line has to be processed by the lua interpreter and NodeMCU-Tool is waiting for it's response.
It's recommended to use the `--minify` flag to minify the code before uploading. Additionally, newer firmware versions `1.x.x` using an auto-baudrate detection algorithm - this means you can increase the baudrate to e.g. 115200 `--baud 115200` to speed up the transfer 

Additionally include the native [encoder Module](http://nodemcu.readthedocs.io/en/master/en/modules/encoder/) into your firmware to speed-up the uploading by factor 4..10!

Any Questions ? Report a Bug ? Enhancements ?
---------------------------------------------
Please open a new issue on [GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues)

Contributing
------------

Contributors are welcome! Even if you are not familiar with javascript you can help to improve the documentation!

License
-------
NodeMCU-Tool is OpenSource and licensed under the Terms of [The MIT License (X11)](http://opensource.org/licenses/MIT). You're welcome to [contribute](https://github.com/AndiDittrich/NodeMCU-Tool/blob/master/CONTRIBUTE.md)!
