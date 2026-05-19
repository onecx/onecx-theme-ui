import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core'
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme } from 'src/app/shared/generated'
import { themeVariables } from '../theme-variables'
import { debounceTime } from 'rxjs'

@Component({
  selector: 'app-theme-colors',
  templateUrl: './theme-colors.component.html',
  styleUrls: ['./theme-colors.component.scss']
})
export class ThemeColorsComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'
  @Input() autoApply = false

  public mandatory = false
  public operator = false

  // Form
  public formGroup = new FormGroup({})
  public generalForm: FormGroup
  public topbarForm: FormGroup
  public sidebarForm: FormGroup
  public colorsForm: FormGroup
  public groups: {
    title: string
    formGroup: FormGroup
    key: keyof typeof themeVariables
  }[]
  public themeVars = themeVariables // make it available in HTML

  constructor(
    private fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly msgService: PortalMessageService,
    private readonly cd: ChangeDetectorRef
  ) {
    this.topbarForm = new FormGroup({})
    this.generalForm = new FormGroup({})
    this.sidebarForm = new FormGroup({})
    this.groups = [
      { key: 'general', title: 'General Colors', formGroup: this.generalForm },
      { key: 'topbar', title: 'Topbar Colors', formGroup: this.topbarForm },
      { key: 'sidebar', title: 'Menu Colors', formGroup: this.sidebarForm }
    ]
    this.colorsForm = this.fb.group({
      topbar: this.topbarForm,
      general: this.generalForm,
      sidebar: this.sidebarForm
    })
    this.initForms()
  }

  public ngOnChanges(): void {
    if (this.theme) {
      this.fillForm(this.theme)
      this.mandatory = this.theme.mandatory ?? false
      this.operator = this.theme.operator ?? false
    }
  }

  public initForms() {
    for (const v of themeVariables.general) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.generalForm.addControl(v, fc)
    }
    for (const v of themeVariables.topbar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.topbarForm.addControl(v, fc)
    }
    for (const v of themeVariables.sidebar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.sidebarForm.addControl(v, fc)
    }
  }

  private fillForm(theme: Theme): void {
    this.colorsForm.reset()
    if (theme.properties) this.colorsForm.patchValue(theme.properties as { [key: string]: any })
  }

  public onSave(): void {
    if (this.theme && this.formGroup.valid) {
      this.theme.properties = this.colorsForm.value
    }
  }

  // Applying Styles
  private updateCssVar(varName: string, value: string): void {
    document.documentElement.style.setProperty(`--${varName}`, value)
    const rgb = this.hexToRgb(value)
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
