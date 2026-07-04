import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs'
import { TooltipModule } from 'primeng/tooltip'

import { SlotService, SLOT_SERVICE, AngularRemoteComponentsModule } from '@onecx/angular-remote-components'
import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Utils } from 'src/app/shared/utils'

export type Workspace = {
  name: string
  displayName: string
  description?: string
  theme?: string
  homePage?: string
  baseUrl?: string
  companyName?: string
  phoneNumber?: string
  rssFeedUrl?: string
  footerLabel?: string
  logoUrl?: string
  mandatory?: boolean
  operator?: boolean
  disabled?: boolean
}
export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}

@Component({
  selector: 'app-theme-use',
  standalone: true,
  imports: [AngularRemoteComponentsModule, AsyncPipe, RouterModule, TooltipModule, TranslateModule],
  providers: [{ provide: SLOT_SERVICE, useExisting: SlotService }],
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent implements OnChanges {
  @Input() themeName: string | undefined
  @Output() used = new EventEmitter<boolean>()

  private readonly destroyRef = inject(DestroyRef)
  private slotSubscription: Subscription | undefined
  // receive the slot output
  public slotName = 'onecx-workspace-data'
  public slotEmitter = new EventEmitter<Workspace[]>()
  public workspaceData$ = new BehaviorSubject<Workspace[] | undefined>(undefined)
  public isComponentDefined$: Observable<boolean> | undefined
  public workspaceEndpointExist = false

  constructor(
    private readonly router: Router,
    private readonly slotService: SlotService,
    private readonly workspaceService: WorkspaceService
  ) {
    slotInitializer(slotService)
    this.isComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
  }

  public ngOnChanges(): void {
    if (this.themeName) {
      // receive response from workspace
      this.slotSubscription?.unsubscribe()
      this.slotSubscription = this.slotEmitter.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
        this.workspaceData$.next(res)
        if (res.length > 0) this.used.emit(true)
        else this.used.emit(false)
      })
      // check endpoint exists
      this.workspaceEndpointExist = Utils.doesEndpointExist(
        this.workspaceService,
        'onecx-workspace',
        'onecx-workspace-ui',
        'workspace-detail'
      )
    }
  }

  public getWorkspaceEndpointUrl$(name?: string): Observable<string | undefined> {
    if (this.workspaceEndpointExist && name)
      return this.workspaceService.getUrl('onecx-workspace', 'onecx-workspace-ui', 'workspace-detail', {
        'workspace-name': name
      })
    return of(undefined)
  }
}
