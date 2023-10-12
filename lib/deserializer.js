var sax = require('sax');

class Deserializer {
  constructor(encoding) {
    this.type = null;
    this.responseType = null;
    this.stack = [];
    this.marks = [];
    this.data = [];
    this.methodname = null;
    this.encoding = encoding;
    this.value = false;
    this.callback = null;
    this.error = null;
    this.push = (value) => this.stack.push(value);

    this.parser = sax.parser(true);
    this.parser.onopentag = (node) => this.onOpentag(node);
    this.parser.onclosetag = (el) => this.onClosetag(el);
    this.parser.ontext = (text) => this.onText(text);
    this.parser.oncdata = (cdata) => this.onCDATA(cdata);
    this.parser.onend = () => this.onDone();
    this.parser.onerror = (msg) => this.onError(msg);
  }

  deserializeMethodResponse(bodyText, callback) {
    this.callback = (error, result) => {
      if (error) {
        callback(error);
      } else if (this.type !== 'methodresponse') {
        callback(new Error('Not a method response'));
      } else if (!this.responseType) {
        callback(new Error('Invalid method response'));
      } else {
        callback(null, result[0]);
      }
    };

    this.parser.write(bodyText).close();
  }

  onDone() {
    if (!this.error) {
      if (this.type === null || this.marks.length) {
        this.callback(new Error('Invalid XML-RPC message'));
      } else if (this.responseType === 'fault') {
        const createFault = (fault) => {
          let error = new Error(
            'XML-RPC fault' +
              (fault.faultString ? ': ' + fault.faultString : '')
          );
          error.code = fault.faultCode;
          error.faultCode = fault.faultCode;
          error.faultString = fault.faultString;
          return error;
        };
        this.callback(createFault(this.stack[0]));
      } else {
        this.callback(undefined, this.stack);
      }
    }
  }

  onError(msg) {
    if (!this.error) {
      if (typeof msg === 'string') {
        this.error = new Error(msg);
      } else {
        this.error = msg;
      }
      this.callback(this.error);
    }
  }

  //==============================================================================
  // SAX Handlers
  //==============================================================================
  onOpentag(node) {
    if (node.name === 'ARRAY' || node.name === 'STRUCT') {
      this.marks.push(this.stack.length);
    }
    this.data = [];
    this.value = node.name === 'VALUE';
  }

  onText(text) {
    this.data.push(text);
  }

  onCDATA(cdata) {
    this.data.push(cdata);
  }

  onClosetag(el) {
    var data = this.data.join('');
    try {
      switch (el.toUpperCase()) {
        case 'BOOLEAN':
          this.endBoolean(data);
          break;
        case 'INT':
        case 'I4':
          this.endInt(data);
          break;
        case 'I8':
          this.endI8(data);
          break;
        case 'DOUBLE':
          this.endDouble(data);
          break;
        case 'STRING':
        case 'NAME':
          this.endString(data);
          break;
        case 'ARRAY':
          this.endArray(data);
          break;
        case 'STRUCT':
          this.endStruct(data);
          break;
        case 'VALUE':
          this.endValue(data);
          break;
        case 'PARAMS':
          this.endParams(data);
          break;
        case 'FAULT':
          this.endFault(data);
          break;
        case 'METHODRESPONSE':
          this.endMethodResponse(data);
          break;
        case 'METHODNAME':
          this.endMethodName(data);
          break;
        case 'METHODCALL':
          this.endMethodCall(data);
          break;
        case 'NIL':
          this.endNil(data);
          break;
        case 'DATA':
        case 'PARAM':
        case 'MEMBER':
          // Ignored by design
          break;
        default:
          this.onError("Unknown XML-RPC tag '" + el + "'");
          break;
      }
    } catch (e) {
      this.onError(e);
    }
  }

  endNil(data) {
    this.push(null);
    this.value = false;
  }

  endBoolean(data) {
    if (data === '1') {
      this.push(true);
    } else if (data === '0') {
      this.push(false);
    } else {
      throw new Error(`Illegal boolean value "${data}"`);
    }
    this.value = false;
  }

  endInt(data) {
    var value = parseInt(data, 10);
    if (isNaN(value)) {
      throw new Error("Expected an integer but got '" + data + "'");
    } else {
      this.push(value);
      this.value = false;
    }
  }

  endDouble(data) {
    var value = parseFloat(data);
    if (isNaN(value)) {
      throw new Error("Expected a double but got '" + data + "'");
    } else {
      this.push(value);
      this.value = false;
    }
  }

  endString(data) {
    this.push(data);
    this.value = false;
  }

  endArray(data) {
    const mark = this.marks.pop();
    this.stack.splice(mark, this.stack.length - mark, this.stack.slice(mark));
    this.value = false;
  }

  endStruct(data) {
    const mark = this.marks.pop();
    let struct = {};
    const items = this.stack.slice(mark);

    for (let i = 0; i < items.length; i += 2) {
      struct[items[i]] = items[i + 1];
    }
    this.stack.splice(mark, this.stack.length - mark, struct);
    this.value = false;
  }

  endI8(data) {
    const isInteger = /^-?\d+$/;
    if (!isInteger.test(data)) {
      throw new Error("Expected integer (I8) value but got '" + data + "'");
    } else {
      this.endInt(data);
    }
  }

  endValue(data) {
    if (this.value) {
      this.push(data);
      this.value = false;
    }
  }

  endParams(data) {
    this.responseType = 'params';
  }

  endFault(data) {
    this.responseType = 'fault';
  }

  endMethodResponse(data) {
    this.type = 'methodresponse';
  }

  endMethodName(data) {
    this.methodname = data;
  }

  endMethodCall(data) {
    this.type = 'methodcall';
  }
}

module.exports = Deserializer;
