import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.scss'
})
export class LangSwitcherComponent implements OnInit {
  currentLang: string = 'es';

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'es';
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
