var luamin = require('luamin')

// strip comments and whitespaces from lua content
function optimizeLuaContent(rawContent){
    // apply optimizations
    var t = luamin.minify(rawContent.toString('utf-8'));

    // re-convert to buffer
    return new Buffer(t, 'utf-8');
};

module.exports = {
    optimize: optimizeLuaContent
};
