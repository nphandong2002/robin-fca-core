const { theme } = require("./theme");
const readline = require("readline");

const log = (prefix, title, ...props) => {
  return console.log(`${prefix} ${theme.style.message(title)}:`, ...props);
};
let tickInterval;
module.exports = {
  load: (msg) => {
    let inc = -1;
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      inc = inc + 1;
      const frame = theme.spinner.frames[inc % theme.spinner.frames.length];
      readline.clearLine(process.stdout, 1);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`[FCA]: ${frame} ${msg}`);
    }, theme.spinner.interval);
    return {
      stop: () => {
        clearInterval(tickInterval);
        readline.clearLine(process.stdout, 1);
        readline.cursorTo(process.stdout, 0);
      },
      resetMsg: (msgNew) => {
        msg = msgNew;
      },
    };
  },
  info: (title, ...props) => {
    return log(theme.prefix.info, title, ...props);
  },
  warn: (title, ...props) => {
    return log(theme.prefix.warn, title, ...props);
  },
  error: (title, ...props) => {
    return log(theme.prefix.error, title, ...props);
  },
  prefix: (prefix, title, ...props) => {
    return log(prefix, title, ...props);
  },
};
