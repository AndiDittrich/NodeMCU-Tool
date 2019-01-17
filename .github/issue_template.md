---
title: 'Bug report - xxx not working'
labels: status/validation-pending
---

> **The following informations are required to debug/investigate the issue**
>
> Please edit the following structure to match **YOUR** configuration/environment
>
> and remove this header before posting the issue :)

-------------

## Checklist ##

1. Can you establish a serial connection **WITHOUT** Nodemcu-Tool - e.g. with a serial terminal like Putty ?  
  **YES/NO**  
  If not, the issue not related to NodeMCU-Tool - it might be a problem with your serial driver, NodeMCU hardware and/or firmware  

2. Does the `nodemcu-tool fsinfo` command work ?  
  **YES/NO**


-------------

## Environment ##

* **Operating System**  
  Windows 7 / Windows 10-1809/ macOS 10.14 / Ubuntu 18.04.1 LTS / Debian 9.6
* **ESP Device/Revision**  
  ESP8266 / ESP32  
  Original NodeMCU `v1.1`
* **NodeMCU-Tool Version**  
  Please use the least recent version to validate the issue  
  `3.0.2`
* **Node.js Version**  
  `8.15.0`
* **NodeMCU LUA Firmware Version**  
  `1.5.1`

-------------

## Debug Output ##

> **NOTE** In case you have issues with some commands of NodeMCU-Tool, please provide the output of the command includng the debug flags
>
> e.g. `nodemcu-tool --debug --io-debug info`

```
something like

 $ ./nodemcu-tool --debug --io-debug fsinfo
[config]      ~ debug mode enabled
[config]      ~ io-debug mode enabled - rx/tx messages are passed to logger
[config]      ~ baudrate             = 115200 (type:string)
[config]      ~ port                 = /dev/ttyUSB0 (type:string)
[config]      ~ connectionDelay      = 0 (type:number)
[config]      ~ minify               = false (type:boolean)
[config]      ~ compile              = false (type:boolean)
[config]      ~ keeppath             = false (type:boolean)
[config]      ~ remotename           = null (type:object)
[config]      ~ run                  = false (type:boolean)
[config]      ~ all                  = false (type:boolean)
[config]      ~ json                 = false (type:boolean)
[config]      ~ raw                  = false (type:boolean)
[config]      ~ softreset            = false (type:boolean)
[connector]   ~ Error: Error: No such file or directory, cannot open /dev/ttyUSB0
[NodeMCU-Tool]~ Unable to establish connection
[NodeMCU-Tool]~ Cannot open port "/dev/ttyUSB0"
[NodeMCU-Tool]~ Error: Cannot open port "/dev/ttyUSB0"
```

-------------

## Issue Description ##

### Expected Behavior ###

...


### Current Behavior ###

...


### Steps to Reproduce ###

1. X
2. Y
3. Z

### Detailed Description ###

...

### Possible Solution ###

...
