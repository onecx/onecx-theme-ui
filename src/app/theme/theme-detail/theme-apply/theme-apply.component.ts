import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { Select, SelectModule } from 'primeng/select'
import { ButtonModule } from 'primeng/button'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { DialogModule } from 'primeng/dialog'
import { MessageModule } from 'primeng/message'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'
import { ConfirmationService } from 'primeng/api'
import { Dropdown } from 'primeng/dropdown'

import { firstValueFrom, map, Observable } from 'rxjs'

import { Theme } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { ChangeMode } from '../theme-detail.component'

@Component({
  selector: 'app-theme-apply',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    TranslateModule,
    TooltipModule,
    ToastModule
  ],
  templateUrl: './theme-apply.component.html',
  styleUrls: ['./theme-apply.component.scss'],
  providers: [ConfirmationService]
})
export class ThemeApplyComponent {
  @Input() theme: Theme | undefined
  @Input() themes$: Observable<Theme[]> | undefined
  @Input() changeMode: ChangeMode = 'VIEW'
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
  public onSelectThemeTemplate(ev: any, themes: Theme[], box: Select): void {
    const theme = themes.find((t) => t.name === ev.value)
    if (theme?.id && theme?.displayName) this.confirmUseThemeTemplate(theme.id, theme.displayName, box)
  }

  private confirmUseThemeTemplate(id: string, dn: string, box: Select): void {
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
  private displayConfirmationForUsingTemplate(themeId: string, themeName: string, data: any, box: Select): void {
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
