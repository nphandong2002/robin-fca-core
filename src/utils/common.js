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
function makeParsable(html) {
  let withoutForLoop = html.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, '');
  let maybeMultipleObjects = withoutForLoop.split(/\}\r\n *\{/);
  if (maybeMultipleObjects.length === 1) return maybeMultipleObjects;

  return '[' + maybeMultipleObjects.join('},{') + ']';
}
function parseJSON(brower) {
  return function (data) {
    if (data.statusCode !== 200) throw new Error(`Request failed with status code ${data.statusCode}`);
    console.log(makeParsable(data.body));

    try {
      res = JSON.parse(makeParsable(data.body));
    } catch (e) {
      throw {
        error: 'JSON.parse error. Check the `detail` property on this error.',
        detail: e,
        res: data.body,
      };
    }
    if (res.redirect && data.request.method === 'GET')
      return brower.get(res.redirect, ctx.jar).then(parseJSON(ctx, defaultFuncs));
    return res;
  };
}
module.exports = {
  getGUID,
  parseJSON,
};
