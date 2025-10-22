const logger = require("../utils/logger");

const inquirer = require("inquirer").default;

class SettingAccount {
  constructor(vault) {
    this.vault = vault;
  }
  getDbAccount() {
    return this.vault.get("account");
  }
  async createNewAccount() {
    logger.info("INFO BOT", "Nhập thông tin tài khoản.");
    const { username, password } = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Nhập email/sđt:",
        validate: (value) => {
          if (!value.trim()) return "Email/sđt không được để trống!";
          return true;
        },
      },
      {
        type: "password",
        name: "password",
        message: "Nhập mật khẩu:",
        validate: (value) => {
          if (!value.trim()) return "Mật khẩu không được để trống!";
          return true;
        },
      },
    ]);
    return { username, password, cookie: "", fullName: "", id: 0, pass2FA: "", isActive: false };
  }
}

module.exports = class LoadInfoBot {
  constructor() {
    this.account = {};
    this.page = null;
    this.vault = null;
  }
  async init(page, vault) {
    this.page = page;
    this.vault = vault;
    this.settingAcc = new SettingAccount(this.vault);
    this.account = await this.checkAccountInVault();
    return;
  }
  async loginFB() {
    await this.page.goto("https://www.facebook.com/login.php", {
      waitUntil: "networkidle2",
    });
    await this.page.type("#email", this.account.username, { delay: 500 });
    await this.page.type("#pass", this.account.password, { delay: 500 });
    await Promise.all([page.click('[type="submit"]'), page.waitForNavigation({ waitUntil: "networkidle2" })]);
  }
  checkAccountInVault() {
    const account = this.settingAcc.getDbAccount();
    if (!account || !account.id) return this.settingAcc.createNewAccount();
    return account;
  }
};
