import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, FormBuilder } from '@angular/forms'
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
  public isComponentValid = computed(() => {
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
  }

  private initColorForms() {
    for (const v of themeVariables.general) {
      this.generalForm.addControl(v, new FormControl<string | null>(null))
    }
    for (const v of themeVariables.topbar) {
      this.topbarForm.addControl(v, new FormControl<string | null>(null))
    }
    for (const v of themeVariables.sidebar) {
      this.sidebarForm.addControl(v, new FormControl<string | null>(null))
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
    document.documentElement.style.setProperty(`--${varName}`, value || '')
    const rgb = this.hexToRgb(value || '')
    if (rgb) {
      document.documentElement.style.setProperty(`--${varName}-rgb`, `${rgb.r},${rgb.g},${rgb.b}`)
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16)
        }
      : null
  }
}
