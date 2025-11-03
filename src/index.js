const LoadBrowser = require('./modules/load-brower');
const LoadConfig = require('./modules/load-config');
const LoadDatabase = require('./modules/load-data');
const LoadInfoBot = require('./modules/load-infoBot');
const LoadMqtt = require('./modules/load-mqtt');
const LoadVault = require('./modules/load-vault');
const LoadWsServer = require('./modules/load-wsServer');
const logger = require('./utils/logger');

const readline = require('readline');

class MainBot {
  constructor() {
    this.config = new LoadConfig('./src/database/config.json', {
      browserOptions: {},
      pathFileDb: '/src/database/db.json',
      ws: {
        port: 1902,
      },
    });
    this.vault = new LoadVault();
    this.brower = new LoadBrowser();
    this.infoBot = new LoadInfoBot();
    this.loadWsServer = new LoadWsServer();
    this.mqtt = new LoadMqtt();
    this.database = new LoadDatabase();
  }
  async init() {
    console.clear();
    this.config.init();
    try {
      await this.vault.init(this.config.data);
      await this.brower.init(this.config.data);
      await this.database.init(this.config.data);
      await this.infoBot.init(this.brower, this.vault);
      // await this.loadWsServer.init(this);
      await this.mqtt.init(this);
      this.mqtt.subscribe((err, msg) => {
        if (msg) logger.info('MQTT', msg);
        if (err) logger.error('MQTT', err);
      });
      this.listenReloadCommand();
    } catch (err) {
      logger.error('BOT', err);
    }
  }
  listenReloadCommand() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('line', async (line) => {
      const [cmd, moduleName] = line.trim().split(' ');

      if (cmd === 'reload' && moduleName) {
        await this.reloadModule(moduleName);
      } else {
        console.log('❓ Lệnh không hợp lệ. Dùng: reload <ClassName>');
      }
    });
  }

  async reloadModule(moduleName) {
    try {
      const moduleMap = {
        LoadMqtt: './modules/load-mqtt',
        LoadInfoBot: './modules/load-infoBot',
        LoadBrowser: './modules/load-brower',
        LoadVault: './modules/load-vault',
        LoadWsServer: './modules/load-wsServer',
        LoadConfig: './modules/load-config',
      };

      const filePath = moduleMap[moduleName];
      if (!filePath) {
        console.log(`⚠️ Không tìm thấy module: ${moduleName}`);
        return;
      }

      // Xóa cache
      delete require.cache[require.resolve(filePath)];

      const NewClass = require(filePath);

      const instance = new NewClass();
      if (typeof instance.init === 'function') {
        console.log(`🔄 Reloading ${moduleName}...`);
        await instance.init(this);
        this[moduleName.replace('Load', '').toLowerCase()] = instance;
        console.log(`✅ ${moduleName} reloaded thành công!`);
      } else {
        console.log(`⚠️ ${moduleName} không có hàm init().`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi reload ${moduleName}:`, err);
    }
  }
}

const bot = new MainBot();
bot.init();
