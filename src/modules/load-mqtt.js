var websocket = require('websocket-stream');
const mqtt = require('mqtt');
const { getGUID } = require('../utils/common');
const logger = require('../utils/logger');

const titleMqtt = 'MQTT';

module.exports = class LoadMqtt {
  constructor() {
    this.mqttClient = null;
    this.ctx = null;
    this.lastSeqId = null;
    this.syncToken = null;
    this.cookies = [];
    this.userAgent = '';
  }
  getUsername(userID, sessionID, guid) {
    return JSON.stringify({
      u: userID,
      s: sessionID,
      chat_on: false,
      fg: false,
      d: guid,
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
    });
  }
  getOptionMqtt(host, userAgent, cookieString, userID, sessionID, guid) {
    return {
      clientId: 'mqttwsclient',
      protocolId: 'MQIsdp',
      protocolVersion: 3,
      username: this.getUsername(userID, sessionID, guid),
      clean: true,
      wsOptions: {
        headers: {
          Cookie: cookieString,
          Origin: 'https://www.facebook.com',
          'User-Agent': userAgent,
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
  }
  handleMqttError(err) {
    logger.error(titleMqtt, 'Lỗi kết nối MQTT: ' + err.message);
    // this.mqttClient.end();
    // this.setupMqtt();
  }
  handleMqttConnect() {
    [
      '/legacy_web',
      '/webrtc',
      '/rtc_multi',
      '/onevc',
      '/br_sr', //Notification
      //Need to publish /br_sr right after this
      '/sr_res',
      '/t_ms',
      '/thread_typing',
      '/orca_typing_notifications',
      '/notify_disconnect',
      //Need to publish /messenger_sync_create_queue right after this
      '/orca_presence',
    ].forEach((a) => this.mqttClient.subscribe(a));
    this.mqttClient.publish(
      this.syncToken ? '/messenger_sync_get_diffs' : '/messenger_sync_create_queue',
      JSON.stringify({
        sync_api_version: 10,
        max_deltas_able_to_process: 1000,
        delta_batch_size: 500,
        encoding: 'JSON',
        entity_fbid: this.infoBot.fbId,
        ...(this.syncToken
          ? {
              last_seq_id: this.lastSeqId,
              sync_token: this.syncToken,
            }
          : {
              initial_titan_sequence_id: this.lastSeqId,
              device_params: null,
            }),
      }),
      { qos: 1, retain: false },
    );
  }
  parseDelta(delta) {
    switch (delta.class) {
      case 'NewMessage':
    }
  }
  handleMqttMessage(topic, message, _packet) {
    try {
      var jsonMessage = JSON.parse(message);
    } catch (ex) {
      return logger.error(titleMqtt, ex);
    }
    if (topic != '/t_ms') return;
    if (jsonMessage.firstDeltaSeqId && jsonMessage.syncToken) {
      this.lastSeqId = jsonMessage.firstDeltaSeqId;
      this.syncToken = jsonMessage.syncToken;
    }
    if (jsonMessage.lastIssuedSeqId) this.lastSeqId = parseInt(jsonMessage.lastIssuedSeqId);
    for (var i in jsonMessage.deltas) this.parseDelta(jsonMessage.deltas[i]);
  }
  setupMqtt() {
    const cookieString = this.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
    const guid = getGUID();
    const host = `${this.infoBot.mqttConfig.endpoint}&sid=${sessionID}&cid=${guid}`;
    const options = this.getOptionMqtt(host, this.userAgent, cookieString, this.infoBot.fbId, sessionID, guid);
    this.mqttClient = new mqtt.Client((_) => websocket(host, options.wsOptions), options);
    this.mqttClient.on('error', (err) => this.handleMqttError(err));
    this.mqttClient.on('connect', () => this.handleMqttConnect());
    this.mqttClient.on('message', (a, b, c) => this.handleMqttMessage(a, b, c));
  }
  async init(ctx) {
    this.ctx = ctx;
    this.infoBot = ctx.infoBot.data;
    this.lastSeqId = this.infoBot.irisSeqID;
    this.userAgent = ctx.brower.page.userAgent;
    this.cookies = await ctx.brower.page.cookies();
    this.setupMqtt();
  }
};
