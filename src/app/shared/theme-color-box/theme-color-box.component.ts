import { Component, Input } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { TooltipModule } from 'primeng/tooltip'

@Component({
  selector: 'app-theme-color-box',
  standalone: true,
  imports: [TooltipModule, TranslateModule],
  styleUrls: ['./theme-color-box.component.scss'],
  templateUrl: './theme-color-box.component.html'
})
export class ThemeColorBoxComponent {
  @Input() public styleClass = 'h-1rem w-14rem '
  @Input() public properties = {
    general: {
      'primary-color': 'lightgray',
      'secondary-color': 'silver',
      'text-color': 'gray'
    },
    topbar: {
      'topbar-text-color': 'gray',
      'topbar-bg-color': 'lightgray',
      'topbar-menu-button-text-color': 'black',
      'topbar-menu-button-bg-color': 'silver',
      'topbar-left-bg-color': ' lightgray'
    }
  }
}
