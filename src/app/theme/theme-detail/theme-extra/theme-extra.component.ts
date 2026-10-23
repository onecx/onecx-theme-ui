import { ChangeDetectionStrategy, Component, effect, input, Signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { map, startWith } from 'rxjs'

import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { DictionaryObject } from 'src/app/shared/models/theme.model'
import { Utils } from 'src/app/shared/utils'
import { Theme } from 'src/app/shared/generated'
import { fontSizeValidator } from 'src/app/shared/validators/font-size.validator'
import { themeVariables } from '../theme-variables'
import { ChangeMode } from '../theme-detail.component'

@Component({
  selector: 'app-theme-extra',
  standalone: true,
  imports: [FloatLabelModule, FormsModule, InputTextModule, ReactiveFormsModule, TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-extra.component.html',
  styleUrl: './theme-extra.component.scss'
})
export class ThemeExtraComponent {
  // signals
  public readonly theme = input<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  // data
  public fontForm: FormGroup = new FormGroup({})
  // signals for form validation and combined values, initialized in constructor
  public readonly isThemeFormValid!: Signal<boolean>
  public readonly combinedFormValues!: Signal<Theme>

  constructor() {
    this.initForms()
    this.isThemeFormValid = toSignal(
      this.fontForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.fontForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    this.combinedFormValues = toSignal<Theme>(
      this.fontForm.valueChanges.pipe(
        startWith(this.fontForm.value),
        map((fontValue) => ({ properties: { font: fontValue } }) as Theme)
      ),
      { requireSync: true }
    )
    effect(() => {
      const currentTheme = this.theme()
      const mode = this.changeMode()

      this.fontForm.disable()
      if (currentTheme) {
        this.fillForm(currentTheme)
        if (mode !== 'VIEW') {
          this.fontForm.enable()
        }
      } else {
        this.fontForm.reset()
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
  }

  private fillForm(theme: Theme): void {
    this.fontForm.reset()
    if (theme.properties) {
      const font = Utils.getThemePropertyValue<DictionaryObject>(theme.properties, 'font')
      if (font) this.fontForm.patchValue(font)
    }
  }
}
