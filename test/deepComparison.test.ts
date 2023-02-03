import { deepComparison } from 'dustbin-react';
import { describe, expect, test } from 'vitest';

describe('test with value type', () => {
  test('number eq', () => {
    expect(deepComparison(111, 111)).toBeTruthy();
  });

  test('number not eq', () => {
    expect(deepComparison(111, 2222)).not.toBeTruthy();
  });

  test('string eq', () => {
    expect(deepComparison('2222', '2222')).toBeTruthy();
  });

  test('string not eq', () => {
    expect(deepComparison('1111', '2222')).not.toBeTruthy();
  });

  test('undefined eq', () => {
    expect(deepComparison(undefined, undefined)).toBeTruthy();
  });

  test('undefined not eq', () => {
    expect(deepComparison(undefined, 1111)).not.toBeTruthy();
  });

  test('boolean eq', () => {
    expect(deepComparison(true, true)).toBeTruthy();
  });

  test('boolean not eq', () => {
    expect(deepComparison(true, false)).not.toBeTruthy();
  });
});

describe('test with function type', () => {
  test('function eq', () => {
    expect(
      deepComparison(
        () => {
          console.log(1111);
        },
        () => {
          console.log(1111);
        }
      )
    ).toBeTruthy();
  });

  test('function not eq', () => {
    expect(
      deepComparison(
        () => {
          console.log(1111);
        },
        () => {
          console.log(2222);
        }
      )
    ).not.toBeTruthy();
  });
});

describe('test with reference type', () => {
  test('null eq', () => {
    expect(deepComparison(null, null)).toBeTruthy();
  });

  test('null not eq', () => {
    expect(deepComparison(null, 1111)).not.toBeTruthy();
  });

  test('object eq', () => {
    expect(
      deepComparison(
        {
          value: 1,
          children: 2,
          list: [
            {
              value: 1,
            },
          ],
        },
        {
          value: 1,
          children: 2,
          list: [
            {
              value: 1,
            },
          ],
        }
      )
    ).toBeTruthy();
  });

  test('object not eq', () => {
    expect(
      deepComparison(
        {
          value: 1,
          children: 2,
          list: [
            {
              value: 1,
            },
          ],
        },
        {
          value: 1,
          children: 2,
          list: [
            {
              value: 1,
              value2: 222,
            },
          ],
        }
      )
    ).not.toBeTruthy();
  });

  test('array eq', () => {
    expect(deepComparison([1111], [1111])).toBeTruthy();
  });

  test('array not eq', () => {
    expect(
      deepComparison(
        [
          1111,
          2222,
          {
            value: 111,
            list: [],
          },
        ],
        [
          1111,
          2222,
          {
            value: 111,
            list: [],
            error: true,
          },
        ]
      )
    ).not.toBeTruthy();
  });
});
