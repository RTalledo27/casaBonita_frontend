import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-shared-delete',
  imports: [CommonModule],
  templateUrl: './shared-delete.component.html',
  styleUrl: './shared-delete.component.scss',
})
export class SharedDeleteComponent {
  @Input() visible: boolean = false;
  @Input() itemName: string = '';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
