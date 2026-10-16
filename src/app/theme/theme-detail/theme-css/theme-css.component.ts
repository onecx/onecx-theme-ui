import { ChangeDetectionStrategy, Component, OnChanges, Signal, SimpleChanges, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { map, startWith } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'
import { CssContextComponent } from './css-context/css-context.component'
import { ChangeMode } from '../theme-detail.component'

// a single top-level entry of the customCssVariables JSON: context (key) and content, a JSON object serialized as formatted text
export type CustomCssVariableEntry = { context: string; content: string }

// the array is invalid if two or more entries share the same (trimmed) context, since that would
// silently collapse to a single JSON property on save
function duplicateContextValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const contexts = (control as FormArray<FormGroup>).controls
      .map((group) => (group.get('context')?.value ?? '').trim())
      .filter((context) => context.length > 0)
    return new Set(contexts).size !== contexts.length ? { duplicateContext: true } : null
  }
}

// the content must parse back into a JSON object (not a primitive, array or invalid JSON), since the
// context's value in customCssVariables is always an object
function jsonObjectValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let value: string = ''
    if (control.value === null || control.value === undefined) return null
    value = String(control.value).trim()
    if (!value) return null // let Validators.required report an empty value
    return isJsonObject(value) ? null : { invalidJson: true }
  }
}

function isJsonObject(value: string): boolean {
  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
}

@Component({
  selector: 'app-theme-css',
  standalone: true,
  imports: [ButtonModule, CssContextComponent, MessageModule, TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-css.component.html'
})
export class ThemeCssComponent implements OnChanges {
  public readonly theme = input<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()

  // data: one form group per top-level property of the parsed customCssVariables JSON
  public cssForm = new FormArray<FormGroup>([], [duplicateContextValidator()])

  // signal for validation, read by the parent to decide whether the theme can be saved
  public readonly isThemeFormValid: Signal<boolean> = toSignal(
    this.cssForm.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.cssForm.valid)
    ),
    { requireSync: true }
  )

  // combine the array entries back into the customCssVariables JSON string, read by the parent on save
  public readonly combinedFormValues: Signal<Theme> = toSignal(
    this.cssForm.valueChanges.pipe(
      startWith(this.cssForm.value),
      map(
        (entries: CustomCssVariableEntry[]) =>
          ({
            customCssVariables: entries.length
              ? JSON.stringify(
                  Object.fromEntries(entries.map((entry) => [entry.context.trim(), this.parseContent(entry.content)])),
                  null,
                  2
                )
              : undefined
          }) as Theme
      )
    ),
    { requireSync: true }
  )

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.theme() !== undefined) {
      if (changes['theme']) this.fillForm(this.theme()!)
    } else {
      this.cssForm.clear()
    }
    // (re-)apply the enabled/disabled state after the form entries have been (re-)built
    if (this.theme() !== undefined && this.changeMode() !== 'VIEW') {
      this.cssForm.enable()
    } else {
      this.cssForm.disable()
    }
  }

  public get entries(): FormGroup[] {
    return this.cssForm.controls
  }

  public onAddEntry(): void {
    if (this.changeMode() === 'VIEW') return
    this.cssForm.push(this.newEntryGroup())
  }

  public onRemoveEntry(index: number): void {
    if (this.changeMode() === 'VIEW') return
    this.cssForm.removeAt(index)
  }

  private newEntryGroup(entry?: CustomCssVariableEntry): FormGroup {
    return new FormGroup({
      context: new FormControl<string>(entry?.context ?? '', Validators.required),
      content: new FormControl<string>(entry?.content ?? '{}', [Validators.required, jsonObjectValidator()])
    })
  }

  // parse an entry's content text back into a JSON object; falls back to an empty object while the
  // text is (temporarily) invalid, saving is blocked separately via isThemeFormValid
  private parseContent(content: string): object {
    try {
      const parsed = JSON.parse(content)
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  private fillForm(theme: Theme): void {
    this.cssForm.clear()
    for (const entry of this.parseCustomCssVariables(theme.customCssVariables)) {
      this.cssForm.push(this.newEntryGroup(entry))
    }
  }

  // parse the JSON string of customCssVariables into a list of { context, content } pairs; content is
  // always serialized back to text so the textarea shows a formatted JSON object
  private parseCustomCssVariables(json: string | undefined): CustomCssVariableEntry[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([context, value]) => ({
          context,
          content: JSON.stringify(value, null, 2)
        }))
      }
    } catch (err) {
      console.error('parseCustomCssVariables', err)
    }
    return []
  }
}
