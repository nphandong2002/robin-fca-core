const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const tile = "CONFIG";
module.exports = class LoadConfig {
  constructor(configPath = "./src/database/config.json", defaults = {}) {
    this.defaults = defaults;
    this.configPath = path.resolve(configPath);
    this.data = {};
  }
  init() {
    if (!fs.existsSync(this.configPath)) {
      logger.warn(tile, `Chưa có file config, tạo mới tại: ${this.configPath}`);
      this.createDefault();
      this.save();
    } else {
      this.load();
    }
  }
  createDefault() {
    this.data = {
      pathFileVault: "./src/database/vault.dat",
      userAgent: "",
      ...this.defaults,
    };
    logger.info(tile, "Tạo config mặc định.");
  }
  load() {
    try {
      const raw = fs.readFileSync(this.configPath, "utf8");
      this.data = {
        ...JSON.parse(raw),
        ...this.defaults,
      };
      this.save();
      logger.info(tile, "Đã load file config thành công!");
    } catch (err) {
      logger.error(
        tile,
        " Lỗi khi đọc file config. Sẽ dùng config mặc định.",
        err
      );
      this.createDefault();
      this.save();
    }
  }
  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 4), {
        mode: 0o666,
      });
      logger.info(tile, "Lưu file config thành công!");
    } catch (err) {
      logger.error(tile, "Không thể ghi file config", err);
    }
  }
  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }
};
