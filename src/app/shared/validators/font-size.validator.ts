import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

export function fontSizeValidator(): ValidatorFn {
  const fontSizeRegex = /^((?:\d+|\d*\.\d+))(px|em|rem)$/i

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value
    if (!value) return null

    const trimmedValue = String(value).trim()
    const match = fontSizeRegex.exec(trimmedValue)

    if (!match) {
      return { invalidFontSize: { value: control.value } }
    }

    const numValue = Number.parseFloat(match[1])
    const unit = match[2].toLowerCase()

    if (unit === 'px') {
      if (numValue < 8 || numValue > 40) {
        return { invalidFontSizeRange: { value: control.value, min: 8, max: 40, unit: unit } }
      }
    } else if (unit === 'rem' || unit === 'em') {
      if (numValue < 0.5 || numValue > 2.5) {
        return { invalidFontSizeRange: { value: control.value, min: 0.5, max: 2.5, unit: unit } }
      }
    }

    return null
  }
}
