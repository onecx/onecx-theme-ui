import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

export function jsonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value
    if (!value || !String(value).trim()) return null

    try {
      JSON.parse(String(value))
      return null
    } catch {
      return { invalidJson: { value: control.value } }
    }
  }
}
