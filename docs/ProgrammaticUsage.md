Use NodeMCU-Tool programmatically with 3rd Party Applications
=============================================================

Maybe you're working on an high-level application or make use of a deployment script and you want to use NodeMCU-Tool to manage the file transfer.

3rd Party Applications
----------------------

This means build systems like [ANT](http://ant.apache.org/) or python, php scripts for example.

### ANT Build Example ###

**Description** Download files to NodeMCU using ANT [exec task](https://ant.apache.org/manual/Tasks/exec.html)

**Example File** [apache-ant-build.xml](examples/apache-ant-build.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project name="test" default="build" basedir=".">
    <taskdef resource="net/sf/antcontrib/antcontrib.properties"/>

    <target name="build">
        <!-- Download Files to NodeMCU !-->
        <exec executable="node">
            <arg value="bin/nodemcu-tool.js" />
            <arg value="upload" />
            <arg value="helloworld.lua" />
        </exec>
    </target>
</project>
```


Node.js based Application
------------------------------

It's possible to use the underlying "NodeMcuConnector" in your own Node.js projects to communicate with a NodeMCU based device.
For more details, take a look into the [sources](https://github.com/AndiDittrich/NodeMCU-Tool/tree/master/lib)!

### Low Level Connector Example ###

**Description** Run `node.compile()` on NodeMCU and display the output

```js
var _connector = require('nodemcu-tool').Connector;

// create a new connector instance
var con = new _connector('/dev/ttyUSB4', 9600);

// open the serial connection
con.connect(function(err, response){
    // get version, flashid ... message
    console.log(response);
    
    // run a command on the LUA command line
    con.executeCommand('node.compile("testfile.lua");', function(err, echo, response){
        if (err){
            console.error('IO Error - ', err);
        }else{
            console.log(response);
        }
    });
});
```