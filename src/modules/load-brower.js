const { default: puppeteer } = require("puppeteer");
const logger = require("../utils/logger");

const title = "Brower";
module.exports = class LoadBrowser {
  constructor() {
    this.browser = null;
    this.page = null;
  }
  async init(config) {
    let load = logger.load(title, "Khởi tạo trình duyệt ẩn danh...");
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--disable-extensions"],
      ...config.browserOptions,
    });
    this.page = await this.browser.newPage();
    load.stop();
    logger.info(title, "Trình duyệt ẩn danh đã sẵn sàng!");
    return;
  }
};
