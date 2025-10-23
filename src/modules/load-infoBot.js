const inquirer = require('inquirer').default;

const logger = require('../utils/logger');

const title = 'INFO BOT';
class SettingAccount {
  constructor(vault) {
    this.vault = vault;
  }
  getDbAccounts() {
    return this.vault.get('accounts') || [];
  }

  async choseAccount() {
    const accounts = this.getDbAccounts();
    if (!accounts.length) return this.formAccount();
    const { selectedAccount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAccount',
        message: `[${title}]: Chọn tài khoản để sử dụng`,
        choices: accounts
          .map((acc, index) => ({
            name: `${acc.id} - ${acc.username} (${acc.isActive ? 'Active' : 'Inactive'})`,
            value: index,
          }))
          .concat([{ name: 'Nhập tài khoản mới', value: -1 }]),
      },
    ]);
    if (selectedAccount === -1) return this.formAccount();
    return accounts[selectedAccount];
  }
  async formAccount(account = {}) {
    logger.info('INFO BOT', 'Nhập thông tin tài khoản.');
    const { username, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: `[${title}]: Nhập email/sđt`,
        default: account.username || '',
        validate: (value) => {
          if (!value.trim()) return 'Email/sđt không được để trống!';
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        mask: '*',
        message: `[${title}]: Nhập mật khẩu`,
        validate: (value) => {
          if (!value.trim()) return 'Mật khẩu không được để trống!';
          return true;
        },
      },
    ]);
    return {
      cookie: '',
      fullName: '',
      id: 0,
      pass2FA: '',
      isActive: false,
      ...account,
      username,
      password,
    };
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
    this.userAgent = this.page.userAgent;
    this.account = await this.settingAcc.choseAccount();
    return;
  }
};
