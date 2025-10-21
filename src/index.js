const LoadBrowser = require("./modules/load-brower");
const LoadConfig = require("./modules/load-config");
const LoadVault = require("./modules/load-vault");

class MainBot {
  constructor() {
    this.config = new LoadConfig("./src/database/config.json", {
      browserOptions: {},
    });
    this.vault = new LoadVault();
    this.brower = new LoadBrowser();
  }
  async init() {
    console.clear();
    this.config.init();
    await this.vault.init(this.config.data);
    await this.brower.init(this.config.data);
  }
}

const bot = new MainBot();
bot.init();
