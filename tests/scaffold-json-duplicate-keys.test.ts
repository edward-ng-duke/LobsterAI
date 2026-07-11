import { describe, expect, test } from 'vitest';

import { parseJsonRejectingDuplicateKeys } from '../scripts/json-without-duplicate-keys.mjs';

describe('duplicate-safe JSON parser', () => {
  test('rejects duplicate keys nested in objects and array items', () => {
    expect(() => parseJsonRejectingDuplicateKeys('{"outer":{"key":1,"key":2}}')).toThrow(
      /duplicate JSON object key.*key/i,
    );
    expect(() => parseJsonRejectingDuplicateKeys('[{"key":1,"key":2}]')).toThrow(
      /duplicate JSON object key.*key/i,
    );
  });

  test('decodes escaped keys before checking uniqueness', () => {
    expect(() =>
      parseJsonRejectingDuplicateKeys('{"apps/api":1,"apps\\u002fapi":2}'),
    ).toThrow(/duplicate JSON object key.*apps\/api/i);
    expect(() => parseJsonRejectingDuplicateKeys('{"a":1,"\\u0061":2}')).toThrow(
      /duplicate JSON object key.*a/i,
    );
  });

  test('does not mistake key-like text inside string values for object keys', () => {
    expect(
      parseJsonRejectingDuplicateKeys(
        '{"text":"\\\"apps/api\\\": 1, \\\"nested\\\": {}","apps/api":1}',
      ),
    ).toEqual({ text: '"apps/api": 1, "nested": {}', 'apps/api': 1 });
  });

  test('preserves normal JSON parsing and syntax errors', () => {
    expect(parseJsonRejectingDuplicateKeys('{"a":1,"nested":{"a":2}}')).toEqual({
      a: 1,
      nested: { a: 2 },
    });
    expect(() => parseJsonRejectingDuplicateKeys('{"a":')).toThrow(SyntaxError);
    expect(() => parseJsonRejectingDuplicateKeys('{"a":1\u00a0}')).toThrow(SyntaxError);
  });
});
