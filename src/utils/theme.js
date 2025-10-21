const colors = require("yoctocolors-cjs");
const { figures } = require("./figures");
module.exports.theme = {
  prefix: {
    idle: colors.blue("?"),
    info: colors.green(figures.tick),
    warn: colors.yellow(figures.warning),
    error: colors.red(figures.cross),
  },
  spinner: {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"].map((frame) => colors.yellow(frame)),
  },
  style: {
    answer: colors.cyan,
    message: colors.bold,
    warn: colors.yellow,
    error: (text) => colors.red(`> ${text}`),
    defaultAnswer: (text) => colors.dim(`(${text})`),
    help: colors.dim,
    highlight: colors.cyan,
    key: (text) => colors.cyan(colors.bold(`<${text}>`)),
  },
};
