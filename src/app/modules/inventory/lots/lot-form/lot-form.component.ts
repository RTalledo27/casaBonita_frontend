import { Component } from '@angular/core';
import { LotService } from '../../services/lot.service';
import { Manzana } from '../../models/manzana';
import { StreetType } from '../../models/street-type';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StreetTypeService } from '../../services/street-type.service';
import { ManzanasService } from '../../services/manzanas.service';
import { LotMediaService } from '../../services/lot-media.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lot-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './lot-form.component.html',
  styleUrl: './lot-form.component.scss',
})
export class LotFormComponent {
  form!: FormGroup;
  isEditMode = false;
  editingId?: number;

  manzanas: Manzana[] = [];
  streetTypes: StreetType[] = [];

  selectedFiles: File[] = [];
  mediaPreviews: File[] = [];

  constructor(
    private fb: FormBuilder,
    private lotService: LotService,
    private lotMediaService: LotMediaService,
    private manzanasService: ManzanasService,
    private streetTypeService: StreetTypeService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      manzana_id: ['', Validators.required],
      street_type_id: ['', Validators.required],
      num_lot: ['', Validators.required],
      area_m2: [''],
      area_construction_m2: [''],
      total_price: [''],
      funding: [0],
      BPP: [0],
      BFH: [0],
      initial_quota: [''],
      currency: ['PEN'],
      status: ['disponible'],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = +id;
      this.lotService.get(this.editingId).subscribe((lot) => {
        this.form.patchValue(lot);
      });
    }

    this.loadManzanas();
    this.loadStreetTypes();
  }

  loadManzanas() {
    this.manzanasService.list().subscribe((data) => (this.manzanas = data));
  }

  loadStreetTypes() {
    this.streetTypeService
      .list()
      .subscribe((data) => (this.streetTypes = data));
  }

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.mediaPreviews = this.selectedFiles;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.toast.show('Please fill required fields', 'error');
      return;
    }

    const fd = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.append(key, String(value));
      }
    });

    const request$ =
      this.isEditMode && this.editingId
        ? this.lotService.update(this.editingId, fd)
        : this.lotService.create(fd);

    request$.subscribe({
      next: (lot) => {
        this.uploadMedia(lot.lot_id, this.selectedFiles);
        this.toast.show('common.saved', 'success');
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => this.toast.show('common.error', 'error'),
    });
  }

  private uploadMedia(lotId: number, files: File[]) {
    if (!files.length) return;
    this.lotMediaService.uploadMedia(lotId, files).subscribe({
      next: () => this.toast.show('Media subida', 'success'),
      error: () => this.toast.show('Error subiendo media', 'error'),
    });
  }
}
