import { Component } from '@angular/core'
import { StandaloneShellModule } from '@onecx/angular-standalone-shell'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StandaloneShellModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'onecx-ui'
}
