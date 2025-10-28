const { default: puppeteer } = require('puppeteer');
const logger = require('../utils/logger');
const bluebird = require('bluebird');
const request = bluebird.promisify(require('request').defaults({ jar: true }));

const title = 'BROWSER';
module.exports = class LoadBrowser {
  constructor() {
    this.browser = null;
    this.page = null;
    this.jar = request.jar();
  }

  async init(config) {
    let load = logger.load(title, 'Khởi tạo trình duyệt ẩn danh...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--disable-extensions'],
      ...config.browserOptions,
    });

    this.page = await this.browser.newPage();
    this.page.userAgent = await this.browser.userAgent();
    load.stop();
    logger.info(title, 'Trình duyệt ẩn danh đã sẵn sàng!');
  }

  async syncCookiesToJar(domain = 'https://www.facebook.com') {
    const cookies = await this.page.cookies(domain);
    cookies.forEach((cookie) => {
      const cookieString = `${cookie.name}=${cookie.value}`;
      this.jar.setCookie(cookieString, domain);
    });
    logger.info(title, `Đã đồng bộ ${cookies.length} cookie vào jar!`);
  }

  getUserAgent() {
    return this.page.userAgent;
  }

  getHeaders(url, customHeader) {
    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://www.facebook.com/',
      Host: url.replace('https://', '').split('/')[0],
      Origin: 'https://www.facebook.com',
      'user-agent': this.page.userAgent,
      Connection: 'keep-alive',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
    };
    if (customHeader) Object.assign(headers, customHeader);
    return headers;
  }

  get(url, qs) {
    return request({
      headers: this.getHeaders(url),
      timeout: 60000,
      qs,
      url,
      method: 'GET',
      jar: this.jar,
      gzip: true,
    }).then((res) => res);
  }

  post(url, form) {
    return request({
      headers: this.getHeaders(url),
      timeout: 60000,
      url,
      method: 'POST',
      form,
      jar: this.jar,
      gzip: true,
    }).then((res) => res);
  }
};
