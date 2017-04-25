File Transfer Encoding
==========================

NodeMCU-Tool uses **hex** or **base64** encoding to transfer the files binary safe.

To use the **base64** mode, you have to include the native [encode](http://nodemcu.readthedocs.io/en/master/en/modules/encoder/) module into your firmware - this will speed up the file transfer by factor 4..10!

File Upload Helper Function
-----------------------------

The following lua code is used to decode the stream on the NodeMCU Module. In case the `encoder.fromBase64` function is available it will be used.

**Original Version**


```lua
-- Base64 Module available ?
if encoder and encoder.fromBase64 then
    -- Use build-in BASE64 Decoder
    _G.__nmtwrite = function(s) 
        file.write(encoder.fromBase64(s))
    end
    print("b")
else
    -- Use classic HEX Decoder
    _G.__nmtwrite = function(s) 
        for c in s:gmatch('..') do 
            file.write(string.char(tonumber(c, 16))) 
        end 
    end
    print("h") 
end
```

**Compressed Version**

```lua
if encoder and encoder.fromBase64 then _G.__nmtwrite = function(s) file.write(encoder.fromBase64(s)) 
end print('b') else _G.__nmtwrite = function(s) for c in s:gmatch('..') 
do file.write(string.char(tonumber(c, 16))) end end print('h') end
```


File Download Helper Function
-----------------------------

The following lua code is used to encode the stream on the NodeMCU Module. In case the `encoder.toBase64` function is available it will be used.

**Original Version**


```lua
function __nmtread()
    -- flag to indicate base64 encoding
    local b64 = encoder and encoder.toBase64

    while true do

        -- Base64 Chunk length (without padding): 6bits per character => for n bytes 4*(n/3) chars required
        c = file.read(b64 and 240 or 1)

        -- No more data available
        if c == nil then 
            print('') 
            break 
        end 

        -- Base64 or hex encoding ?
        uart.write(0, b64 and encoder.toBase64(c) or string.format('%02X', string.byte(c)))
    end

    -- final delimiter
    print('')
end
```

**Compressed Version**

```lua
function __nmtread()local b = encoder and encoder.toBase64 while true do c = file.read(b and 240 or 1) 
if c==nil then print('')break end uart.write(0, b and encoder.toBase64(c) 
or string.format('%02X', string.byte(c)))end print('') end
```