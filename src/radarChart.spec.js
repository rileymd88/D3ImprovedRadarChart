import { getValidCssClassName } from './radarChart';

describe('getSafeClassName', () => {
  const input = [
    { raw: '5/24/2018 9:34:34 AM', expected: '524201893434AM' },
    { raw: '   s      o   m e where over the rainbow ', expected: 'somewhereovertherainbow' }
  ];

  input.forEach(({ raw, expected }) => {
    it(`should convert dates to valid class names from ${raw} to ${expected}`, () => {
      expect(getValidCssClassName(raw)).toEqual(expected);
    });
  });
});
