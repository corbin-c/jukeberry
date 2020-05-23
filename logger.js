let log = true;
let _console = {...console};
["log","info","warn","error"].map(e => {
  console[e] = function(...args) {
    if (log) {
      args.unshift((new Date()).toISOString()+" |");
      _console[e].apply(this,args);
    }
  };
});
module.exports = (bool) => {
  log = (bool === true)
};
