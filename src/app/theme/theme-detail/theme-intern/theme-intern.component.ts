import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { SlotService } from '@onecx/angular-remote-components'
import { Observable } from 'rxjs'
import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'
  @Input() workspaceList: string | undefined
  public isListWorkspacesUsingThemeComponentDefined$: Observable<boolean> | undefined
  public listWorkspacesUsingThemeSlotName = 'onecx-theme-list-workspaces-using-theme'

  @ViewChild('usedInWorkspaces') usedInWorkspaces: ElementRef = {} as ElementRef

  public operator = false

  constructor(
    private readonly translate: TranslateService,
    private readonly slotService: SlotService
  ) {
    this.isListWorkspacesUsingThemeComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(
      this.listWorkspacesUsingThemeSlotName
    )
  }

  public ngOnChanges(): void {
    if (this.theme) this.operator = this.theme.operator ?? false
    setTimeout(() => {
      if (this.usedInWorkspaces?.nativeElement) this.usedInWorkspaces.nativeElement.innerHTML = this.workspaceList
    }, 2)
  }
}
