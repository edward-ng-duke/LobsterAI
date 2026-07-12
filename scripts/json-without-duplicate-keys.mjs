const isWhitespace = (character) =>
  character === ' ' || character === '\t' || character === '\n' || character === '\r';

export const parseJsonRejectingDuplicateKeys = (source) => {
  let offset = 0;

  const syntaxError = (message) => new SyntaxError(`${message} at offset ${offset}`);
  const skipWhitespace = () => {
    while (offset < source.length && isWhitespace(source[offset])) offset += 1;
  };
  const parseString = () => {
    if (source[offset] !== '"') throw syntaxError('Expected JSON string');
    const start = offset;
    offset += 1;
    let escaped = false;
    while (offset < source.length) {
      const character = source[offset];
      if (!escaped && character === '"') {
        offset += 1;
        return JSON.parse(source.slice(start, offset));
      }
      if (!escaped && character === '\\') escaped = true;
      else escaped = false;
      offset += 1;
    }
    throw syntaxError('Unterminated JSON string');
  };
  const parsePrimitive = () => {
    const start = offset;
    while (offset < source.length && !/[\s,\]}]/.test(source[offset])) offset += 1;
    if (start === offset) throw syntaxError('Expected JSON value');
    return JSON.parse(source.slice(start, offset));
  };
  const parseArray = () => {
    offset += 1;
    skipWhitespace();
    const result = [];
    if (source[offset] === ']') {
      offset += 1;
      return result;
    }
    while (offset < source.length) {
      result.push(parseValue());
      skipWhitespace();
      if (source[offset] === ']') {
        offset += 1;
        return result;
      }
      if (source[offset] !== ',') throw syntaxError('Expected comma or closing bracket');
      offset += 1;
      skipWhitespace();
    }
    throw syntaxError('Unterminated JSON array');
  };
  const parseObject = () => {
    offset += 1;
    skipWhitespace();
    const entries = [];
    const keys = new Set();
    if (source[offset] === '}') {
      offset += 1;
      return Object.fromEntries(entries);
    }
    while (offset < source.length) {
      const key = parseString();
      if (keys.has(key)) throw syntaxError(`Duplicate JSON object key "${key}"`);
      keys.add(key);
      skipWhitespace();
      if (source[offset] !== ':') throw syntaxError('Expected colon after object key');
      offset += 1;
      const value = parseValue();
      entries.push([key, value]);
      skipWhitespace();
      if (source[offset] === '}') {
        offset += 1;
        return Object.fromEntries(entries);
      }
      if (source[offset] !== ',') throw syntaxError('Expected comma or closing brace');
      offset += 1;
      skipWhitespace();
    }
    throw syntaxError('Unterminated JSON object');
  };
  const parseValue = () => {
    skipWhitespace();
    if (source[offset] === '{') return parseObject();
    if (source[offset] === '[') return parseArray();
    if (source[offset] === '"') return parseString();
    return parsePrimitive();
  };

  const value = parseValue();
  skipWhitespace();
  if (offset !== source.length) throw syntaxError('Unexpected trailing JSON content');
  return value;
};
