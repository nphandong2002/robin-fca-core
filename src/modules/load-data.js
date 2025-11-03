const path = require('path');

const { JSONFile, Low } = require('lowdb');
const logger = require('../utils/logger');

const title = 'Database';
module.exports = class LoadDatabase {
  constructor() {
    this.db = null;
  }

  async init(config) {
    const adapter = new JSONFile(path.join(process.cwd(), config.pathFileDb));
    this.db = new Low(adapter);
    await this.db.read();
    this.db.data ||= {
      users: [],
      groups: [],
      other: {},
    };
    await this.db.write();
    logger.info(title, 'Đã sẵn sàng');
  }
  async saveUser(user) {
    const exists = this.db.data.users.find((u) => u.id === user.userId);
    if (!exists) {
      this.db.data.users.push({ id: userId, name, createdAt: Date.now() });
      await this.db.write();
      logger.info('Database', `Đã thêm user ${name} (${userId})`);
    }
  }
};
