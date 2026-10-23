import { FormControl } from '@angular/forms'
import { fontSizeValidator } from './font-size.validator'

describe('fontSizeValidator', () => {
  const validator = fontSizeValidator()

  const validate = (value: string | number | null | undefined) => validator(new FormControl(value))

  describe('empty / nullish values', () => {
    it('should return null for undefined', () => {
      expect(validate(undefined)).toBeNull()
    })

    it('should return null for null', () => {
      expect(validate(null)).toBeNull()
    })

    it('should return null for an empty string', () => {
      expect(validate('')).toBeNull()
    })

    it('should return null for a zero value', () => {
      expect(validate(0)).toBeNull()
    })
  })

  describe('invalid format', () => {
    it('should flag letters only', () => {
      expect(validate('abc')!['invalidFontSize']).toEqual({ value: 'abc' })
    })

    it('should flag a number without a unit', () => {
      expect(validate('12')!['invalidFontSize']).toEqual({ value: '12' })
    })

    it('should flag an unsupported unit', () => {
      expect(validate('12pt')!['invalidFontSize']).toEqual({ value: '12pt' })
    })

    it('should flag a unit placed before the number', () => {
      expect(validate('px12')!['invalidFontSize']).toEqual({ value: 'px12' })
    })

    it('should flag a unit without a number', () => {
      expect(validate('px')!['invalidFontSize']).toEqual({ value: 'px' })
    })

    it('should flag multiple values', () => {
      expect(validate('12px 24px')!['invalidFontSize']).toEqual({ value: '12px 24px' })
    })

    it('should flag a number with two decimal points', () => {
      expect(validate('12.5.6px')!['invalidFontSize']).toEqual({ value: '12.5.6px' })
    })

    it('should flag a negative number', () => {
      expect(validate('-4px')!['invalidFontSize']).toEqual({ value: '-4px' })
    })

    it('should flag a leading plus sign', () => {
      expect(validate('+4px')!['invalidFontSize']).toEqual({ value: '+4px' })
    })

    it('should flag a space before the unit', () => {
      expect(validate('12 px')!['invalidFontSize']).toEqual({ value: '12 px' })
    })
  })

  describe('px values (8-40)', () => {
    it('should accept the lower boundary (8px)', () => {
      expect(validate('8px')).toBeNull()
    })

    it('should accept the upper boundary (40px)', () => {
      expect(validate('40px')).toBeNull()
    })

    it('should accept a typical size (14px)', () => {
      expect(validate('14px')).toBeNull()
    })

    it('should flag a decimal below the range (0.5px)', () => {
      expect(validate('0.5px')!['invalidFontSizeRange']).toEqual({ value: '0.5px', min: 8, max: 40, unit: 'px' })
    })

    it('should flag a value below the range (7px)', () => {
      expect(validate('7px')!['invalidFontSizeRange']).toEqual({ value: '7px', min: 8, max: 40, unit: 'px' })
    })

    it('should flag a value above the range (41px)', () => {
      expect(validate('41px')!['invalidFontSizeRange']).toEqual({ value: '41px', min: 8, max: 40, unit: 'px' })
    })

    it('should flag zero (0px)', () => {
      expect(validate('0px')!['invalidFontSizeRange']).toEqual({ value: '0px', min: 8, max: 40, unit: 'px' })
    })

    it('should flag a small decimal below the range (0.4px)', () => {
      expect(validate('0.4px')!['invalidFontSizeRange']).toEqual({ value: '0.4px', min: 8, max: 40, unit: 'px' })
    })
  })

  describe('rem / em values (0.5-2.5)', () => {
    it('should accept the lower boundary (0.5rem)', () => {
      expect(validate('0.5rem')).toBeNull()
    })

    it('should accept the upper boundary (2.5rem)', () => {
      expect(validate('2.5rem')).toBeNull()
    })

    it('should accept a typical value (1.2rem)', () => {
      expect(validate('1.2rem')).toBeNull()
    })

    it('should accept a whole number (1rem)', () => {
      expect(validate('1rem')).toBeNull()
    })

    it('should accept the lower boundary (0.5em)', () => {
      expect(validate('0.5em')).toBeNull()
    })

    it('should accept the upper boundary (2.5em)', () => {
      expect(validate('2.5em')).toBeNull()
    })

    it('should accept a typical value (1.5em)', () => {
      expect(validate('1.5em')).toBeNull()
    })

    it('should flag a value below the range (0.4rem)', () => {
      expect(validate('0.4rem')!['invalidFontSizeRange']).toEqual({ value: '0.4rem', min: 0.5, max: 2.5, unit: 'rem' })
    })

    it('should flag a value above the range (2.6rem)', () => {
      expect(validate('2.6rem')!['invalidFontSizeRange']).toEqual({ value: '2.6rem', min: 0.5, max: 2.5, unit: 'rem' })
    })

    it('should flag zero (0rem)', () => {
      expect(validate('0rem')!['invalidFontSizeRange']).toEqual({ value: '0rem', min: 0.5, max: 2.5, unit: 'rem' })
    })

    it('should flag a value below the range (0.4em)', () => {
      expect(validate('0.4em')!['invalidFontSizeRange']).toEqual({ value: '0.4em', min: 0.5, max: 2.5, unit: 'em' })
    })

    it('should flag a value above the range (2.6em)', () => {
      expect(validate('2.6em')!['invalidFontSizeRange']).toEqual({ value: '2.6em', min: 0.5, max: 2.5, unit: 'em' })
    })
  })

  describe('unit case-insensitivity', () => {
    it('should accept an upper-case unit (14PX)', () => {
      expect(validate('14PX')).toBeNull()
    })

    it('should accept a mixed-case unit (1.5REm)', () => {
      expect(validate('1.5REm')).toBeNull()
    })

    it('should accept a lower-case unit (2em)', () => {
      expect(validate('2em')).toBeNull()
    })

    it('should report the unit in lower case in the error', () => {
      expect(validate('99PX')!['invalidFontSizeRange']).toEqual({ value: '99PX', min: 8, max: 40, unit: 'px' })
    })
  })

  describe('input coercion and trimming', () => {
    it('should flag a bare number, since it has no unit', () => {
      expect(validate(14)!['invalidFontSize']).toEqual({ value: 14 })
    })

    it('should trim surrounding whitespace before validating', () => {
      expect(validate('  14px  ')).toBeNull()
    })

    it('should preserve the original value in the error', () => {
      expect(validate('  99px  ')!['invalidFontSizeRange']).toEqual({ value: '  99px  ', min: 8, max: 40, unit: 'px' })
    })
  })
})
