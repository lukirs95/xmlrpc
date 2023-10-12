const Serializer = require('./serializer');
const Deserializer = require('./deserializer');

module.exports.Client = class Client {
  /**
   * Creates a Client object for making XML-RPC method calls.
   *
   * @param {Object} options - Server options to make the HTTP request to.
   *   - {String} host
   *   - {Number} port
   *   - {String} path
   */
  constructor(options) {
    var headers = {
      'User-Agent': 'XML-RPC Client',
      'Content-Type': 'text/xml',
      Accept: 'text/xml',
      'Accept-Charset': 'UTF8',
      Connection: 'Keep-Alive'
    };
    options.headers = options.headers || {};

    for (var attribute in headers) {
      if (options.headers[attribute] === undefined) {
        options.headers[attribute] = headers[attribute];
      }
    }

    options.method = 'POST';
    this.options = options;
  }

  /**
   * Makes an XML-RPC call to the server specified by the constructor's options.
   *
   * @param {String} method     - The method name.
   * @param {Array} params      - Params to send in the call.
   * @returns {Promise<Object>}
   */
  methodCall(method, params) {
    const options = this.options;
    const xml = Serializer.serializeMethodCall(method, params);

    options.headers['Content-Length'] = xml.length;

    return new Promise((resolve, reject) => {
      fetch(
        `http://${this.options.host}:${this.options.port}${this.options.path}`,
        {
          method: options.method,
          body: xml,
          headers: this.options.headers
        }
      )
        .then((response) => {
          if (response.status == 404) {
            reject('Not Found');
          } else {
            return Promise.resolve(response);
          }
        })
        .then((response) => response?.text())
        .then((body) => {
          var deserializer = new Deserializer('utf8');

          deserializer.deserializeMethodResponse(body, (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          });
        })
        .catch((reason) => reject(reason));
    });
  }
};
