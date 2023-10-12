module.exports.CustomType = class CustomType {
  constructor(raw) {
    this.raw = raw;
    this.tagName = 'customType';
  }

  serialize(xml) {
    return xml.ele(this.tagName).txt(this.raw);
  }
};
