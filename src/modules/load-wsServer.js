const WebSocket = require('ws');
const logger = require('../utils/logger');

const title = 'WebSocket';

module.exports = class LoadWsServer {
  constructor() {
    this.ctx = null;
    this.page = null;
    this.config = null;
    this.infoBot = null;
    this.wsClient = null;
    this.pendingRequests = new Map(); // Lưu các request đang chờ phản hồi
  }

  init(ctx) {
    this.ctx = ctx;
    this.page = ctx.brower.page;
    this.config = ctx.config.data.ws;
    this.infoBot = ctx.infoBot.data;
    this.initWsServer();
    this.loadWsPage();
  }

  // --- Server WebSocket ---
  initWsServer() {
    const wss = new WebSocket.Server({ port: this.config.port });
    logger.prefix('🚀', title, `WebSocket server đang chạy tại ws://localhost:${this.config.port}`);

    wss.on('connection', (ws, req) => {
      logger.info(title, 'Client đã kết nối:', req.socket.remoteAddress);
      this.wsClient = ws; // lưu lại client

      ws.on('message', (data) => {
        try {
          const json = JSON.parse(data.toString());
          logger.info(title, '📩 Nhận dữ liệu:', json);

          // Nếu đây là phản hồi từ page (type: 'response' có id)
          if (json.type === 'response' && json.id && this.pendingRequests.has(json.id)) {
            const { resolve } = this.pendingRequests.get(json.id);
            this.pendingRequests.delete(json.id);
            resolve(json.data);
          }
        } catch (e) {
          logger.error(title, 'Lỗi parse JSON:', e);
        }
      });

      ws.on('close', () => {
        logger.warn(title, '⚠️ Client đã ngắt kết nối');
        this.wsClient = null;
      });
      ws.on('error', (err) => {
        logger.error(title, err.message);
      });
    });
  }

  // --- Inject code vào trang ---
  loadWsPage() {
    this.page.evaluate((port) => {
      function createWebSocketClient(url, onMessage) {
        let ws;
        let reconnectInterval = 3000;
        let isConnected = false;

        function connect() {
          ws = new WebSocket(url);

          ws.onopen = () => {
            isConnected = true;
            console.log('✅ Connected to WebSocket:', url);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (onMessage) {
                onMessage(data, (response) => {
                  // callback trả kết quả về theo id
                  if (data.id && isConnected && ws.readyState === WebSocket.OPEN) {
                    ws.send(
                      JSON.stringify({
                        id: data.id,
                        type: 'response',
                        data: response,
                      }),
                    );
                  }
                });
              }
            } catch (err) {
              console.error('❌ Error parsing message:', err);
            }
          };

          ws.onclose = () => {
            isConnected = false;
            console.warn('⚠️ WebSocket closed. Reconnecting...');
            setTimeout(connect, reconnectInterval);
          };

          ws.onerror = (err) => {
            console.error('❌ WebSocket error:', err);
            ws.close();
          };
        }

        function sendMessage(msg) {
          if (isConnected && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
          } else {
            console.warn('⚠️ Cannot send message, WebSocket not connected');
          }
        }

        connect();

        return { send: sendMessage };
      }

      // ---- Xử lý hàm getUserInfo ----
      function getUserInfo(ids, callback) {
        const MercuryIDs = require.call(null, 'MercuryIDs');
        const MessengerParticipants = require.call(null, 'MessengerParticipants.bs');

        const mappedIds = ids.map((a) => MercuryIDs.getParticipantIDFromUserID(a));
        MessengerParticipants.getMulti(mappedIds, (res) => {
          const result = {};
          Object.keys(res).forEach((key) => {
            const item = res[key];
            result[item.fbid] = {
              name: item.name,
              href: item.href,
              image_src: item.image_src,
              big_image_src: item.big_image_src,
              gender: item.gender,
            };
          });
          callback(result);
        });
      }

      createWebSocketClient(`ws://localhost:${port}`, (msg, reply) => {
        switch (msg.type) {
          case 'getUserInfo':
            return getUserInfo(msg.data.payload, (userData) => reply(userData));
        }
      });
    }, this.config.port);
  }

  // --- Hàm gửi request tới page và đợi phản hồi ---
  sendRequest(type, data) {
    return new Promise((resolve, reject) => {
      if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
        return reject(new Error('⚠️ WebSocket client chưa sẵn sàng'));
      }

      const id = Math.random().toString(36).substring(2, 10);
      const msg = { id, type, data };

      this.pendingRequests.set(id, { resolve, reject });
      this.wsClient.send(JSON.stringify(msg));

      // Timeout sau 30s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject({
            type: 'error',
            msg: 'Quá lâuuuu',
          });
        }
      }, 3 * 10000);
    });
  }
};
