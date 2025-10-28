var websocket = require('websocket-stream');
const mqtt = require('mqtt');
const { getGUID } = require('../utils/common');
const logger = require('../utils/logger');

module.exports = class LoadMqtt {
  constructor() {
    this.mqttClient = null;
    this.sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    this.guid = getGUID();
    this.ctx = null;
    this.lastSeqId = null;
  }

  async init(ctx) {
    this.ctx = ctx;
    this.infoBot = ctx.infoBot.data;
    this.lastSeqId = this.infoBot.irisSeqID;
    const host = `${this.infoBot.mqttConfig.endpoint}&sid=${this.sessionID}&cid=${this.guid}`;
    const cookies = await ctx.brower.page.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const options = {
      clientId: 'mqttwsclient',
      protocolId: 'MQIsdp',
      protocolVersion: 3,
      username: JSON.stringify({
        u: this.infoBot.userID,
        s: this.sessionID,
        chat_on: false,
        fg: false,
        d: this.guid,
        ct: 'websocket',
        aid: '219994525426954',
        aids: null,
        mqtt_sid: '',
        cp: 3,
        ecp: 10,
        st: [],
        pm: [],
        dc: '',
        no_auto_fg: true,
        gas: null,
        pack: [],
        p: null,
        php_override: '',
      }),
      clean: true,
      wsOptions: {
        headers: {
          Cookie: cookieString,
          Origin: 'https://www.facebook.com',
          'User-Agent': ctx.brower.page.userAgent,
          Referer: 'https://www.facebook.com/',
          Host: new URL(host).hostname,
        },
        origin: 'https://www.facebook.com',
        protocolVersion: 13,
        binaryType: 'arraybuffer',
      },
      keepalive: 60,
      reschedulePings: true,
      reconnectPeriod: 2000,
      connectTimeout: 10000,
    };
    this.mqttClient = new mqtt.Client((_) => websocket(host, options.wsOptions), options);
    this.mqttClient.on('error', (err) => {
      logger.error('MQTT', 'Lỗi kết nối MQTT: ' + err.message);
    });
    this.mqttClient.on('connect', () => {
      const topics = [
        '/ls_req',
        '/ls_resp',
        '/legacy_web',
        '/webrtc',
        '/rtc_multi',
        '/onevc',
        '/br_sr',
        '/sr_res',
        '/t_ms',
        '/thread_typing',
        '/orca_typing_notifications',
        '/notify_disconnect',
        '/orca_presence',
        '/inbox',
        '/mercury',
        '/messaging_events',
        '/orca_message_notifications',
        '/pp',
        '/webrtc_response',
      ];
      topics.forEach((topicsub) => this.mqttClient.subscribe(topicsub));

      const queue = {
        sync_api_version: 11,
        max_deltas_able_to_process: 100,
        delta_batch_size: 500,
        encoding: 'JSON',
        entity_fbid: ctx.infoBot.data.userID,
        initial_titan_sequence_id: this.lastSeqId,
        device_params: null,
      };
      this.mqttClient.publish('/messenger_sync_create_queue', JSON.stringify(queue), {
        qos: 1,
        retain: false,
      });
    });
    this.mqttClient.on('message', (topic, message, _packet) => {
      const jsonMessage = JSON.parse(message.toString());
      logger.info('MQTT', `Nhận tin nhắn trên chủ đề ${topic}: ${message.toString()}`);
    });
  }
};
