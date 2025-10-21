const fs = require("fs");
const crypto = require("crypto");
const inquirer = require("inquirer").default;
const logger = require("../utils/logger");

const title = "VAULT";

module.exports = class LoadVault {
  constructor() {
    this.algorithm = "aes-256-cbc";
    this.data = {};
    this.password = null;
    this.key = null;
  }
  init(config) {
    this.config = config;
    const fileExists = fs.existsSync(this.config.pathFileVault);
    if (!fileExists) return this.createNewFile();
    return this.loadExistingFile();
  }
  async createNewFile() {
    const { password } = await inquirer.prompt([
      {
        type: "password",
        name: "password",
        message: " Nhập mật khẩu mới:",
        mask: "*",
      },
    ]);
    this.password = password;
    this.key = this.deriveKey(password);
    this.data = {};
    this.save();
    logger.info(title, "Tạo vault mới thành công!");
    return;
  }
  decryptData(encryptedBuffer) {
    const iv = encryptedBuffer.subarray(0, 16);
    const content = encryptedBuffer.subarray(16);
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString());
  }
  save() {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(this.data)),
      cipher.final(),
    ]);
    fs.writeFileSync(this.config.pathFileVault, Buffer.concat([iv, encrypted]));
  }
  deriveKey(password) {
    return crypto.createHash("sha256").update(password).digest();
  }
  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }
  async loadExistingFile() {
    const filePath = this.config.pathFileVault;
    while (true) {
      const { password } = await inquirer.prompt([
        {
          type: "password",
          name: "password",
          message: "Nhập mật khẩu để mở vault:",
          mask: "*",
        },
      ]);

      this.password = password;
      this.key = this.deriveKey(password);

      try {
        const encrypted = fs.readFileSync(filePath);
        this.data = this.decryptData(encrypted);
        logger.info(title, "Mở thành công!");
        return;
      } catch (err) {
        logger.error(title, "Sai mật khẩu hoặc file hỏng! Hãy thử lại.");
      }
    }
  }
};
