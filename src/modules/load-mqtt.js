var websocket = require('websocket-stream');
const mqtt = require('mqtt');
const { getGUID } = require('../utils/common');
const logger = require('../utils/logger');
const { formatDeltaMessage, _formatAttachment, formatDeltaEvent } = require('../utils/mqtt');

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

const titleMqtt = 'MQTT';

module.exports = class LoadMqtt {
  constructor() {
    this.mqttClient = null;
    this.ctx = null;
    this.lastSeqId = null;
    this.syncToken = null;
    this.cookies = [];
    this.userAgent = '';
    this.subscribers = new Set();
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
    topics.forEach((a) => this.mqttClient.subscribe(a));
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
    if (['ThreadName', 'ParticipantsAddedToGroupThread', 'ParticipantLeftGroupThread'].includes(delta.class)) {
      try {
        this.sendDateSub(null, formatDeltaEvent(delta));
      } catch (err) {
        logger.error(titleMqtt, delta.class, err);
      }
    }
    if (delta.class === 'ForcedFetch') {
      //TODO call ws mà làm
      logger.info(titleMqtt, delta.class, delta);
    }
    if (delta.class === 'AdminTextMessage') {
      switch (delta.type) {
        case 'joinable_group_link_mode_change':
        case 'magic_words':
        case 'pin_messages_v2':
        case 'change_thread_theme':
        case 'change_thread_icon':
        case 'change_thread_nickname':
        case 'change_thread_admins':
        case 'change_thread_approval_mode':
        case 'group_poll':
        case 'messenger_call_log':
        case 'participant_joined_group_call':
          try {
            this.sendDateSub(null, formatDeltaEvent(delta));
          } catch (err) {
            return this.sendDateSub({
              error:
                'Problem parsing message object. Please open an issue at https://github.com/Schmavery/facebook-chat-api/issues.',
              detail: err,
              res: v.delta,
              type: 'parse_error',
            });
          }
          return;
        default:
          return;
      }
    }
    if (delta.class === 'NewMessage') {
      try {
        this.sendDateSub(null, formatDeltaMessage(delta));
      } catch (err) {
        this.sendDateSub({
          error:
            'Problem parsing message object. Please open an issue at https://github.com/VangBanLaNhat/fca-unofficial/issues.',
          detail: err,
          res: delta,
          type: 'parse_error',
        });
      }
    }
    if (delta.class === 'ClientPayload') {
      let clientPayload = JSON.parse(String.fromCharCode.apply(null, delta.payload));
      if (!clientPayload?.deltas) return;
      for (var i in clientPayload.deltas) {
        var delta = clientPayload.deltas[i];
        if (delta.deltaMessageReaction)
          this.sendDateSub(null, {
            type: 'message_reaction',
            threadID: (delta.deltaMessageReaction.threadKey.threadFbId
              ? delta.deltaMessageReaction.threadKey.threadFbId
              : delta.deltaMessageReaction.threadKey.otherUserFbId
            ).toString(),
            messageID: delta.deltaMessageReaction.messageId,
            reaction: delta.deltaMessageReaction.reaction,
            senderID: delta.deltaMessageReaction.senderId.toString(),
            userID: delta.deltaMessageReaction.userId.toString(),
          });
        else if (delta.deltaRecallMessageData)
          this.sendDateSub(null, {
            type: 'message_unsend',
            threadID: (delta.deltaRecallMessageData.threadKey.threadFbId
              ? delta.deltaRecallMessageData.threadKey.threadFbId
              : delta.deltaRecallMessageData.threadKey.otherUserFbId
            ).toString(),
            messageID: delta.deltaRecallMessageData.messageID,
            senderID: delta.deltaRecallMessageData.senderID.toString(),
            deletionTimestamp: delta.deltaRecallMessageData.deletionTimestamp,
            timestamp: delta.deltaRecallMessageData.timestamp,
          });
        else if (delta.deltaMessageReply) {
          var mdata = JSON.parse(delta?.deltaMessageReply?.message?.data?.prng || '[]');
          var m_id = mdata.map((u) => u.i);
          var m_offset = mdata.map((u) => u.o);
          var m_length = mdata.map((u) => u.l);

          var mentions = {};

          for (var i = 0; i < m_id.length; i++)
            mentions[m_id[i]] = (delta.deltaMessageReply.message.body || '').substring(
              m_offset[i],
              m_offset[i] + m_length[i],
            );
          var callbackToReturn = {
            type: 'message_reply',
            threadID: (delta.deltaMessageReply.message.messageMetadata.threadKey.threadFbId
              ? delta.deltaMessageReply.message.messageMetadata.threadKey.threadFbId
              : delta.deltaMessageReply.message.messageMetadata.threadKey.otherUserFbId
            ).toString(),
            messageID: delta.deltaMessageReply.message.messageMetadata.messageId,
            senderID: delta.deltaMessageReply.message.messageMetadata.actorFbId.toString(),
            attachments: delta.deltaMessageReply.message.attachments
              .map(function (att) {
                var mercury = JSON.parse(att.mercuryJSON);
                Object.assign(att, mercury);
                return att;
              })
              .map((att) => {
                var x;
                try {
                  x = _formatAttachment(att);
                } catch (ex) {
                  x = att;
                  x.error = ex;
                  x.type = 'unknown';
                }
                return x;
              }),
            args: (delta.deltaMessageReply.message.body || '').trim().split(/\s+/),
            body: delta.deltaMessageReply.message.body || '',
            isGroup: !!delta.deltaMessageReply.message.messageMetadata.threadKey.threadFbId,
            mentions: mentions,
            timestamp: delta.deltaMessageReply.message.messageMetadata.timestamp,
            participantIDs: (delta.deltaMessageReply.message.participants || []).map((e) => e.toString()),
          };
          if (delta.deltaMessageReply.repliedToMessage) {
            mdata = JSON.parse(delta.deltaMessageReply?.repliedToMessage?.data?.prng || '[]');
            m_id = mdata.map((u) => u.i);
            m_offset = mdata.map((u) => u.o);
            m_length = mdata.map((u) => u.l);

            var rmentions = {};

            for (var i = 0; i < m_id.length; i++)
              rmentions[m_id[i]] = (delta.deltaMessageReply.repliedToMessage.body || '').substring(
                m_offset[i],
                m_offset[i] + m_length[i],
              );
            callbackToReturn.messageReply = {
              threadID: (delta.deltaMessageReply.repliedToMessage.messageMetadata.threadKey.threadFbId
                ? delta.deltaMessageReply.repliedToMessage.messageMetadata.threadKey.threadFbId
                : delta.deltaMessageReply.repliedToMessage.messageMetadata.threadKey.otherUserFbId
              ).toString(),
              messageID: delta.deltaMessageReply.repliedToMessage.messageMetadata.messageId,
              senderID: delta.deltaMessageReply.repliedToMessage.messageMetadata.actorFbId.toString(),
              attachments: delta.deltaMessageReply.repliedToMessage.attachments
                .map(function (att) {
                  var mercury = JSON.parse(att.mercuryJSON);
                  Object.assign(att, mercury);
                  return att;
                })
                .map((att) => {
                  var x;
                  try {
                    x = _formatAttachment(att);
                  } catch (ex) {
                    x = att;
                    x.error = ex;
                    x.type = 'unknown';
                  }
                  return x;
                }),
              args: (delta.deltaMessageReply.repliedToMessage.body || '').trim().split(/\s+/),
              body: delta.deltaMessageReply.repliedToMessage.body || '',
              isGroup: !!delta.deltaMessageReply.repliedToMessage.messageMetadata.threadKey.threadFbId,
              mentions: rmentions,
              timestamp: delta.deltaMessageReply.repliedToMessage.messageMetadata.timestamp,
              participantIDs: (delta.deltaMessageReply.repliedToMessage.participants || []).map((e) => e.toString()),
            };
          } else if (delta.deltaMessageReply.replyToMessageId) {
            //TODO call sang ws mà lấy
          }
          this.sendDateSub(null, callbackToReturn);
        }
      }
    }
  }
  sendDateSub(err, msg) {
    for (const cb of this.subscribers) {
      try {
        cb(err, msg);
      } catch (err) {
        logger.error(titleMqtt, `Lỗi khi chạy callback: ${err.message}`);
      }
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
  subscribe(callback) {
    if (typeof callback !== 'function') throw new Error('Callback phải là một function');
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
      logger.info(titleMqtt, 'Đã hủy đăng ký callback');
    };
  }
};
