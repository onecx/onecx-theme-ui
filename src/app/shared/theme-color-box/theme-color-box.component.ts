import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { TooltipModule } from 'primeng/tooltip'

import { GeneralProps, SidebarProps, TopbarProps, ThemeColorBoxProperties } from 'src/app/shared/models/theme.model'

@Component({
  selector: 'app-theme-color-box',
  standalone: true,
  imports: [TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-color-box.component.html',
  styleUrl: './theme-color-box.component.scss'
})
export class ThemeColorBoxComponent {
  public readonly styleClass = input<string>('h-1rem w-14rem ')
  public readonly properties = input<ThemeColorBoxProperties>({
    general: {
      'primary-color': 'gray',
      'secondary-color': 'silver',
      'text-color': 'black',
      'body-bg-color': 'lightgray',
      'content-bg-color': 'white'
    },
    topbar: {
      'topbar-text-color': 'darkgray',
      'topbar-bg-color': 'lightgray'
    },
    sidebar: {
      'menu-item-text-color': 'black',
      'menu-bg-color': 'silver'
    }
  })
  public generalProperties: Signal<GeneralProps>
  public topbarProperties: Signal<TopbarProps>
  public sidebarProperties: Signal<SidebarProps>

  constructor() {
    this.generalProperties = computed(() => this.properties()?.general ?? {})
    this.topbarProperties = computed(() => this.properties()?.topbar ?? {})
    this.sidebarProperties = computed(() => this.properties()?.sidebar ?? {})
  }
}
