import { Component, DestroyRef, EventEmitter, Inject, inject, Input, OnChanges, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, Observable, of, ReplaySubject } from 'rxjs'
import { TooltipModule } from 'primeng/tooltip'

import {
  AngularRemoteComponentsModule,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  SlotService,
  SLOT_SERVICE
} from '@onecx/angular-remote-components'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'
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
  imports: [AngularRemoteComponentsModule, CommonModule, RouterModule, TooltipModule, TranslateModule],
  providers: [{ provide: SLOT_SERVICE, useExisting: SlotService }],
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  @Input() themeName: string | undefined
  @Output() used = new EventEmitter<boolean>()

  private readonly destroyRef = inject(DestroyRef)
  // receive the slot output
  public slotName = 'onecx-workspace-data'
  public slotEmitter = new EventEmitter<Workspace[]>()
  public workspaceData$ = new BehaviorSubject<Workspace[] | undefined>(undefined)
  public isComponentDefined$: Observable<boolean> | undefined
  public workspaceEndpointExist = false

  constructor(
    @Inject(REMOTE_COMPONENT_CONFIG) private readonly remoteComponentConfig: ReplaySubject<RemoteComponentConfig>,
    private readonly router: Router,
    private readonly slotService: SlotService,
    private readonly workspaceService: WorkspaceService
  ) {
    this.isComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
  }

  public ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.remoteComponentConfig.next(config)
  }

  public ngOnChanges(): void {
    if (this.themeName) {
      // receive response from workspace
      this.slotEmitter.subscribe((res) => {
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
