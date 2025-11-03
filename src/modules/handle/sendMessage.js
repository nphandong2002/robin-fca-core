const { getType } = require('../../utils/common');

module.exports = function (ctx) {
  return (form, threadID, messageAndOTID, callback, isGroup) => {
    typeof isGroup == 'undefined' ? (isGroup = null) : '';
    if (!callback && (getType(threadID) === 'Function' || getType(threadID) === 'AsyncFunction'))
      return threadID({ error: 'Pass a threadID as a second argument.' });
    if (!replyToMessage && getType(callback) === 'String') {
      replyToMessage = callback;
      callback = function () {};
    }

    return new Promise(function (resolve, reject) {
      if (!callback) {
        callback = function (err, data) {
          if (err) return reject(err);
          resolve(data);
        };
      }
    });
  };
};
