function getGUID() {
  var sectionLength = Date.now();
  var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    var _guid = (c == 'x' ? r : (r & 7) | 8).toString(16);
    return _guid;
  });
  return id;
}

function getType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}
module.exports = {
  getGUID,
  getType,
};
