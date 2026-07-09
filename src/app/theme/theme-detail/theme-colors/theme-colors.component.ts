import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  input,
  model,
  OnChanges,
  Signal,
  SimpleChanges
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
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
import { ToastModule } from 'primeng/toast'
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
    ToastModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-colors.component.html',
  styleUrls: ['./theme-colors.component.scss']
})
export class ThemeColorsComponent implements OnChanges {
  // signals
  public readonly theme = model.required<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  public readonly autoApply = input.required<boolean>()
  // signals for forms
  public isComponentValid!: Signal<boolean>
  public isGeneralFormValid!: Signal<boolean>
  public isTopbarFormValid!: Signal<boolean>
  public isSidebarFormValid!: Signal<boolean>
  public combinedFormValues!: Signal<Theme>
  // Form
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
  public themeVars = themeVariables // make it available in HTML

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly msgService: PortalMessageService,
    private readonly cd: ChangeDetectorRef
  ) {
    this.isGeneralFormValid = toSignal(
      this.generalForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.generalForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    this.isTopbarFormValid = toSignal(
      this.topbarForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.topbarForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    this.isSidebarFormValid = toSignal(
      this.sidebarForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.sidebarForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    this.isComponentValid = computed(() => {
      return this.isGeneralFormValid() && this.isTopbarFormValid() && this.isSidebarFormValid()
    })
    // Combine the form values to a Theme
    this.combinedFormValues = toSignal<Theme>(
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
    this.initColorForms()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.colorsForm.disable()
    if (this.theme()) {
      if (changes['theme']) this.fillForm(this.theme()!)
      if (this.changeMode() !== 'VIEW') {
        this.colorsForm.enable()
      }
    } else {
      this.colorsForm.reset()
    }
  }

  private initColorForms() {
    for (const v of themeVariables.general) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply()) this.updateCssVar(v, formVal)
      })
      this.generalForm.addControl(v, fc)
    }
    for (const v of themeVariables.topbar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply()) this.updateCssVar(v, formVal)
      })
      this.topbarForm.addControl(v, fc)
    }
    for (const v of themeVariables.sidebar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply()) this.updateCssVar(v, formVal)
      })
      this.sidebarForm.addControl(v, fc)
    }
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

  public onUpdateTheme(): boolean {
    if (!this.theme()) return false
    if (this.colorsForm.valid) {
      this.theme.set({ properties: this.colorsForm.value })
    } else {
      this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
      return false
    }
    return true
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
