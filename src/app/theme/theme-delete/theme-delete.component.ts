import { Component, effect, Input, model } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-delete',
  standalone: true,
  imports: [ButtonModule, DialogModule, MessageModule, TranslateModule, TooltipModule],
  templateUrl: './theme-delete.component.html'
})
export class ThemeDeleteComponent {
  @Input() isUsedByWorkspace = false

  public visible = model.required<boolean>()
  public deleted = model.required<boolean>()
  public themeToBeDeleted = model<Theme | undefined>()
  public theme: Theme | undefined

  constructor(
    private readonly themeApi: ThemesAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {
    this.deleted.set(false)
    effect(() => {
      this.theme = this.themeToBeDeleted()
    })
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
