import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.scss',
})
export class LangSwitcherComponent {
  langs = ['es', 'en'];

  constructor(private translate: TranslateService) {
    translate.addLangs(this.langs);
   // translate.use('es'); // idioma inicial
  }

  switchLang(lang: string) {
    this.translate.use(lang);
  }
}
