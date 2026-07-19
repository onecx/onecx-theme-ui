import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, model, output } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
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

type HttpParameter = { key: string; value: string }
type HttpError = {
  error: { detail: string; errorCode: string; params: HttpParameter[]; invalidParams: HttpParameter[] }
  detailKey?: string
}
type ErrorMessage = { summaryKey: string; detailKey?: string }

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-create.component.html',
  styleUrl: './theme-create.component.scss'
})
export class ThemeCreateComponent {
  private readonly destroyRef = inject(DestroyRef)
  private readonly themesApi = inject(ThemesAPIService)
  private readonly message = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)
  // signals
  public visible = model.required<boolean>()
  public created = output<Theme | undefined>()
  public themeToBeCreated = model.required<Theme | undefined>()
  public readonly themes = input<Theme[] | undefined>(undefined)
  // data
  public formGroup = new FormGroup({
    name: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]),
    displayName: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]),
    description: new FormControl<string | null>(null, [Validators.maxLength(255)])
  })

  constructor() {
    effect(() => {
      this.formGroup.reset()
      const theme = this.themeToBeCreated()
      if (theme) {
        this.formGroup.patchValue(theme)
      }
    })
  }

  public closeDialog(): void {
    this.formGroup.reset()
    this.visible.set(false)
  }

  public onSaveTheme(): void {
    if (
      this.checkThemeNameExistance(this.formGroup.value.name) ||
      this.checkThemeDisplayNameExistance(this.formGroup.value.displayName)
    ) {
      this.message.error({
        summaryKey: 'VALIDATION.ERRORS.PERSIST_ENTITY_FAILED'
      })
      return
    }
    // prepare theme properties with current values from document
    const currentVars: { [key: string]: { [key: string]: string } } = {}
    for (const tv of Object.entries(themeVariables)) {
      currentVars[tv[0]] = {}
      for (const v of tv[1])
        currentVars[tv[0]][v] = getComputedStyle(document.documentElement).getPropertyValue(`--${v}`)
    }
    if (this.formGroup.value.name && this.formGroup.value.displayName) {
      const newTheme: Theme = {
        name: this.formGroup.value.name,
        displayName: this.formGroup.value.displayName,
        description: this.formGroup.value.description ?? undefined,
        properties: this.themeToBeCreated()?.properties ?? currentVars
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
            this.created.emit(response.resource as Theme)
            this.visible.set(false)
          },
          error: (err: HttpError) => {
            this.createErrorMessage(err)
            console.error('createTheme', err)
          }
        })
    }
  }

  private createErrorMessage(err: HttpError) {
    let errMsg: ErrorMessage = { summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' }
    if (err?.error?.errorCode)
      errMsg = {
        ...errMsg,
        detailKey:
          err?.error?.errorCode === 'PERSIST_ENTITY_FAILED'
            ? 'VALIDATION.ERRORS.PERSIST_ENTITY_FAILED'
            : err.error.errorCode
      }
    this.message.error(errMsg)
  }

  private checkThemeNameExistance(name?: string | null): boolean {
    if (!this.themes() || !name) return false
    const exists = this.themes()!.some((t) => t.name === name)
    if (exists) this.formGroup.get('name')?.setErrors({ alreadyExists: true })
    return exists
  }
  private checkThemeDisplayNameExistance(name?: string | null): boolean {
    if (!this.themes() || !name) return false
    const exists = this.themes()!.some((t) => t.displayName === name)
    if (exists) this.formGroup.get('displayName')?.setErrors({ alreadyExists: true })
    return exists
  }
}
