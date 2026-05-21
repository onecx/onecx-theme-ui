import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { themeVariables } from '../theme-detail/theme-variables'

@Component({
  selector: 'app-theme-create',
  templateUrl: './theme-create.component.html',
  styleUrls: ['./theme-create.component.scss']
})
export class ThemeCreateComponent implements OnChanges {
  @Input() visible = false
  @Input() themeToBeCreated: Theme | undefined
  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() themeCreated = new EventEmitter<Theme>()

  public formGroup: FormGroup

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly themesApi: ThemesAPIService,
    private readonly message: PortalMessageService,
    private readonly translate: TranslateService
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  public ngOnChanges(): void {
    this.formGroup.reset()
    if (this.themeToBeCreated) {
      this.formGroup.patchValue(this.themeToBeCreated)
    }
  }

  public closeDialog(): void {
    this.formGroup.reset()
    this.visibleChange.emit(false)
  }

  public saveTheme(): void {
    // prepare theme properties with current values from document
    const currentVars: { [key: string]: { [key: string]: string } } = {}
    for (const tv of Object.entries(themeVariables)) {
      currentVars[tv[0]] = {}
      for (const v of tv[1])
        currentVars[tv[0]][v] = getComputedStyle(document.documentElement).getPropertyValue(`--${v}`)
    }
    const newTheme: Theme = {
      ...this.themeToBeCreated,
      ...this.formGroup.value,
      properties: this.themeToBeCreated?.properties ?? currentVars
    }
    // create
    this.themesApi
      .createTheme({
        createThemeRequest: { resource: newTheme }
      })
      .pipe()
      .subscribe({
        next: (response) => {
          this.message.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
          this.themeCreated.emit(response.resource as Theme)
        },
        error: (err) => {
          this.message.error({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
          console.error('createTheme', err)
        }
      })
  }
}
