let _console = {...console};
["log","info","warn","error"].map(e => {
  console[e] = function(...args) {
    if (CONFIG.log) {
      args.unshift((new Date()).toISOString()+" |");
      _console[e].apply(this,args);
    }
  };
});
module.exports = {};
