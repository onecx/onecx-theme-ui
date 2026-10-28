import { ChangeDetectionStrategy, Component, effect, input, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { map, startWith, combineLatest } from 'rxjs'

import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { DictionaryObject } from 'src/app/shared/models/theme.model'
import { Utils } from 'src/app/shared/utils'
import { OverrideType, Theme, ThemeOverride } from 'src/app/shared/generated'
import { fontSizeValidator } from 'src/app/shared/validators/font-size.validator'
import { themeVariables } from '../theme-variables'
import { ChangeMode } from '../theme-detail.component'

@Component({
  selector: 'app-theme-extra',
  standalone: true,
  imports: [
    FloatLabelModule,
    FormsModule,
    InputTextModule,
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
  public overrideForm: FormGroup = new FormGroup({})
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
          ([fontValue, cssValue, overrideValue]) =>
            ({
              properties: {
                font: fontValue
              },
              customCssVariables: cssValue.customCssVariables,
              overrides: this.toOverrides(overrideValue)
            }) as Theme
        )
      ),
      { requireSync: true }
    )

    effect(() => {
      const currentTheme = this.theme()
      const mode = this.changeMode()

      this.fontForm.disable()
      this.cssForm.disable()
      this.overrideForm.disable()
      if (currentTheme) {
        this.fillForm(currentTheme)
        if (mode !== 'VIEW') {
          this.fontForm.enable()
          this.cssForm.enable()
          this.overrideForm.enable()
        }
      } else {
        this.fontForm.reset()
        this.cssForm.reset()
        this.overrideForm.reset()
      }
    })
  }

  private initForms() {
    for (const v of themeVariables.font) {
      const validators = [Validators.maxLength(255)]
      if (v === 'font-size') validators.push(fontSizeValidator())

      const fc = new FormControl<string | null>(null, validators)
      this.fontForm.addControl(v, fc)
    }
    this.cssForm.addControl('customCssVariables', new FormControl<string | null>(null, [Validators.maxLength(65535)]))
    this.overrideForm.addControl('primengOverride', new FormControl<string | null>(null, [Validators.maxLength(65535)]))
    this.overrideForm.addControl('cssOverride', new FormControl<string | null>(null, [Validators.maxLength(65535)]))
  }

  // only non-empty values are sent as overrides
  private toOverrides(value: { primengOverride?: string | null; cssOverride?: string | null }): ThemeOverride[] {
    const overrides: ThemeOverride[] = []
    if (value.primengOverride?.trim()) overrides.push({ type: OverrideType.Primeng, value: value.primengOverride })
    if (value.cssOverride?.trim()) overrides.push({ type: OverrideType.Css, value: value.cssOverride })
    return overrides
  }

  private fillForm(theme: Theme): void {
    this.fontForm.reset()
    if (theme.properties) {
      const font = Utils.getThemePropertyValue<DictionaryObject>(theme.properties, 'font')
      if (font) this.fontForm.patchValue(font)
    }
    this.cssForm.reset()
    this.cssForm.get('customCssVariables')?.setValue(theme.customCssVariables)
    this.overrideForm.reset()
    this.overrideForm.patchValue({
      primengOverride: theme.overrides?.find((o) => o.type === OverrideType.Primeng)?.value ?? null,
      cssOverride: theme.overrides?.find((o) => o.type === OverrideType.Css)?.value ?? null
    })
  }
}
