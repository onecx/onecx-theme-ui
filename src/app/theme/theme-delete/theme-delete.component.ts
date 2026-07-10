import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core'
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-delete.component.html'
})
export class ThemeDeleteComponent {
  // signals
  public visible = model.required<boolean>()
  public useLoadingState = input.required<LoadingState>()
  public themeUsed = input.required<boolean>()
  public themeToBeDeleted = input<Theme | undefined>()
  public deleted = output<boolean>()
  // services
  private readonly themeApi = inject(ThemesAPIService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme | undefined): void {
    if (theme?.id)
      this.themeApi.deleteTheme({ id: theme.id }).subscribe({
        next: () => {
          this.deleted.emit(true)
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
