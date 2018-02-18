Frequently Asked Questions
========================

### Do you provide more Examples/Use Cases ? ###
Of course, check the [Examples](docs/Examples.md) file (tool usage) as well as the `examples/` directory for third party examples

### The serial file transfer is pretty slow ###
By default, the serial connection uses a 9600 baud with 8N1 - this means maximal 960 bytes/s raw data rate.
Due to the limitations of a line-wise file upload, these maximal transfer rate cannot be reached, because every line has to be processed by the lua interpreter and NodeMCU-Tool is waiting for it's response.
It's recommended to use the `--minify` flag to minify the code before uploading. Additionally, newer firmware versions `1.x.x` using an auto-baudrate detection algorithm - this means you can increase the baudrate to e.g. 115200 `--baud 115200` to speed up the transfer 

Additionally include the native [encoder Module](http://nodemcu.readthedocs.io/en/master/en/modules/encoder/) into your firmware to speed-up the uploading by factor 4..10!
