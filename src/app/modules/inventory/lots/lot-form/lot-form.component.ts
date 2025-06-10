import { Component } from '@angular/core';
import { InventoryService } from '../../inventory.service';

@Component({
  selector: 'app-lot-form',
  imports: [],
  templateUrl: './lot-form.component.html',
  styleUrl: './lot-form.component.scss',
})
export class LotFormComponent {
  
  constructor(
    private inventoryService: InventoryService
  ) {
    
  }
  manzanas: Manzana[] = [];
  streetTypes: StreetType[] = [];

  ngOnInit() {
    this.loadManzanas();
    this.loadStreetTypes();
  }

  loadManzanas() {
    this.inventoryService
      .getManzanas()
      .subscribe((data) => (this.manzanas = data));
  }

  loadStreetTypes() {
    this.inventoryService
      .getStreetTypes()
      .subscribe((data) => (this.streetTypes = data));
  }

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.form.patchValue({ media_files: input.files });
      this.mediaPreviews = Array.from(input.files);
    }
  }
}
