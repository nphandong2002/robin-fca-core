const LoadBrowser = require('./modules/load-brower');
const LoadConfig = require('./modules/load-config');
const LoadInfoBot = require('./modules/load-infoBot');
const LoadVault = require('./modules/load-vault');
const LoadWsServer = require('./modules/load-wsServer');
const logger = require('./utils/logger');

class MainBot {
  constructor() {
    this.config = new LoadConfig('./src/database/config.json', {
      browserOptions: {},
      ws: {
        port: 1902,
      },
    });
    this.vault = new LoadVault();
    this.brower = new LoadBrowser();
    this.infoBot = new LoadInfoBot();
    this.loadWsServer = new LoadWsServer();
    this.ctx = {};
  }
  async init() {
    console.clear();
    this.config.init();
    try {
      await this.vault.init(this.config.data);
      await this.brower.init(this.config.data);
      await this.infoBot.init(this.brower, this.vault);
      await this.loadWsServer.init(this);
    } catch (err) {
      logger.error('BOT', err);
    }
  }
}

const bot = new MainBot();
bot.init();
