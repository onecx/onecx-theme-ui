import { ChangeDetectionStrategy, Component, computed, effect, input, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { map, startWith, combineLatest } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { DictionaryObject } from 'src/app/shared/models/theme.model'
import { Utils } from 'src/app/shared/utils'
import { OverrideType, Theme, ThemeOverride } from 'src/app/shared/generated'
import { fontSizeValidator } from 'src/app/shared/validators/font-size.validator'
import { themeVariables } from '../theme-variables'
import { ChangeMode } from '../theme-detail.component'

export type OverrideRowForm = FormGroup<{
  type: FormControl<OverrideType | null>
  alias: FormControl<string | null>
  value: FormControl<string | null>
}>

@Component({
  selector: 'app-theme-extra',
  standalone: true,
  imports: [
    ButtonModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-extra.component.html'
})
export class ThemeExtraComponent {
  // signals
  public readonly theme = input<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  // data
  public fontForm: FormGroup = new FormGroup({})
  public cssForm: FormGroup = new FormGroup({})
  public overrideForm = new FormGroup({ items: new FormArray<OverrideRowForm>([]) })
  public readonly overrideTypeOptions = [
    { value: OverrideType.Primeng, labelKey: 'THEME.PRIMENG_OVERRIDE' },
    { value: OverrideType.Css, labelKey: 'THEME.CSS_OVERRIDE' }
  ]
  public readonly isEditMode = computed(() => this.changeMode() !== 'VIEW')
  // signals for form validation and combined values, initialized in constructor
  public readonly isThemeFormValid!: Signal<boolean>
  public readonly combinedFormValues!: Signal<Theme>

  constructor() {
    this.initForms()
    this.isThemeFormValid = toSignal(
      combineLatest([
        this.fontForm.statusChanges.pipe(startWith(this.fontForm.status)),
        this.overrideForm.statusChanges.pipe(startWith(this.overrideForm.status))
      ]).pipe(map(([fontStatus, overrideStatus]) => fontStatus === 'VALID' && overrideStatus === 'VALID')),
      { requireSync: true }
    )
    // signal to consumer: values
    this.combinedFormValues = toSignal<Theme>(
      combineLatest([
        this.fontForm.valueChanges.pipe(startWith(this.fontForm.value)),
        this.cssForm.valueChanges.pipe(startWith(this.cssForm.value)),
        this.overrideForm.valueChanges.pipe(startWith(this.overrideForm.value))
      ]).pipe(
        map(
          ([fontValue, cssValue]) =>
            ({
              properties: {
                font: fontValue
              },
              customCssVariables: cssValue.customCssVariables,
              overrides: this.toOverrides(this.overrideRows.value)
            }) as Theme
        )
      ),
      { requireSync: true }
    )

    effect(() => {
      const currentTheme = this.theme()
      const mode = this.changeMode()

      if (currentTheme) {
        this.fillForm(currentTheme)
      } else {
        this.fontForm.reset()
        this.cssForm.reset()
        this.overrideRows.clear()
      }
      // rows are rebuilt on every fill, so the enabled state is applied afterwards
      const editable = !!currentTheme && mode !== 'VIEW'
      for (const form of [this.fontForm, this.cssForm, this.overrideForm]) {
        if (editable) form.enable()
        else form.disable()
      }
    })
  }

  public get overrideRows(): FormArray<OverrideRowForm> {
    return this.overrideForm.controls.items
  }

  public addOverride(): void {
    this.overrideRows.push(this.createOverrideRow())
  }

  public removeOverride(index: number): void {
    this.overrideRows.removeAt(index)
  }

  public moveOverride(index: number, offset: -1 | 1): void {
    const target = index + offset
    if (target < 0 || target >= this.overrideRows.length) return
    const row = this.overrideRows.at(index)
    this.overrideRows.removeAt(index)
    this.overrideRows.insert(target, row)
  }

  private initForms() {
    for (const v of themeVariables.font) {
      const validators = [Validators.maxLength(255)]
      if (v === 'font-size') validators.push(fontSizeValidator())

      const fc = new FormControl<string | null>(null, validators)
      this.fontForm.addControl(v, fc)
    }
    this.cssForm.addControl('customCssVariables', new FormControl<string | null>(null, [Validators.maxLength(65535)]))
  }

  private createOverrideRow(override?: ThemeOverride): OverrideRowForm {
    return new FormGroup({
      type: new FormControl<OverrideType | null>(override?.type ?? OverrideType.Css, [Validators.required]),
      alias: new FormControl<string | null>(override?.alias ?? null, [Validators.maxLength(255)]),
      value: new FormControl<string | null>(override?.value ?? null, [Validators.maxLength(65535)])
    })
  }

  // the row index is the pos; rows without a type or a non-blank value are not sent
  private toOverrides(rows: Partial<{ type: OverrideType | null; alias: string | null; value: string | null }>[]) {
    return rows.flatMap((row, pos): ThemeOverride[] =>
      row.type && row.value?.trim()
        ? [{ type: row.type, ...(row.alias ? { alias: row.alias } : {}), pos, value: row.value }]
        : []
    )
  }

  private fillForm(theme: Theme): void {
    this.fontForm.reset()
    if (theme.properties) {
      const font = Utils.getThemePropertyValue<DictionaryObject>(theme.properties, 'font')
      if (font) this.fontForm.patchValue(font)
    }
    this.cssForm.reset()
    this.cssForm.get('customCssVariables')?.setValue(theme.customCssVariables)
    this.overrideRows.clear()
    const byPos = [...(theme.overrides ?? [])].sort(
      (a, b) => (a.pos ?? Number.MAX_SAFE_INTEGER) - (b.pos ?? Number.MAX_SAFE_INTEGER)
    )
    for (const override of byPos) this.overrideRows.push(this.createOverrideRow(override))
  }
}
