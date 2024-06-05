import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'
  @Input() workspaceList: string | undefined

  @ViewChild('usedInWorkspaces') usedInWorkspaces: ElementRef = {} as ElementRef

  public operator = false

  constructor(private translate: TranslateService) {}

  public ngOnChanges(): void {
    if (this.theme) this.operator = this.theme.operator ?? false
    setTimeout(() => {
      if (this.usedInWorkspaces?.nativeElement) this.usedInWorkspaces.nativeElement.innerHTML = this.workspaceList
    }, 2)
  }
}
