import { Component, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip-popover',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="tooltip-popover" [ngStyle]="{ top: top+'px', left: left+'px', display: visible ? 'block' : 'none' }" role="dialog" [attr.aria-hidden]="!visible">
      <div class="tooltip-content">{{ text }}</div>
    </div>
  `,
  styles: [
    `.tooltip-popover { position: absolute; z-index: 9999; background: white; border: 1px solid rgba(0,0,0,0.12); padding: 8px; border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); max-width: 300px; }
     .tooltip-content { font-size: 13px; color: #222 }`
  ]
})
export class TooltipPopoverComponent {
  @Input() text = '';
  top = 0;
  left = 0;
  visible = false;

  private clickAwayHandler: (() => void) | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  toggle(event: MouseEvent) {
    event.stopPropagation();
    if (this.visible) {
      this.close();
    } else {
      this.openAtEvent(event);
    }
  }

  openAtEvent(event: MouseEvent) {
    const spacing = 8;
    const win = window;
    const x = event.clientX + win.scrollX;
    const y = event.clientY + win.scrollY;
    // position below the click by default
    this.left = Math.max(8, x - 150);
    this.top = y + spacing;
    this.visible = true;
    // attach click away
    this.clickAwayHandler = this.renderer.listen('document', 'click', () => this.close());
  }

  close() {
    this.visible = false;
    if (this.clickAwayHandler) {
      this.clickAwayHandler();
      this.clickAwayHandler = null;
    }
  }

  @HostListener('document:keydown.escape', [])
  onEscape() { this.close(); }
}
