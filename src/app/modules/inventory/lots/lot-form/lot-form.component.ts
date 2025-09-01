import { Component, ElementRef, ViewChild, viewChild } from '@angular/core';
import { LotService } from '../../services/lot.service';
import { Manzana } from '../../models/manzana';
import { StreetType } from '../../models/street-type';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StreetTypeService } from '../../services/street-type.service';
import { ManzanasService } from '../../services/manzanas.service';
import { LotMediaService } from '../../services/lot-media.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lot-form',
  standalone: true, // ← Esta línea
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, FormsModule],
  templateUrl: './lot-form.component.html',
  styleUrl: './lot-form.component.scss',
})
export class LotFormComponent {
  form!: FormGroup;
  isEditMode = false;
  editingId?: number;

  manzanas: Manzana[] = [];
  streetTypes: StreetType[] = [];

  //selectedFiles: File[] = [];
  mediaPreviews: File[] = [];
  selectedMedia: { file: File; type: string }[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isDragOver = false;

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

  /*onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.mediaPreviews = this.selectedFiles;
    }
  }*/

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((file) => {
      this.selectedMedia.push({ file, type: 'foto' });
    });
    // limpia el input para poder volver a subir mismos archivos si quieres
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (!event.dataTransfer) return;
    Array.from(event.dataTransfer.files).forEach((file) => {
      this.selectedMedia.push({ file, type: 'foto' });
    });
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

    if (this.isEditMode) {
      fd.append('_method', 'PATCH');
    }

    const request$ =
      this.isEditMode && this.editingId
        ? this.lotService.update(this.editingId, fd)
        : this.lotService.create(fd);

    request$.subscribe({
      next: (lot: any) => {
        console.log(lot.data);
        this.uploadMedia(lot.data.lot_id, this.selectedMedia);
        this.toast.show('common.saved', 'success');
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => this.toast.show('common.error', 'error'),
    });
  }

  private uploadMedia(lotId: number, media: { file: File; type: string }[]) {
    if (!media.length) return;
    this.lotMediaService.uploadMedia(lotId, media).subscribe({
      next: () => this.toast.show('common.saved', 'success'),
      error: () => this.toast.show('common.errorSave', 'error'),
    });
  }
}
