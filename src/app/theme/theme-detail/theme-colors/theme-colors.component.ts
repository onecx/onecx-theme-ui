import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormBuilder,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { combineLatest, debounceTime, map, startWith } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { ColorSketchModule } from 'ngx-color/sketch'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { PopoverModule } from 'primeng/popover'
import { PanelModule } from 'primeng/panel'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme } from 'src/app/shared/generated'
import { themeVariables } from '../theme-variables'
import { ChangeMode } from '../theme-detail.component'

/**
 * Validates whether the entered value is a valid hex code or a CSS color name.
 */
export function colorValueValidator(): ValidatorFn {
  // Regex for valid Hex color codes: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  const hexRegex = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value
    if (!value) return null
    const trimmedValue = String(value).trim()
    if (hexRegex.test(trimmedValue)) return null // hex?

    // Is it a valid CSS color name?
    // Use the native CSS.supports API of the browser
    if (typeof CSS !== 'undefined' && CSS.supports?.('color', trimmedValue)) {
      return null
    }
    return { invalidColor: { value: control.value } }
  }
}

@Component({
  selector: 'app-theme-colors',
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    ColorSketchModule,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MessageModule,
    PanelModule,
    PopoverModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-colors.component.html',
  styleUrl: './theme-colors.component.scss'
})
export class ThemeColorsComponent {
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)
  private readonly msgService = inject(PortalMessageService)
  private readonly destroyRef = inject(DestroyRef)
  // signals
  public readonly theme = input<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  public readonly autoApply = input.required<boolean>()
  // Inline CSS variable values captured before the first auto-apply mutation, so they can be
  // restored when the editing session ends (avoids leaking edited theme colors into the rest of the SPA).
  // `undefined` until the first mutation; font variables are excluded on purpose (auto-apply never writes them).
  private styleBaseline: Record<string, string> | undefined
  // Form
  public themeVars = themeVariables // used to initialize the form fields
  public generalForm: FormGroup = new FormGroup({})
  public topbarForm: FormGroup = new FormGroup({})
  public sidebarForm: FormGroup = new FormGroup({})
  public colorsForm: FormGroup = this.fb.group({
    general: this.generalForm,
    topbar: this.topbarForm,
    sidebar: this.sidebarForm
  })
  public groups: {
    titleKey: string
    formGroup: FormGroup
    key: keyof typeof themeVariables
  }[] = [
    { key: 'general', titleKey: 'THEME.COLORS.GENERAL', formGroup: this.generalForm },
    { key: 'topbar', titleKey: 'THEME.COLORS.TOPBAR', formGroup: this.topbarForm },
    { key: 'sidebar', titleKey: 'THEME.COLORS.SIDEBAR', formGroup: this.sidebarForm }
  ]
  // signals for form validation
  public isGeneralFormValid = toSignal(
    this.generalForm.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.generalForm.valid) // initial state on component init
    ),
    { requireSync: true }
  )
  public isTopbarFormValid = toSignal(
    this.topbarForm.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.topbarForm.valid) // initial state on component init
    ),
    { requireSync: true }
  )
  public isSidebarFormValid = toSignal(
    this.sidebarForm.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.sidebarForm.valid) // initial state on component init
    ),
    { requireSync: true }
  )
  public isThemeFormValid = computed(() => {
    return this.isGeneralFormValid() && this.isTopbarFormValid() && this.isSidebarFormValid()
  })
  // Combine the form values to a Theme
  public combinedFormValues = toSignal<Theme>(
    combineLatest([
      this.generalForm.valueChanges.pipe(startWith(this.generalForm.value)),
      this.topbarForm.valueChanges.pipe(startWith(this.topbarForm.value)),
      this.sidebarForm.valueChanges.pipe(startWith(this.sidebarForm.value))
    ]).pipe(
      map(([generalValue, topbarValue, sidebarValue]) => {
        return {
          properties: { general: generalValue, topbar: topbarValue, sidebar: sidebarValue }
        } as Theme
      })
    ),
    { requireSync: true }
  )

  constructor() {
    this.initColorForms()
    effect(() => {
      const currentTheme = this.theme()
      const mode = this.changeMode()

      this.colorsForm.disable()
      if (currentTheme) {
        this.fillForm(currentTheme)
        if (mode !== 'VIEW') {
          this.colorsForm.enable()
        }
      } else {
        this.colorsForm.reset()
      }
    })
    // restore the pre-edit CSS variable values when the component is destroyed
    this.destroyRef.onDestroy(() => this.restoreBaseline())
  }

  private initColorForms() {
    // all color variables are optional...for the moment
    for (const v of themeVariables.general) {
      this.generalForm.addControl(v, new FormControl<string | null>(null, [colorValueValidator()]))
    }
    for (const v of themeVariables.topbar) {
      this.topbarForm.addControl(v, new FormControl<string | null>(null, [colorValueValidator()]))
    }
    for (const v of themeVariables.sidebar) {
      this.sidebarForm.addControl(v, new FormControl<string | null>(null, [colorValueValidator()]))
    }
    // Change detection: When a form value changes and autoApply is true, update the CSS variable
    this.colorsForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((allFormValues) => {
        if (!this.autoApply()) return
        const values = allFormValues as Record<string, Record<string, string | null>>
        for (const groupValues of Object.values(values)) {
          for (const [variableName, formVal] of Object.entries(groupValues)) {
            this.updateCssVar(variableName, formVal)
          }
        }
      })
  }

  private fillForm(theme: Theme): void {
    this.colorsForm.reset()
    this.colorsForm.disable()
    if (theme.properties) this.colorsForm.patchValue(theme.properties)
  }

  public onChangeColorValue(key: string, name: string, val: string): void {
    if (this.changeMode() === 'VIEW') return
    this.groups
      .find((g) => g.key === key)
      ?.formGroup.get(name)
      ?.setValue(val)
    if (this.autoApply()) {
      this.updateCssVar(name, val)
    }
  }

  // Applying Styles
  private updateCssVar(varName: string, value: string | null): void {
    if (!this.styleBaseline) this.captureBaseline() // capture before the first mutation
    const cssValue = (value ?? '').trim()
    document.documentElement.style.setProperty(`--${varName}`, cssValue)
    // always keep the -rgb variant consistent with the color variable: update it or clear it
    const rgb = this.colorToRgb(cssValue)
    document.documentElement.style.setProperty(`--${varName}-rgb`, rgb ? `${rgb.r},${rgb.g},${rgb.b}` : '')
  }

  // Resolve any valid CSS color (hex forms, rgb()/hsl(), color names, …) to its rgb components
  // by letting the browser normalize it. Returns null for empty or unparseable values.
  private colorToRgb(color: string): { r: number; g: number; b: number } | null {
    if (!color) return null
    const probe = document.createElement('span')
    probe.style.color = color
    if (!probe.style.color) return null // invalid value rejected by the browser
    document.body.appendChild(probe)
    try {
      // computed style is normalized by the browser to rgb(r, g, b) / rgba(r, g, b, a)
      const computed = getComputedStyle(probe).color
      const m = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/.exec(computed)
      return m ? { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) } : null
    } finally {
      probe.remove()
    }
  }

  // Color variables that auto-apply can mutate (general/topbar/sidebar). Font vars are untouched.
  private cssVarNames(): string[] {
    return [...themeVariables.general, ...themeVariables.topbar, ...themeVariables.sidebar]
  }

  // Snapshot the current inline values of all color variables (and their -rgb variants) so they
  // can be restored when the editing session ends. `''` means "not set inline".
  private captureBaseline(): void {
    const style = document.documentElement.style
    const baseline: Record<string, string> = {}
    for (const name of this.cssVarNames()) {
      baseline[`--${name}`] = style.getPropertyValue(`--${name}`)
      baseline[`--${name}-rgb`] = style.getPropertyValue(`--${name}-rgb`)
    }
    this.styleBaseline = baseline
  }

  // Restore the pre-edit CSS variable values. Setting an empty string clears the inline override,
  // reverting to the stylesheet value. No-op if no mutation ever happened (baseline not captured).
  private restoreBaseline(): void {
    if (!this.styleBaseline) return
    const style = document.documentElement.style
    for (const [prop, value] of Object.entries(this.styleBaseline)) {
      style.setProperty(prop, value)
    }
    this.styleBaseline = undefined
  }
}
