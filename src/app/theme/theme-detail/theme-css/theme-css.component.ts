import { ChangeDetectionStrategy, Component, OnChanges, Signal, SimpleChanges, input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { map, startWith } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'
import { ChangeMode } from '../theme-detail.component'

// a single top-level entry of the customCssVariables JSON: context (key) and content (value)
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

@Component({
  selector: 'app-theme-css',
  standalone: true,
  imports: [
    ButtonModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TextareaModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-css.component.html',
  styleUrl: './theme-css.component.scss'
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
                  Object.fromEntries(entries.map((entry) => [entry.context.trim(), entry.content])),
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
      content: new FormControl<string>(entry?.content ?? '')
    })
  }

  private fillForm(theme: Theme): void {
    this.cssForm.clear()
    for (const entry of this.parseCustomCssVariables(theme.customCssVariables)) {
      this.cssForm.push(this.newEntryGroup(entry))
    }
  }

  // parse the JSON string of customCssVariables into a list of { context, content } pairs
  private parseCustomCssVariables(json: string | undefined): CustomCssVariableEntry[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([context, value]) => ({
          context,
          content: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }))
      }
    } catch (err) {
      console.error('parseCustomCssVariables', err)
    }
    return []
  }
}
