# The What

The xmlrpc module is a pure JavaScript XML-RPC client for node.js.

Pure JavaScript means that the [XML parsing](https://github.com/isaacs/sax-js)
and [XML building](https://github.com/robrighter/node-xml) use pure JavaScript
libraries, so no extra C dependencies or build requirements. The xmlrpc module
can be used as an XML-RPC client, making method calls and receiving
method responses.

## The How

### To Use

A brief example:

```javascript
const { XMLRPCClient } = require('xmlrpc-client');

const client = new XMLRPCClient({
  host: "127.0.0.1",
  port: 80,
  path: '/'
});

client.methodCall('sampleMethod', [...params])
  .then((response) => {
    console.log(response);
  })
  .catch((reason) => {
    console.log(reason);
  });
```

### Custom Types

If you need to parse to a specific format or need to handle custom data types
that are not supported by default, it is possible to extend the serializer
with a user-defined type for your specific needs.

A custom type can be defined as follows:

```javascript
const { CustomType } = require('xmlrpc-client');
const util = require('util');

// create your custom class
const YourType = function (raw) {
  CustomType.call(this, raw);
};

// inherit everything
util.inherits(YourType, CustomType);

// set a custom tagName (defaults to 'customType')
YourType.prototype.tagName = 'yourType';

// optionally, override the serializer
YourType.prototype.serialize = function (xml) {
  var value = somefunction(this.raw);
  return xml.ele(this.tagName).txt(value);
}
```

## The License (MIT)

Released under the MIT license. See the LICENSE file for the complete wording.

## Contributors

Thank you to all [the
authors](https://github.com/baalexander/node-xmlrpc/graphs/contributors) and
everyone who has filed an issue to help make xmlrpc better.
