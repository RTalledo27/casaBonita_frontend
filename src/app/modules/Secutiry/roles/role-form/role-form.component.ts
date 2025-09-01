import { ChangeDetectorRef, Component, EventEmitter, Input, Output, output } from '@angular/core';
import { BehaviorSubject, filter, findIndex, map, Observable, switchMap } from 'rxjs';
import { Permission } from '../../users/models/permission';
import { ChevronDown, ChevronUp, Key, LucideAngularModule, Settings, X } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionsService } from '../../services/permissions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { TimeScale } from 'chart.js';
import { RolesService } from '../../services/roles.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-role-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('void', style({ height: 0, opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *', animate('450ms cubic-bezier(0.4,0,0.2,1)')),
    ]),
    trigger('fadeSlideUp', [
      transition(':enter', [
        animate(
          '300ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 }),
          ])
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          keyframes([
            style({ opacity: 1, transform: 'translateY(0)', offset: 0 }),
            style({ opacity: 0, transform: 'translateY(20px)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
  host: {
    '[@fadeSlideUp]': '',
  },
})
export class RoleFormComponent {
  @Input() serverErrors: Record<string, string[]> = {};
  @Output() submitForm = new EventEmitter<{ data: any; isEdit: boolean }>();
  @Output() modalClosed = new EventEmitter<boolean>();

  isEditMode = false;
  editingId!: number;
  permissionsList: Permission[] = [];
  selectedPermissions$ = new BehaviorSubject<string[]>([]);

  sections = [
    { title: 'general', icon: Settings, key: 'general', expanded: true },
    { title: 'permissions', icon: Key, key: 'permissions', expanded: false },
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private permissionsService: PermissionsService,
    private roleService: RolesService,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      description: ['', Validators.maxLength(255)],
      permissions: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPermissions();
    this.checkEditMode();
  }

  private loadPermissions(): void {
    this.permissionsService.list().subscribe({
      next: (permissions) => {
        console.log('Raw response:', permissions);
        console.log('Type of response:', typeof permissions);
        console.log('Is Array?', Array.isArray(permissions));
        console.log('First item:', permissions[0]);
        this.permissionsList = permissions;
      },
      error: () => this.toast.show('Error loading permissions', 'error'),
    });
  }

  private checkEditMode(): void {
    this.route.paramMap
      .pipe(
        filter((p) => p.has('id')),
        map((p) => +p.get('id')!),
        switchMap((id) => {
          this.isEditMode = true;
          this.editingId = id;
          return this.roleService.get(id);
        })
      )
      .subscribe((role) => {
        const permissions = role.permissions.map((p) => p.name);
        this.form.patchValue({
          name: role.name,
          description: role.description,
          permissions: permissions,
        });
        this.selectedPermissions$.next(permissions);
      });
  }

  // Shortcut para acceder a los controles
  fc = (n: string) => this.form.get(n)!;

  // Navegación entre secciones
  toggleSection(i: number): void {
    const current = this.sections.findIndex((s) => s.expanded);
    if (i < current) {
      this.sections.forEach((s, idx) => (s.expanded = idx === i));
      this.cdr.detectChanges();
    }
  }

  next(): void {
    const idx = this.sections.findIndex((s) => s.expanded);
    if (!this.isSectionValid(this.sections[idx].key)) return;

    this.sections[idx].expanded = false;
    if (idx + 1 < this.sections.length) {
      this.sections[idx + 1].expanded = true;
      this.cdr.detectChanges();
    }
  }

  isSectionValid(key: string): boolean {
    return this.controlsFor(key).every((name) => {
      const ctrl = this.form.get(name);
      return ctrl?.disabled || ctrl?.valid;
    });
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'general':
        return ['name', 'description'];
      case 'permissions':
        return ['permissions'];
      default:
        return [];
    }
  }

  onPermissionChange(permissionName: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const permissions = this.form.value.permissions;

    const updated = checked
      ? [...permissions, permissionName]
      : permissions.filter((p: string) => p !== permissionName);

    this.form.patchValue({ permissions: updated });
    this.selectedPermissions$.next(updated);
  }

  get currentStep(): number {
    return this.sections.findIndex((s) => s.expanded) + 1;
  }

  submit(): void {
    if (this.form.invalid) {
      this.toast.show('Please check required fields', 'error');
      return;
    }

    const formData = new FormData();
    const rawData = this.form.getRawValue();

    Object.entries(rawData).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v) => formData.append(`${key}[]`, v));
      } else if (val !== null && val !== undefined) {
        formData.append(key, String(val));
      }
    });
    if (this.isEditMode && this.editingId) {
      formData.append('_method','PATCH');
  }
    const operation$ = this.isEditMode
      ? this.roleService.update(this.editingId, formData)
      : this.roleService.create(formData);

    operation$.subscribe({
      next: (role) => {
        this.router.navigate([{ outlets: { modal: null } }], {
          relativeTo: this.route.parent,
        });
        this.handleSuccess(role);
      },
      error: (err) => this.handleError(err),
    });
  }

  private handleSuccess(role: any): void {
    this.toast.show(
      `Role ${this.isEditMode ? 'updated' : 'created'} successfully`,
      'success'
    );
    this.submitForm.emit({ data: role, isEdit: this.isEditMode });
    this.closeModal();
  }

  private handleError(err: any): void {
    const errors = err.error?.errors || {};
    this.serverErrors = errors;

    Object.values(errors)
      .flat()
      .forEach((msg: any) => this.toast.show(msg, 'error', 5000));

    if (!Object.keys(errors).length) {
      this.toast.show('Operation failed', 'error');
    }
  }

  onCancel(): void {
    this.modalClosed.emit(false);
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent,
      skipLocationChange: true,
    });
  }

  private closeModal(): void {
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent,
    });
  }
}






      


