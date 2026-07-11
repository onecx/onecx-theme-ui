import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { firstValueFrom, map, Observable } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { MessageModule } from 'primeng/message'
import { Select, SelectModule } from 'primeng/select'
import { ToastModule } from 'primeng/toast'
import { ToggleSwitchModule } from 'primeng/toggleswitch'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { ChangeMode } from '../theme-detail.component'

@Component({
  selector: 'app-theme-apply',
  standalone: true,
  imports: [
    AsyncPipe,
    ConfirmDialogModule,
    ConfirmPopupModule,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    MessageModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    TranslateModule,
    ToggleSwitchModule,
    TooltipModule,
    ToastModule
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-apply.component.html',
  styleUrl: './theme-apply.component.scss'
})
export class ThemeApplyComponent {
  // signals
  public readonly theme = input.required<Theme | undefined>()
  public readonly themes$ = input.required<Observable<Theme[]> | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  public readonly isCurrentTheme = input.required<boolean>()
  public readonly autoApply = input.required<boolean>()
  public readonly autoApplyChange = output<boolean>() // inform theme detail about change in auto apply to trigger message about it
  public readonly templatingThemeData = output<Theme>() // the data of the theme to be used as template, emitted when user confirms to use a theme as template

  private readonly confirmation = inject(ConfirmationService)
  private readonly translate = inject(TranslateService)

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
          'ACTIONS.CONFIRMATION.YES',
          'ACTIONS.CONFIRMATION.NO',
          'THEME.TEMPLATE.CONFIRMATION.HEADER',
          'THEME.TEMPLATE.CONFIRMATION.MESSAGE'
        ])
        .pipe(map((data) => this.displayConfirmationForUsingTemplate(id, dn, data, box)))
    )
  }
  private displayConfirmationForUsingTemplate(themeId: string, themeName: string, data: any, box: Select): void {
    this.confirmation.confirm({
      key: 'template',
      icon: 'pi pi-question-circle danger-action-text',
      defaultFocus: 'reject',
      dismissableMask: true,
      closeOnEscape: true,
      header: data['THEME.TEMPLATE.CONFIRMATION.HEADER'],
      message: data['THEME.TEMPLATE.CONFIRMATION.MESSAGE'].replace('{{ITEM}}', Utils.limitText(themeName, 50)),
      acceptLabel: data['ACTIONS.CONFIRMATION.YES'],
      rejectLabel: data['ACTIONS.CONFIRMATION.NO'],

      accept: () => {
        box.clear()
        this.templatingThemeData.emit({ id: themeId, displayName: data['ACTIONS.COPY_OF'] })
      },
      reject: () => box.clear()
    })
  }
}
