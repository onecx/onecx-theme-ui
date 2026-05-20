import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ThemesAPIService } from 'src/app/shared/generated'

export type Theme = {
  name: string
  displayName?: string
  logoUrl?: string
  faviconUrl?: string
}

@Component({
  selector: 'app-theme-create',
  templateUrl: './theme-create.component.html',
  styleUrls: ['./theme-create.component.scss']
})
export class ThemeCreateComponent {
  @Input() visible = false
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

  public closeDialog(): void {
    this.formGroup.reset()
    this.visibleChange.emit(false)
  }

  public saveTheme(): void {
    this.themesApi
      .createTheme({
        createThemeRequest: { resource: this.formGroup.value }
      })
      .pipe()
      .subscribe({
        next: (response) => {
          this.message.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
          this.closeDialog()
          this.themeCreated.emit(response.resource as Theme)
          this.router.navigate(['./' + response.resource?.name], { relativeTo: this.route })
        },
        error: (err) => {
          this.message.error({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
          console.error('createTheme', err)
        }
      })
  }
}
