NodeMCU-Tool
============
Upload/Download Lua files to your ESP8266 module with NodeMCU firmware.

**Simple. Command Line. Cross-Platform. File Management. [NodeMCU](http://nodemcu.com/index_en.html).**

```shell
$ npm install nodemcu-tool -g
```

![Demo](https://github.com/AndiDittrich/NodeMCU-Tool/raw/master/video.gif)

Tool Summary
-------------
NodeMCU Tool allows you to

* Upload Lua files to your ESP8266/NodeMCU module
* Upload any file-types (binary save)
* Bulk/Multi file uploads
* Download any file-type (binary save)
* Delete files
* Format the file system
* Simple Serial Terminal to interact with NodeMCU
* Show existing files on your module
* Precompile Lua files live on NodeMCU
* Optimize Lua files before uploading by stripping comments (saves flash memory)
* Use the **NodeMcuConnector API** in your own projects
* Apply Project based configurations
* Hard-Reset the module using DTR/RTS reset circuit (like NodeMCU DEV Kit)
* Run files on NodeMCU and display the output

directly from the command line.

*Successful tested on Windows10, Debian 8.2 and Ubuntu 14 LTS - works out of the box without any tweaks*

Compatibility
-------------
The following NodeMCU firmware versions are verified

* NodeMCU LUA 1.4
* NodeMCU LUA 1.5.1
* NodeMCU LUA 1.5.4

Related Documents
-----------------

* [Common Use-Cases and Examples](docs/Examples.md)
* [Programmatic Usage](docs/ProgrammaticUsage.md)
* [Fixing Reset-on-Connect Issue](docs/Reset_on_Connect.md)
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

```shell
$ nodemcu-tool upload --port=/dev/ttyUSB0 --optimize helloworld.lua
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

In this Example, the baudrate is changed to 19.2k and COM3 is selected as default port. Additionally the `--optimize` and `--compile` flags are set permanently.

```json
{
    "baudrate": "19200",
    "port": "COM3",
    "compile": true,
    "optimize": true,
    "keeppath": true
}
```
 
### Configuration Keys ###

All configuration options are **optional**

* **baudrate** (int) - the default baudrate in bits per second
* **port** (string) - the comport to use
* **compile** (boolean) - compile lua files after upload
* **optimize** (boolean) - optimize files before uploading
* **keeppath** (boolean) - keep the relative file path in the destination filename (i.e: static/test.html will be named static/test.html)
 
 
### Notes ###
  
* NodeMCU-Tool will only search in the **current directory** for the `.nodemcutool` file!
* All default options can be overwritten by using the command line options
* The `.nodemcutool` file is only recognized in `CLI Mode` **NOT** in `API Mode`

Usage
-----

### General Syntax ###

```shell
$ nodemcu-tool [options] command [args..]
```

## Connection ##
To configure the connection settings you can use the global options `--port <port>` and `--baud <baudrate>` to select the serial port and baudrate.
The default values are **115200bps** as baudrate and **/dev/ttyUSB0** as serial device

**Example**

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --baudrate=9600 run test.lua
```

## Show Help ##
To get an overview of all available commands, just call the tool with the `--help` option.

**Example**

```shell
$ nodemcu-tool --help

  Usage: nodemcu-tool [options] [command]


  Commands:

    fsinfo [options]             Show file system info (current files, memory usage)
    run <file>                   Executes an existing .lua or .lc file on NodeMCU
    upload [options] [files...]  Upload Files to NodeMCU (ESP8266) target
    download <file>              Download files from NodeMCU (ESP8266) target
    remove <file>                Removes a file from NodeMCU filesystem
    mkfs [options]               Format the SPIFFS filesystem - ALL FILES ARE REMOVED
    terminal [options]           Opens a Terminal connection to NodeMCU
    init                         Initialize a project-based Configuration (file) within current directory
    devices [options]            Shows a list of all available NodeMCU Modules/Serial Devices
    reset [options]              Execute a Hard-Reset of the Module using DTR/RTS reset circuit
    *

  Options:

    -h, --help                  output usage information
    -V, --version               output the version number
    -p, --port <port>           Serial port device name e.g. /dev/ttyUSB0, COM1
    -b, --baud <baudrate>       Serial Port Baudrate in bps, default 115200
    --silent                    Enable silent mode - no status messages are shown
    --connection-delay <delay>  Connection delay between opening the serial device and starting the communication

```

## Show connected NodeMCU Modules ##
To show a list of all connected NodeMCU Modules you can use the `devices` command. It will filter NodeMCU Modules by its USB VendorID

**Syntax** `nodemcu-tool [options] devices

**Options** 
  
  * `--all` | Show ALL connected serial devices, not only NodeMCU modules (filtered by USB vendorId)
  * `--json` | Outputs the device list as JSON Array, Status messages are rejected

**Example**

```shell
$ nodemcu-tool devices
[NodeMCU] Connected Devices | Total: 1
          |- /dev/ttyUSB0 (Silicon_Labs, usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0)
```

## Upload Files ##
The most important task of this tool: upload local files to the module. 

**Syntax** `nodemcu-tool [options] upload <local-filenames...>`

**Options**

* `--optimize` | Remove Comments, Whitespaces and empty lines from the file before upload
* `--compile`  | Compiles the uploaded .lua file into executable bytecode and removes the source .lua file (performance)
* `--keeppath` | Keeps the relative file path in the destination filename (i.e: static/test.html will be named static/test.html)
* `--remotename` | Set the destination file name
* `--fastupload` | Boost the upload speed by using base64 encoding. **IMPORTANT** : The _NodeMCU_ module "**encode**" must be present on the firmeware (which is not the case by default).

**Example 1**

Upload and optimize the file "test.lua"

```shell
$ nodemcu-tool --port=/dev/ttyUSB1 --optimize --compile upload test.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "toolkit/test.lua" ...
[NodeMCU-Tool] Data Transfer complete!
[NodeMCU] compiling lua file..
[NodeMCU] Success
[NodeMCU] Original Lua file removed
```

**Example 2**

Upload and precompile a new main file

```shell
$ nodemcu-tool --compile upload main.lua
```

**Example 3**

Upload a text file.

```shell
$ nodemcu-tool upload HelloWorld.txt
```

**Example 4**

Upload a static file and keep its relative path as remote name.

```shell
$ nodemcu-tool upload static/hello.html --keeppath
```

The remote file name will be "static/hello.html"

**Example 5**

Relative parts of the local filename got removed - useful when having split your project into different party

```shell
$ nodemcu-tool upload ../../projectX/static/hello.html --keeppath
```

The remote file name will be "projectX/static/hello.html"

**Example 6**

Upload a text file and change its remote name.

```shell
$ nodemcu-tool upload HelloWorld.txt --remotename MyFile.txt
```

The remote file name will be "MyFile.txt"

**Example 7**

Upload multiple files to the module at once and compile Lua files. Non-existing files will be ignored!

```shell
$ nodemcu-tool upload helloworld.lua dev/f1.lua dev/f2.lua xxx.txt dev/f3.lua helloworld.lua test.lua --keeppath --compile
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Uploading "helloworld.lua" >> "helloworld.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- success
[NodeMCU]  |- original Lua file removed
[NodeMCU-Tool] Uploading "dev/f1.lua" >> "dev/f1.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Uploading "dev/f2.lua" >> "dev/f2.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Local file not found "xxx.txt" skipping...
[NodeMCU-Tool] Uploading "dev/f3.lua" >> "dev/f3.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Uploading "helloworld.lua" >> "helloworld.lua"...
[NodeMCU]  |- compiling lua file..
[NodeMCU]  |- Success
[NodeMCU]  |- Original Lua file removed
[NodeMCU-Tool] Local file not found "test.lua" skipping...
[NodeMCU-Tool] Bulk File Transfer complete!
```


## Download Files ##
To backup files or fetch recorded data, NodeMCU-Tool allows you to download these files from NodeMCU using the `download` command.
A file with the same name as the remote-file is created in the current working directory - the path is dropped!

**Syntax** `nodemcu-tool [options] download <remote-filename>`

**Example**

```shell
$ nodemcu-tool download main.lua
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU-Tool] Downloading "main.lua" ...
[NodeMCU-Tool] Data Transfer complete!
[NodeMCU-Tool] File "main.lua" created
```

## Delete Files ##
To delete files on your Module use the `remove` command

**Syntax** `nodemcu-tool [options] remove <remote-filename>`

**Example**

```shell
$ nodemcu-tool remove test.lua
$ nodemcu-tool remove test.lc
```

## File System Info ##
Maybe you want to retrieve the flash free space or get a list of all files stored in the SPIFFS

**Syntax** `nodemcu-tool [options] fsinfo`

**Options** 

  * `--json` | Outputs the file list as JSON Array, Status messages are rejected

**Example**

```shell
$ nodemcu-tool fsinfo
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Free Disk Space: 3339 KB | Total: 3346 KB
[NodeMCU] Files stored into Flash (SPIFFS)
          |- init.lua (871 Bytes)
          |- telnet-server.lc (784 Bytes)
          |- wifi.lc (988 Bytes)
          |- main.lua (255 Bytes)
          |- test.lc (264 Bytes)
          |- terminal-server.lc (852 Bytes)
          |- package.json (397 Bytes)
          |- LICENSE.md (1089 Bytes)
```

## Format the File System ##
To store file in the SPI Flash, the file system needs to be initialized. This have to be done **before uploading** any files to the modules.
Otherwise no file will be stored. This command also allows you to delete all files on the module.

**Syntax** `nodemcu-tool [options] mkfs`

**Options**
 
  * `--noninteractive` | Execute command without user interaction (dialog to confirm the formatting is disabled)

**Example**

```shell
$ nodemcu-tool mkfs
[NodeMCU-Tool] Do you really want to format the filesystem and delete all file ? (no) yes
[NodeMCU-Tool] Connected
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Formatting the file system...this will take around ~30s
[NodeMCU] File System created | format done.
```

## Run/Execute Files ##
For testing purpose, you can execute uploaded scripts (lua, lc) with the tool and capture the output (the `dofile()` function is invoked).

**Syntax** `nodemcu-tool [options] run <remote-filename>`

**Example**

```shell
$ nodemcu-tool run test.lua
[NodeMcuConnector] Connecting..
[NodeMcuConnector] ONLINE. Fetching device data..
[NodeMCU] Version: 0.9.5 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Running "test.lua"
Hello World!
HELLO WORLD!!!
HEllo HEllo Hello
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
```

## Reset the Module ##
Doing a hard-reset on modules which have an integrated reset circuit based on RTS/DST flowcontrol pins.
A soft-reset is also possible.  

**Syntax** `nodemcu-tool [options] reset`

**Options**
 
  * `--softreset` | Soft-Resets the module using the internal `node.restart()` command


**Example**

```shell
$ nodemcu-tool reset
[NodeMCU-Tool] Project based configuration loaded
[NodeMCU-Tool] Connected
[NodeMCU] Version: 1.5.1 | ChipID: 0xd1aa | FlashID: 0x1640e0
[NodeMCU] Hard-Reset executed (100ms)
```

## Terminal Mode ##

The Terminal mode will open a direct serial connection to NodeMCU and passes all keyboard inputs to the module.
This allows you to interact with the module during development without the need of an additional serial terminal.
You can quit the terminal session by pressing <kbd>ctrl+c</kbd>

**Syntax** `nodemcu-tool [options] terminal`

**Options**
 
  * `--run <filename>` | Executes a command on start of the terminal session - useful for testing/debugging

**Example 1**

```shell
$ nodemcu-tool terminal
[SerialTerminal] Starting Terminal Mode - press ctrl+c to exit
dofile("test.lc")
Hello World!
HELLO WORLD!!!
HEllo HEllo Hello
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
> [SerialTerminal] Connection closed
```

**Example 2**
```shell
$ nodemcu-tool terminal --run helloworld.lua
[SerialTerminal] Starting Terminal Mode - press ctrl+c to exit
dofile("helloworld.lua")
Hello World!
|---|
| H |
| E |
| L |
| L |
| O |
| | |
| W |
| O |
| R |
| L |
| D |
|---|
YEAH!!! HELLO WORLD!!!
String: Lorem ipsum dolor sit amet, consetetur sadipscing elitr
```

Behind the Scene
----------------
Many beginners may ask how the tool is working because there is no binary interface documented like FTP to access files.

The answer is quite simple: **NodeMCU-Tool** implements a serial terminal connection to the Module and runs some command line based lua commands like file.open(), file.write() to access the filesystem. That's it!

Since Version 1.2 it's also possible to transfer **binary** files to your device. NodeMCU-Tool uses a hexadecimal encode/decoding to transfer the files binary save!
The required encoding (file downloads) / decoding (file uploads) functions are automatically uploaded on each operation.

### Systems Architecture ###

The Tool is separated into the following components (ordered by its invocation)

  1. `bin/nodemcu-tool.js` - the command line user interface handler based on [commander](https://www.npmjs.com/package/commander)
  2. `lib/NodeMCU-Tool.js` - Highlevel Access to the main functions. Error and Status messages are handled there
  3. `lib/NodeMcuConnector.js` - the Core which handles the Lua command based communication to the NodeMCU Module
  4. `lib/ScriptableSerialTerminal.js` - the lowlevel part - a terminal session to the NodeMCU Module to run the Lua commands
  
  
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
It's recommended to use the `--optimize` flag to strip whitespaces before uploading. Additionally, newer firmware versions `1.x.x` using an auto-baudrate detection algorithm - this means you can increase the baudrate to e.g. 115200 `--baud 115200` to speed up the transfer 

Any Questions ? Report a Bug ? Enhancements ?
---------------------------------------------
Please open a new issue on [GitHub](https://github.com/AndiDittrich/NodeMCU-Tool/issues)

Contributing
------------

Contributors are welcome! Even if you are not familiar with javascript you can help to improve the documentation!

License
-------
NodeMCU-Tool is OpenSource and licensed under the Terms of [The MIT License (X11)](http://opensource.org/licenses/MIT). You're welcome to [contribute](https://github.com/AndiDittrich/NodeMCU-Tool/blob/master/CONTRIBUTE.md)!
