import { Component, effect, input, model } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { LoadingState } from '../theme-detail/theme-detail.component'

@Component({
  selector: 'app-theme-delete',
  standalone: true,
  imports: [ButtonModule, DialogModule, MessageModule, TranslateModule, TooltipModule],
  templateUrl: './theme-delete.component.html'
})
export class ThemeDeleteComponent {
  // signals
  public visible = model.required<boolean>()
  public deleted = model.required<boolean>()
  public themeUsed = input.required<boolean>()
  public useLoadingState = input.required<LoadingState>()
  // data
  public themeToBeDeleted = input<Theme | undefined>()
  public theme: Theme | undefined
  //public themea : Signal<Theme | undefined>

  constructor(
    private readonly themeApi: ThemesAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {
    this.deleted.set(false)
    effect(() => {
      if (this.theme !== this.themeToBeDeleted()) {
        this.theme = this.themeToBeDeleted()
      }
    })
    /*
    this.themea = computed(() => {
      if (this.themea() !== this.themeToBeDeleted()) return this.themeToBeDeleted()
      else return undefined
    })
      */
  }

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme | undefined): void {
    if (theme?.id)
      this.themeApi.deleteTheme({ id: theme.id }).subscribe({
        next: () => {
          this.deleted.set(true)
          this.visible.set(false)
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
        },
        error: (err) => {
          console.error('deleteTheme', err)
          this.msgService.error({ summaryKey: 'ACTIONS.DELETE.THEME_NOK', detailKey: err.error.message })
        }
      })
  }
}
