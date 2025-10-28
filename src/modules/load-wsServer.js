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
        this.$4 = { 0: true };
        this.$5 = [];
        this.$6 = null;
        this.$2 = payload;
        this.callback = callback;
        this.$1 = require('LS');
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
              return (g = this.callback).apply(g, { type: 'storedProcedure', detail: f.map(this.$7) });
            case 6:
              return (e = this.callback).apply(e, { type: 'nativeTypeOperation', detail: f.map(this.$7) });
            case 7:
              return (a = this.callback).apply(a, { type: 'nativeOperation', detail: f.map(this.$7) });
            case 9:
              return;
            case 10:
              return Infinity;
            case 11:
              return NaN;
            case 13:
              return this.$7(f[0]) ? '1' : '0';
            case 14:
              return this.$1.blobs.to_string(this.$7(f[0]));
            case 15:
              return this.$1.blobs.of_string(this.$7(f[0]));
            case 16:
              return this.$1.blob(this.$7(f[0]));
            case 17:
              return this.$1.i64.of_float(this.$7(f[0]));
            case 18:
              g = this.$7(f[0]);
              return g != null ? this.$1.i64.to_float(g) : void 0;
            case 19:
              return this.$1.i64.from_string(this.$7(f[0]));
            case 70:
              return this.$1.i64.cast(this.$7(f[0]));
            case 20:
              return this.$1.i64.to_string(this.$7(f[0]));
            case 21:
              return (e = this.$3) == null || (e = e.gk) == null ? void 0 : e[f[0]];
            case 22:
              var m;
              a = f[0];
              g = f[1];
              e = f[2];
              var n = f[3];
              a =
                (m = this.$3) == null || (m = m.qe) == null || (m = m[a]) == null || (m = m[g]) == null ? void 0 : m[e];
              if (a == null) return a;
              switch (n) {
                case 'BOOL':
                case 'STR':
                  return a;
                case 'I64':
                  if (typeof a !== 'object') throw new Error('Expected i64 object');
                  return this.$1.i64.from_string(a.toString());
              }
              return;
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
            case 28:
              return this.$1.notnull(this.$7(f[0]));
            case 29:
              return this.$7(f[0]) === this.$7(f[1]);
            case 30:
              return this.$1.i64.eq(this.$7(f[0]), this.$7(f[1]));
            case 31:
              return this.$1.blobs.eq(this.$7(f[0]), this.$7(f[1]));
            case 32:
              return this.$7(f[0]) !== this.$7(f[1]);
            case 33:
              return this.$1.i64.neq(this.$7(f[0]), this.$7(f[1]));
            case 34:
              return this.$1.blobs.neq(this.$7(f[0]), this.$7(f[1]));
            case 35:
              return this.$7(f[0]) > this.$7(f[1]);
            case 36:
              return this.$1.i64.gt(this.$7(f[0]), this.$7(f[1]));
            case 37:
              return this.$1.blobs.gt(this.$7(f[0]), this.$7(f[1]));
            case 38:
              return this.$7(f[0]) >= this.$7(f[1]);
            case 39:
              return this.$1.i64.ge(this.$7(f[0]), this.$7(f[1]));
            case 40:
              return this.$1.blobs.ge(this.$7(f[0]), this.$7(f[1]));
            case 41:
              return this.$7(f[0]) < this.$7(f[1]);
            case 42:
              return this.$1.i64.lt(this.$7(f[0]), this.$7(f[1]));
            case 43:
              return this.$1.blobs.lt(this.$7(f[0]), this.$7(f[1]));
            case 44:
              return this.$7(f[0]) <= this.$7(f[1]);
            case 45:
              return this.$1.i64.le(this.$7(f[0]), this.$7(f[1]));
            case 46:
              return this.$1.blobs.le(this.$7(f[0]), this.$7(f[1]));
            case 47:
              return this.$1['throw'](f[0]);
            case 48:
              return this.$1.print(this.$7(f[0]));
            case 49:
              g = this.$7(f[0]);
              m = f[1];
              this.callback({ type: 'log', detail: { level: m, logger: g } });
            case 50:
              return f.length === 0
                ? this.$1.createArray()
                : (n = this.$1).createArrayWithElements.apply(n, this.$7(f[0]));
            case 51:
              a = this.$7(f[0]);
              a.push(this.$7(f[1]));
              return a;
            case 52:
              return this.$1.i64.of_int32(this.$7(f[0]).length);
            case 53:
              return new this.$1.Map();
            case 54:
              return this.$7(f[0]).get(this.$7(f[1]));
            case 55:
              return this.$7(f[0]).set(this.$7(f[1]), this.$7(f[2]));
            case 56:
              return this.$7(f[0]).keys();
            case 57:
              return this.$7(f[0])['delete'](this.$7(f[1]));
            case 58:
              return this.$7(f[0]).has(this.$7(f[1]));
            case 59:
              return this.$7(f[0]).join(this.$7(f[1]) || '');
            case 60:
              return this.$1.i64.of_float(Date.now());
            case 61:
              return this.$1.toJSON(this.$7(f[0]));
            case 62:
              return this.$1.i64.random();
            case 63:
            case 64:
              return !0;
            case 65:
              return k.load().then(function (a) {
                a = a.localizeV1Async;
                return a(d.$7(f[0]), d.$7(f[1]));
              });
            case 66:
              return k.load().then(function (a) {
                a = a.localizeV2Async;
                return a(d.$7(f[0]), d.$7(f[1]));
              });
            case 68:
              return this.$7(f[0]) + this.$7(f[1]);
            case 69:
              return this.$1.i64.add(this.$7(f[0]), this.$7(f[1]));
            case 71:
              return (e = this.$3) == null || (e = e.justknob) == null ? void 0 : e[f[0]];
            case 72:
              return (g = this.$3) == null || (g = g.iggk) == null ? void 0 : g[f[0]];
            case 100:
              return this.$5[f[0]][f[1]];
            case 101:
              if (this.$6 == null) return;
              return this.$6[f[0]];
            case 102:
              return this.$5[this.$7(f[0])].group_count;
            case 73:
              return this.$1.rm;
            case 74:
              return this.$7(f[0]).trim();
            case 75:
              return this.$7(f[0]).split(this.$7(f[1])).join(this.$7(f[2]));
            case 76:
              return f.map(this.$7).join('');
            case 77:
              return this.$1.like(this.$7(f[0]), this.$7(f[1]));
            case 78:
              return [0, this.$7(f[0]).length];
            case 79:
              m = f.map(this.$7);
              n = m[0];
              a = m.slice(1);
              return a.includes(n);
            case 80:
              return this.$7(f[1]).includes(this.$7(f[0]));
            case 81:
              return this.$7(f[0]) - this.$7(f[1]);
            case 82:
              return this.$7(f[0]) * this.$7(f[1]);
            case 83:
              return this.$7(f[0]) / this.$7(f[1]);
            case 84:
              return this.$7(f[0]) % this.$7(f[1]);
            case 91:
              return this.$1.i64.lsl_(this.$7(f[0]), this.$1.i64.to_int32(this.$7(f[1])));
            case 92:
              return this.$1.i64.lsr_(this.$7(f[0]), this.$1.i64.to_int32(this.$7(f[1])));
            case 93:
              return this.$1.i64.asr_(this.$7(f[0]), this.$1.i64.to_int32(this.$7(f[1])));
            case 94:
              return this.$1.i64.and_(this.$7(f[0]), this.$7(f[1]));
            case 95:
              return this.$1.i64.or_(this.$7(f[0]), this.$7(f[1]));
            case 96:
              return this.$1.i64.xor(this.$7(f[0]), this.$7(f[1]));
            case 85:
              return this.$1.i64.sub(this.$7(f[0]), this.$7(f[1]));
            case 86:
              return this.$1.i64.mul(this.$7(f[0]), this.$7(f[1]));
            case 87:
              return this.$1.i64.div(this.$7(f[0]), this.$7(f[1]));
            case 88:
              return this.$1.i64.mod_(this.$7(f[0]), this.$7(f[1]));
            case 89:
              e = f.map(this.$7);
              var o = e[0];
              g = e.slice(1);
              return g.some(function (a) {
                return d.$1.i64.eq(o, a);
              });
            case 90:
              var p = this.$7(f[0]);
              return this.$7(f[1]).some(function (a) {
                return d.$1.i64.eq(p, a);
              });
            case 97:
              return this.$7(f[0]) ? this.$7(f[1]) : this.$7(f[2]);
            case 98:
              m = this.$7(f[0]);
              a = this.$7(f[1]);
              return (m || a) && !(m && a);
            case 99:
              return (n = this.$7(f[0])) != null ? n : this.$7(f[1]);
            case 103:
              return;
            case 104:
              return b.call(null, f[0]);
            case 106:
              return this.$7(f[0]);
            case 108:
              return { gt: this.$7(f[0]) };
            case 109:
              return { gte: this.$7(f[0]) };
            case 110:
              return { lt: this.$7(f[0]) };
            case 111:
              return { lte: this.$7(f[0]) };
            case 112:
              return f.length === 1 ? this.$7(f[0]) : (n = this.$1).merge.apply(n, f.map(this.$7));
            case 113:
              a = f[0];
              m = f[1];
              e = f.slice(2);
              g = e.map(this.$7);
              switch (m) {
                case 'ASC':
                  return (n = this.$1.db.table(a)).fetch.apply(n, g);
                case 'DESC':
                  return (e = this.$1.db.table(a)).fetchDesc.apply(e, g);
              }
              return;
            case 114:
              return this.$1.filter(this.$7(f[0]), function (a) {
                d.$6 = a;
                a = d.$7(f[1]);
                d.$6 = null;
                return a;
              });
            case 115:
              return (m = this.$1).sortBy.apply(m, f.map(this.$7));
            case 116:
              return this.$1.forEach(this.$7(f[0]), function (a) {
                return a['delete']();
              });
            case 117:
              return this.$1.islc(this.$7(f[0]), 0, this.$7(f[1]));
            case 118:
              return this.$1.count(this.$7(f[0]));
            case 119:
              return this.$1.db.table(f[0]).peekNextAutoIncrementId();
            case 120:
              return this.$1.forEach(this.$7(f[0]), function (a) {
                var b = a.item;
                a = a.update;
                var c = {};
                d.$6 = b;
                for (b = 1; b < f.length; b += 2) c[f[b]] = d.$7(f[b + 1]);
                d.$6 = null;
                return a(c);
              });
            case 121:
              n = f[0];
              a = {};
              for (e = 1; e < f.length; e += 2) a[f[e]] = this.$7(f[e + 1]);
              return this.$1.db.table(n).add(a);
            case 122:
              g = f[0];
              m = {};
              for (e = 1; e < f.length; e += 2) m[f[e]] = this.$7(f[e + 1]);
              return this.$1.db.table(g).put(m);
            case 123:
              return this.$1.forEach(this.$7(f[0]), function (a) {
                a = a.item;
                d.$5[f[1]] = a;
                return d.$7(f[2]);
              });
            case 124:
              return this.$7(f[0])
                .next()
                .then(function (a) {
                  var b = a.done;
                  a = a.value;
                  if (b) return d.$7(f[3]);
                  else {
                    b = f[1];
                    if (b != null) {
                      d.$5[b] = a.item;
                      return d.$7(f[2]);
                    }
                  }
                  return 0;
                });
            case 125:
              return this.$7(f[0]).slice(0, this.$7(f[1]));
            case 126:
              return this.$1.groupBy(this.$7(f[0]), f[1]).forEach(function (a) {
                d.$5[f[2]] = a;
                return d.$7(f[3]);
              });
            case 127:
              return this.$7(f[0]).substr(this.$1.i64.to_int32(this.$7(f[1])), this.$1.i64.to_int32(this.$7(f[2])));
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
