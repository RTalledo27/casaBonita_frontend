import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  User,
  Phone,
  Building,
  Lock,
  Users,
  LucideAngularModule,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-angular';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
  
} from '@angular/animations';
import { Role } from '../../models/role';
import { BehaviorSubject, debounceTime, filter, map, merge, Observable, switchMap } from 'rxjs';
import { RolesService } from '../../../services/roles.service';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UsersService } from '../../../services/users.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface PassRule {
  label: string;
  test: (v: string, c?: string) => boolean;
  valid: boolean;
}



@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './user-form.component.html', // ← CORRECTO
  animations: [
    // vieja animación de acordeón
    trigger('expandCollapse', [
      state('void', style({ height: 0, opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *', animate('450ms cubic-bezier(0.4,0,0.2,1)')),
    ]),

    // nueva animación general para el modal
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
    // aplicamos la animación al elemento raíz
    '[@fadeSlideUp]': '',
  },
})
export class UserFormComponent {
  //@Input() userData?: any; // datos para editar (si los pasan)

  //ERRORES BACKEND:
  @Input() serverErrors: Record<string, string[]> = {};

  /* ───────────── outputs ───────────── */
  @Output() submitForm = new EventEmitter<{ data: any; isEdit: boolean }>();
  @Output() modalClosed = new EventEmitter<boolean>(); // Emite un booleano
  //IMPLEMENTAR CARGA POR API

  isEditMode = false;
  private editingId!: number;

  // 1. roles$
  roles$!: Observable<Role[]>;

  // 2. roleNames$ solo chheckbox de nombres para el form
  roleNames$!: Observable<string[]>;

  // 3. selectedRoles$ - ROLES SELECCIONADOS
  private selectedRolesSubject = new BehaviorSubject<string[]>([]);
  selectedRoles$ = this.selectedRolesSubject.asObservable();

  // 4. selectedPermissions$ . PERMISOS SELECCIONADOS
  selectedPermissions$!: Observable<string[]>;

  /* ───────────── form ──────────────── */
  form: FormGroup;
  roles: string[] = ['admin', 'editor', 'viewer'];
  rolesList: Role[] = [];

  sections = [
    { title: 'personalInfo', icon: User, key: 'personal', expanded: true },
    { title: 'contactInfo', icon: Phone, key: 'contact', expanded: false },
    { title: 'workInfo', icon: Building, key: 'work', expanded: false },
    { title: 'accessInfo', icon: Lock, key: 'access', expanded: false },
    { title: 'roles', icon: Users, key: 'roles', expanded: false },
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;
  User = User;
  showPassRules = false;

  passRules: PassRule[] = [
    { label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8, valid: false },
    {
      label: 'Al menos una mayúscula',
      test: (v) => /[A-Z]/.test(v),
      valid: false,
    },
    {
      label: 'Al menos una minúscula',
      test: (v) => /[a-z]/.test(v),
      valid: false,
    },
    { label: 'Al menos un número', test: (v) => /\d/.test(v), valid: false },
    {
      label: 'Al menos un símbolo (ej: @#$%)',
      test: (v) => /[!@#\$%\^&\*(),.?":{}|<>]/.test(v),
      valid: false,
    },
    {
      label: 'Confirm Password coincide',
      test: (v, c) => !!v && !!c && v === c, // ← aquí forzamos boolean
      valid: false,
    },
  ];

  get password(): AbstractControl {
    return this.form.get('password')!;
  }

  get confirm() {
    return this.form.get('password_confirmation')!;
  }

  photoPreview: string | null = null;
  cvName: string | null = null;
  cvUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private roleService: RolesService,
    private userService: UsersService,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute //  obtener el ID del usuario desde ruta
  ) {
    this.form = this.fb.group(
      {
        // PERSONAL
        first_name: ['', [Validators.required, Validators.minLength(3)]],
        last_name: ['', [Validators.required, Validators.minLength(3)]],
        birth_date: [
          '',
          [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
        ],
        photo_profile: [null, Validators.required],

        // CONTACT
        dni: ['', [Validators.required, Validators.pattern(/^\d{7,20}$/)]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,20}$/)],
        ],
        address: ['', Validators.maxLength(255)],

        // WORK
        position: ['', [Validators.required, Validators.maxLength(60)]],
        department: ['', [Validators.required, Validators.maxLength(60)]],
        hire_date: ['', Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
        cv_file: [null],
        // ACCESS
        username: ['', [Validators.required, Validators.maxLength(60)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
        status: ['active', Validators.required],

        // ROLES
        roles: [[], Validators.required],
      },
      { validators: this.passwordMatch }
    );
  }

  //FUNCION OBTENER ROLES:

  ngOnInit(): void {
    // 1) Cargo roles
    this.roles$ = this.roleService.getAllRoles();
    this.roles$.subscribe((list) => (this.rolesList = list));

    // 2) Permisos dinámicos
    this.selectedPermissions$ = this.selectedRolesSubject.pipe(
      switchMap((names) => this.roleService.getPermissionsForRoles(names))
    );

    // 3) Detecto si hay :id en la ruta
    this.route.paramMap
      .pipe(
        filter((p) => p.has('id')),
        map((p) => +p.get('id')!),
        switchMap((id) => {
          this.isEditMode = true;
          this.editingId = id;
          return this.userService.get(id);
        })
      )
      .subscribe((u) => {
        this.form.patchValue(u);
        this.selectedRolesSubject.next(u.roles);
        this.photoPreview = u.photo_url || null;
        this.cvUrl = u.cv_url || null;
        this.cvName = u.cv_url ? u.cv_url.split('/').pop() ?? null : null;
      });

    // 4) Validación en vivo de contraseñas
    merge(this.password.valueChanges, this.confirm.valueChanges)
      .pipe(debounceTime(100))
      .subscribe(() => {
        const pw = this.password.value;
        const cp = this.confirm.value;
        this.passRules.forEach((r) => (r.valid = r.test(pw, cp)));
      });
  }

  /* shortcut para template */
  fc = (n: string) => this.form.get(n)!;

  /* current step */
  get currentStep(): number {
    return this.sections.findIndex((s) => s.expanded) + 1;
  }

  /* navigation */
  toggleSection(i: number): void {
    const current = this.sections.findIndex((s) => s.expanded);
    if (i < current) {
      // ‼️ solo retroceder
      this.sections.forEach((s, idx) => (s.expanded = idx === i));
      this.cdr.detectChanges();
    }
  }

  next(): void {
    const idx = this.sections.findIndex((s) => s.expanded);
    if (!this.isSectionValid(this.sections[idx].key)) {
      return;
    }
    //CIERRE DE SECCION ACTUAL
    this.sections[idx].expanded = false;

    //ABRIR LA SIGUIENTE
    if (idx + 1 < this.sections.length) {
      this.sections[idx + 1].expanded = true;
      this.cdr.detectChanges();
    }

    console.log(this.form.value);
    //GENERAR NOMBRE DE USUARIO SI LA SECCION ES ACCESO(ACCESS INFO)
    if (this.sections[idx + 1].key === 'access') {
      this.generateUsername();
    }
  }

  // FUNCION GENERAR NOMBRE DE USUARIO
  private generateUsername(): void {
    const fn = this.fc('first_name').value as string;
    const ln = this.fc('last_name').value as string;

    if (!fn || !ln) {
      return;
    }

    // dividimos apellidos
    const parts = ln.trim().split(/\s+/);
    const firstLast = parts[0].toLowerCase();
    const secondInitial = parts[1]?.[0]?.toLowerCase() || '';

    const username = fn[0].toLowerCase() + firstLast + secondInitial;
    // actualizamos el control (habilitamos momentáneamente para setValue)
    this.form.get('username')!.enable();
    this.form.get('username')!.setValue(username);
    this.form.get('username')!.disable();
  }

  //VALIDAR SECCION EN CASO EL INPUT USERNAME ESTE CON DATA PERO CON ESTADO DISABLED
  isSectionValid(key: string): boolean {
    return this.controlsFor(key).every((name) => {
      const ctrl = this.form.get(name);
      // Si el control está deshabilitado lo consideramos válido,
      // en caso contrario comprobamos su propiedad valid.
      return ctrl?.disabled || ctrl?.valid;
    });
  }

  /* roles checkbox handler */
  onRoleChange(evt: Event, roleName: string) {
    const checked = (evt.target as HTMLInputElement).checked;
    const current: string[] = this.form.value.roles;
    const next = checked
      ? [...current, roleName]
      : current.filter((r) => r !== roleName);

    this.form.get('roles')!.setValue(next);
    this.selectedRolesSubject.next(next);
  }

  //REGISTRO DE NUEVO USUARIO:
  /* onRegister(): void {
    this.submitForm.emit(this.form.value);
  }*/

  /*────────────── onPhotoChange ──────────────*/
  onPhotoChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.fc('photo_profile').setValue(file);
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
    this.photoPreview = file ? URL.createObjectURL(file) : null;
  }

  onCvChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.fc('cv_file').setValue(file);
    this.cvName = file ? file.name : null;
  }

  ngOnDestroy() {
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
  }

  //VALIDACIONES PARA CONTRASEÑA:

  /* submit */
  submit(): void {
    if (this.form.invalid) {
      this.toast.show('Revisa los campos marcados en rojo', 'error');
      return;
    }

    // 1) Armar FormData igual que en onFormSubmit
    const raw = this.form.getRawValue();
    const fd = new FormData();
    Object.entries(raw).forEach(([key, val]) => {
      if (val == null) return;
      if (Array.isArray(val)) {
        val.forEach((v) => fd.append(`${key}[]`, v));
      } else if (val instanceof File) {
        fd.append(key, val, val.name);
      } else {
        fd.append(key, val.toString());
      }
    });

    // 2) Elegir create vs update
    let req$;
    if (this.isEditMode && this.editingId) {
      fd.append('_method', 'PATCH');
      req$ = this.userService.update(this.editingId, fd);
    } else {
      req$ = this.userService.create(fd);
    }

    // 3) Suscribirse y manejar toast + cierre modal
    req$.subscribe({
      next: (user) => {
        this.toast.show(
          this.isEditMode ? 'Usuario actualizado' : 'Usuario creado',
          'success'
        );
        this.submitForm.emit({ data: user, isEdit: this.isEditMode }); // ✅ Emitir aquí

        // cerrar modal (asumiendo que parent escucha ruta auxiliar)
        this.router.navigate([{ outlets: { modal: null } }], {
          relativeTo: this.route.parent,
        });
        // opcional: emitir evento para refrescar lista
        this.submitForm.emit({ data: user, isEdit: this.isEditMode });
      },
      error: (err) => {
        console.log(err);
        const errors: Record<string, string[]> = err.error?.errors || {};
        // 1) Guárdalos para pintarlos inline
        this.serverErrors = errors;
        console.log(this.serverErrors);
        // 2) Y muéstralos en toast
        Object.values(errors)
          .flat()
          .forEach((msg) => this.toast.show(msg, 'error', 5000));

        if (!Object.keys(errors).length) {
          this.toast.show(
            this.isEditMode
              ? 'Error al actualizar el usuario'
              : 'Error al crear el usuario',
            'error'
          );
        }
      },
    });
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'personal':
        return ['first_name', 'last_name', 'birth_date'];
      case 'contact':
        return ['dni', 'phone', 'address'];
      case 'work':
        return ['position', 'department', 'hire_date', 'cv_file'];
      case 'access':
        return [
          'username',
          'email',
          'password',
          'password_confirmation',
          'status',
        ];
      case 'roles':
        return ['roles'];
      default:
        return [];
    }
  }

  private passwordMatch(ctrl: AbstractControl) {
    const p = ctrl.get('password')?.value;
    const c = ctrl.get('password_confirmation')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  onCancel() {
    this.modalClosed.emit(false);
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: this.route.parent, // Mantén la ruta base (security/users)
      skipLocationChange: true,
    });
  }
}
