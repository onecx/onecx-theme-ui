import { Component, DestroyRef, EventEmitter, inject, Input, model, OnChanges, Output } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { TextareaModule } from 'primeng/textarea'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { themeVariables } from '../theme-detail/theme-variables'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-theme-create',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    TextareaModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TranslateModule,
    TooltipModule,
    ToastModule
  ],
  templateUrl: './theme-create.component.html',
  styleUrls: ['./theme-create.component.scss']
})
export class ThemeCreateComponent implements OnChanges {
  @Input() themeToBeCreated: Theme | undefined
  @Output() themeCreated = new EventEmitter<Theme>()

  public visible = model.required<boolean>()

  private readonly destroyRef = inject(DestroyRef)
  public formGroup: FormGroup

  constructor(
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
    this.visible.set(false)
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.message.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
          this.themeCreated.emit(response.resource as Theme)
          this.visible.set(false)
        },
        error: (err) => {
          this.message.error({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
          console.error('createTheme', err)
        }
      })
  }
}
