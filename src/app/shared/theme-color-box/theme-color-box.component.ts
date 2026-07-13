import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { TooltipModule } from 'primeng/tooltip'

import { GeneralProps, SidebarProps, ThemeProperties, TopbarProps } from 'src/app/shared/models/theme.model'

@Component({
  selector: 'app-theme-color-box',
  standalone: true,
  imports: [TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-color-box.component.html',
  styleUrl: './theme-color-box.component.scss'
})
export class ThemeColorBoxComponent {
  // signals
  public readonly styleClass = input<string>('h-1rem w-14rem ')
  // get theme properties from input and cast to ThemeColorBoxProperties (to be displayed in the color box)
  public readonly properties = input<ThemeProperties>({
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
  public generalProperties = computed(() => this.properties()?.general as unknown as GeneralProps)
  public topbarProperties = computed(() => this.properties()?.topbar as unknown as TopbarProps)
  public sidebarProperties = computed(() => this.properties()?.sidebar as unknown as SidebarProps)
}
