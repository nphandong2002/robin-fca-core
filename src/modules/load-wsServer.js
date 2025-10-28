const WebSocket = require('ws');
const logger = require('../utils/logger');

const title = 'WebSocket';
module.exports = class LoadWsServer {
  constructor() {
    this.ctx = null;
  }
  init(ctx) {
    this.ctx = ctx;
    this.page = ctx.brower.page;
    this.config = ctx.config.data.ws;
    this.infoBot = ctx.infoBot.data;
    this.initWsServer();
    this.loadWsPage();
  }
  initWsServer() {
    const wss = new WebSocket.Server({ port: this.config.port });
    logger.prefix('🚀', title, 'WebSocket server đang chạy tại ws://localhost:8080');

    wss.on('connection', (ws, req) => {
      logger.info(title, 'Client đã kết nối:', req.socket.remoteAddress);
      ws.on('message', (data) => {
        try {
          const text = data.toString();
          const json = JSON.parse(text);
          logger.info(title, json);
        } catch (e) {
          logger.error(title, 'Lỗi parse JSON:', e);
        }
      });

      ws.on('close', () => {
        logger.warn(title, '⚠️ Client đã ngắt kết nối');
      });
      ws.on('error', (err) => {
        logger.error(title, err.message);
      });
    });
  }
  loadWsPage() {
    this.page.evaluate((port, lastSeqId) => {
      function createWebSocketClient(url, onMessage) {
        let ws;
        let reconnectInterval = 3000;
        let isConnected = false;
        function connect() {
          ws = new WebSocket(url);
          ws.onopen = () => {
            isConnected = true;
          };

          ws.onmessage = (event) => {
            if (onMessage) onMessage(event.data);
          };

          ws.onclose = () => {
            isConnected = false;
            setTimeout(connect, reconnectInterval);
          };

          ws.onerror = (err) => {
            ws.close();
          };
        }

        function sendMessage(msg) {
          if (isConnected && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
        }
        connect();
        return {
          send: sendMessage,
        };
      }
      function run(payload, callback) {
        var f = this;
        this.$4 = {
          0: true,
        };
        this.$5 = [];
        this.$6 = null;
        this.$2 = payload;
        this.$1 = callback;

        this.isPromise = function a(a, g) {
          return a instanceof (g || (g = Promise)) || typeof (a == null ? void 0 : a.then) === 'function';
        };
        function l(a, b, d, j) {
          if ((j || (j = this.isPromise))(a)) return a.then(b, d);
          try {
            return b(a);
          } catch (a) {
            if (d) return d(a);
            else return a;
          }
        }
        this.$7 = function (a) {
          return l(
            f.$8(a),
            function (a) {
              return a;
            },
            function (b) {
              return {
                type: 'error',
                detail: b,
                message: `Error evaluating step op: ${Array.isArray(a) ? a[0] : '<primitive value>'}`,
              };
            },
          );
        };
        this.eval = function () {
          this.$7(this.$2.step);
        };
        this.$8 = function (a) {
          var d = this;
          if (!Array.isArray(a)) return a;
          var e = a[0];
          a = a.slice(1);
          var f = a;
          switch (e) {
            case 8:
              return f.map(this.$7);
            case 2:
              return this.$4[f[0]];
            case 3:
              return l(this.$7(f[1]), function (a) {
                return (d.$4[f[0]] = a);
              });
            case 4:
              return l(this.$7(f[2]), function (a) {
                var b = f[0],
                  c = f[1];
                for (var e = 0; e < c; e++, b++) d.$4[b] = a[e];
                return a;
              });
            case 12:
              a = f[0];
              e = f[1];
              var g = [];
              for (a = a; a < e; a++) g[a] = this.$4[a];
              return g;
            case 1:
              var j;
              a = function (a) {
                j = l(j, function () {
                  return d.$7(f[a]);
                });
              };
              for (e = 0; e < f.length; e++) a(e);
              return j;

            case 5:
              return (g = this.$1).storedProcedure.apply(g, f.map(this.$7));
            case 6:
              return (e = this.$1).nativeTypeOperation.apply(e, f.map(this.$7));
            case 7:
              return (a = this.$1).nativeOperation.apply(a, f.map(this.$7));
            case 9:
              return;
            case 10:
              return Infinity;
            case 11:
              return NaN;
            case 13:
              return this.$7(f[0]) ? '1' : '0';
            case 23:
              if (this.$7(f[0])) return this.$7(f[1]);
              else if (f[2] != null) return this.$7(f[2]);
              return;
            case 24:
              return this.$7(f[0]) || this.$7(f[1]);
            case 25:
              return this.$7(f[0]) && this.$7(f[1]);
            case 26:
              return !this.$7(f[0]);
            case 27:
              return this.$7(f[0]) == null;
          }
        };

        this.eval();
      }
      const wsClient = createWebSocketClient(`ws://localhost:${port}`, (msg) => {});
      (async () => {
        var d = (e = (a) => require.call(null, a));
        var LSPlatformMessengerConfig = d('LSPlatformMessengerConfig');
        var e = LSPlatformMessengerConfig.config;
        var m = await e.realtimeUnderylingTransport();
        var f = d('LSPlatformDeviceId').getDeviceIdForProviderType('ephemeral');
        var o = d('LSPlatformRealtimeTransport').LSPlatformRealtimeTransport(m, e.appId, f);

        o.subscribeToNonTaskResponses((a, b) => {
          b = JSON.parse(b.payload);
          run(b, {
            storedProcedure: function (name, ...args) {
              wsClient.send({
                type: name,
                detail: args,
              });
            },
          });
        });
      })();
    }, this.config.port);
  }
};
