import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-delete',
  templateUrl: './theme-delete.component.html',
  styleUrls: ['./theme-delete.component.scss']
})
export class ThemeDeleteComponent {
  @Input() theme: Theme | undefined
  @Input() isUsedByWorkspace = false
  @Input() visible = false
  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() themeDeleted: EventEmitter<void> = new EventEmitter<void>()

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly themeApi: ThemesAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {}

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme | undefined): void {
    if (theme?.id)
      this.themeApi.deleteTheme({ id: theme.id }).subscribe({
        next: () => {
          this.themeDeleted.emit()
          this.visibleChange.emit(false)
          this.router.navigate(['..'], { relativeTo: this.route })
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
        },
        error: (err) => {
          console.error('deleteTheme', err)
          this.msgService.error({ summaryKey: 'ACTIONS.DELETE.THEME_NOK', detailKey: err.error.message })
        }
      })
  }
}
