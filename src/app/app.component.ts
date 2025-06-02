import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./core/layouts/layout/layout.component";
import { ToastContainerComponent } from './shared/components/toast-container/toast-container/toast-container.component';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from "./shared/components/lang-switcher/lang-switcher.component";
import { PusherTestComponent } from "./core/services/pusher-test/pusher-test.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, CommonModule, PusherTestComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'casaBonita_frontend';
}
