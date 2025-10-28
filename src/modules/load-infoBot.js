const inquirer = require('inquirer').default;
const { default: puppeteer } = require('puppeteer');

const logger = require('../utils/logger');
const { parseJSON } = require('../utils/common');

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
    if (!accounts.length) return this.newAccount();
    const { selectedAccount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAccount',
        message: `[${title}]: Chọn tài khoản để sử dụng`,
        choices: accounts
          .map((acc, index) => ({
            name: `${acc.id} - ${acc.fullName} (${acc.isActive ? 'Active' : 'Inactive'})`,
            value: index,
          }))
          .concat([{ name: 'Nhập tài khoản mới', value: -1 }]),
      },
    ]);
    if (selectedAccount === -1) return this.newAccount();
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `Bạn muốn làm gì với tài khoản [${accounts[selectedAccount].fullName}]?`,
        choices: [
          { name: '✅ Sử dụng', value: 'use' },
          { name: '❌ Xóa', value: 'delete' },
          { name: '↩️ Quay lại', value: 'back' },
        ],
      },
    ]);

    if (action === 'use') return accounts[selectedAccount];
    if (action === 'delete') {
      accounts.splice(selectedAccount, 1);
      this.vault.set('accounts', accounts);
      logger.warn('Account', 'Đã xóa tài khoản khỏi danh sách!');
      return this.choseAccount();
    }
    if (action === 'back') return this.choseAccount();
  }
  newAccount() {
    return {
      cookie: '',
      fullName: '',
      id: 0,
      isActive: false,
    };
  }
}

module.exports = class LoadInfoBot {
  constructor() {
    this.account = {};
    this.page = null;
    this.vault = null;
    this.data = {};
  }
  async init(brower, vault) {
    this.page = brower.page;
    this.vault = vault;
    this.settingAcc = new SettingAccount(this.vault);
    this.userAgent = this.page.userAgent;
    this.account = await this.settingAcc.choseAccount();
    await this.handleLogin();

    await brower.syncCookiesToJar();

    // this.data.irisSeqID = await brower
    //   .post('https://www.facebook.com/api/graphqlbatch/', {
    //     av: null,
    //     queries: JSON.stringify({
    //       o0: {
    //         doc_id: '3336396659757871',
    //         query_params: {
    //           limit: 1,
    //           before: null,
    //           tags: ['INBOX'],
    //           includeDeliveryReceipts: false,
    //           includeSeqID: true,
    //         },
    //       },
    //     }),
    //   })

    //   .then(parseJSON(brower));
    return;
  }
  getUserInfo() {
    return this.page.evaluate(() => {
      const currentUser = require('CurrentUserInitialData');
      const mqttConfig = require('MqttConfig');
      return {
        fullName: currentUser.NAME,
        fbId: currentUser.USER_ID,
        mqttConfig: mqttConfig,
      };
    });
  }
  saveAccount() {
    const accounts = this.settingAcc.getDbAccounts();
    const existingIndex = accounts.findIndex((acc) => (acc) => String(acc.id) === String(this.account.id));
    if (existingIndex !== -1) accounts[existingIndex] = this.account;
    else accounts.push(this.account);
    this.vault.set('accounts', accounts);
  }
  async checkCookieValid() {
    let page = this.page;
    try {
      await page.setCookie(...this.account.cookie);
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
      const loggedIn = await page.evaluate(() => {
        try {
          return typeof require === 'function' && !!require('MessengerParticipants.bs');
        } catch (e) {
          return false;
        }
      });
      return loggedIn;
    } catch (err) {
      logger.error('Cookie', 'Cookie không hợp lệ: ' + err.message);
      return false;
    }
  }
  async waitForLoginSuccess(page) {
    await page.waitForFunction(
      () => {
        try {
          return typeof require === 'function' && require('MessengerParticipants.bs') != null;
        } catch (e) {
          return false;
        }
      },
      { timeout: 0 },
    );

    logger.info('Login', 'Đăng nhập thành công!');
    return true;
  }
  async loginWithAccount() {
    logger.info('Login', 'Mở cửa sổ để bạn đăng nhập Facebook...');
    const browser = await puppeteer.launch({
      headless: false,
    });
    const pageDom = await browser.newPage();
    await pageDom.goto('https://www.facebook.com/login.php', {
      waitUntil: 'networkidle2',
    });

    logger.info('Login', 'Vui lòng đăng nhập trong cửa sổ Facebook...');
    await pageDom.waitForNavigation();
    await this.waitForLoginSuccess(pageDom);
    const cookies = await pageDom.cookies();
    this.account.cookie = cookies;
    await browser.close();
    await this.page.setCookie(...cookies);
    return;
  }
  async handleLogin() {
    logger.load('Login', 'Đang đăng nhập ....');
    if (this.account.cookie && this.account.cookie.length) {
      const isValid = await this.checkCookieValid();
      if (!isValid) {
        logger.warn('Login', 'Cookie đã hết hạn, vui lòng đăng nhập lại!');
        await this.loginWithAccount();
      }
    } else await this.loginWithAccount();
    await this.page.goto('https://www.facebook.com/', {
      waitUntil: 'networkidle2',
    });
    this.data = await this.getUserInfo();
    this.account.id = this.data.fbId;
    this.account.fullName = this.data.fullName;

    logger.info('Login', `Đăng nhập thành công với tài khoản: ${this.account.fullName} (ID: ${this.account.id})`);
    this.saveAccount();
    return;
  }
};
