const LoadBrowser = require("./modules/load-brower");
const LoadConfig = require("./modules/load-config");
const LoadInfoBot = require("./modules/load-infoBot");
const LoadVault = require("./modules/load-vault");
const logger = require("./utils/logger");

class MainBot {
  constructor() {
    this.config = new LoadConfig("./src/database/config.json", {
      browserOptions: {},
    });
    this.vault = new LoadVault();
    this.brower = new LoadBrowser();
    this.infoBot = new LoadInfoBot();
  }
  async init() {
    console.clear();
    this.config.init();
    await this.vault.init(this.config.data);
    await this.brower.init(this.config.data);
    await this.infoBot.init(this.brower.page, this.vault);

    console.log(this.infoBot.account);
  }
}

const bot = new MainBot();
bot.init();
