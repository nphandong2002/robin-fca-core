module.exports = class HandleLogin {
  constructor() {
    this.account = {};
    this.isLogin = false;
    this.isCheckPoint = false;
    this.page = null;
    this.vault = null;
  }
  async init(page, vault) {
    this.page = page;
    this.vault = vault;
    this.account = await this.checkAccountInVault();
  }
  checkAccountInVault() {
    const lstAccount = this.vault.get("accounts") || [];
    if (lstAccount.length) {
    }
  }
};
