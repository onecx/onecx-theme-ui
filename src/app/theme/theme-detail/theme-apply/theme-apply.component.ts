import { Component, EventEmitter, Input, Output } from '@angular/core'
import { firstValueFrom, map, Observable } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { ConfirmationService } from 'primeng/api'
import { Dropdown } from 'primeng/dropdown'

import { Theme } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'

@Component({
  selector: 'app-theme-apply',
  templateUrl: './theme-apply.component.html',
  styleUrls: ['./theme-apply.component.scss'],
  providers: [ConfirmationService]
})
export class ThemeApplyComponent {
  @Input() theme: Theme | undefined
  @Input() themes$: Observable<Theme[]> | undefined
  @Input() changeMode: 'VIEW' | 'EDIT' | 'CREATE' = 'VIEW'
  @Input() isCurrentTheme = true
  @Input() autoApply = true
  @Output() autoApplyChange = new EventEmitter<boolean>() // inform theme detail about change in auto apply to trigger message about it
  @Output() templatingThemeData = new EventEmitter<Theme>() // the data of the theme to be used as template, emitted when user confirms to use a theme as template

  constructor(
    private readonly confirmation: ConfirmationService,
    private readonly translate: TranslateService
  ) {}

  /***************************************************************************
   * TEMPLATING WITH EXISTING THEME
   */
  public onSelectThemeTemplate(ev: any, themes: Theme[], box: Dropdown): void {
    const theme = themes.find((t) => t.name === ev.value)
    if (theme?.id && theme?.displayName) this.confirmUseThemeTemplate(theme.id, theme.displayName, box)
  }

  private confirmUseThemeTemplate(id: string, dn: string, box: Dropdown) {
    firstValueFrom(
      this.translate
        .get([
          'ACTIONS.COPY_OF',
          'THEME.TEMPLATE.CONFIRMATION.HEADER',
          'THEME.TEMPLATE.CONFIRMATION.MESSAGE',
          'ACTIONS.CONFIRMATION.YES',
          'ACTIONS.CONFIRMATION.NO'
        ])
        .pipe(map((data) => this.displayConfirmationForUsingTemplate(id, dn, data, box)))
    )
  }
  private displayConfirmationForUsingTemplate(themeId: string, themeName: string, data: any, box: Dropdown): void {
    this.confirmation.confirm({
      key: 'template',
      icon: 'pi pi-question-circle',
      defaultFocus: 'reject',
      dismissableMask: true,
      closeOnEscape: true,
      header: data['THEME.TEMPLATE.CONFIRMATION.HEADER'],
      message: data['THEME.TEMPLATE.CONFIRMATION.MESSAGE'].replace('{{ITEM}}', Utils.limitText(themeName, 50)),
      acceptLabel: data['ACTIONS.CONFIRMATION.YES'],
      rejectLabel: data['ACTIONS.CONFIRMATION.NO'],

      accept: () => {
        box.clear()
        this.templatingThemeData.emit({ id: themeId, ...data })
      },
      reject: () => box.clear()
    })
  }
}
