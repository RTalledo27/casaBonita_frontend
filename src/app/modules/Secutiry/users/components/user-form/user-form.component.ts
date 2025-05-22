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
import { BehaviorSubject, debounceTime, map, merge, Observable, switchMap } from 'rxjs';
import { RolesService } from '../../../services/roles.service';
import { ActivatedRoute } from '@angular/router';


interface PassRule {
  label: string;
  test: (v: string, c?: string) => boolean;
  valid: boolean;
}



@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, CommonModule, LucideAngularModule],
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
  @Input() userData?: any; // datos para editar (si los pasan)

  //ERRORES BACKEND:
  @Input() serverErrors: Record<string, string[]> = {};

  /* ───────────── outputs ───────────── */
  @Output() submitForm = new EventEmitter<{ data: any; isEdit: boolean }>();
  @Output() cancel = new EventEmitter<void>();
  //IMPLEMENTAR CARGA POR API

  isEditMode = false; // modo create vs edit

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
    { title: 'Personal Info', icon: User, key: 'personal', expanded: true },
    { title: 'Contact Info', icon: Phone, key: 'contact', expanded: false },
    { title: 'Work Info', icon: Building, key: 'work', expanded: false },
    { title: 'Access Info', icon: Lock, key: 'access', expanded: false },
    { title: 'Roles', icon: Users, key: 'roles', expanded: false },
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;
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

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private roleService: RolesService,
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
    // Detectar modo edición
    const id = this.route.snapshot.paramMap.get('id');

    this.isEditMode = !!this.userData;
    if (this.isEditMode) {
      this.form.patchValue(this.userData);
    }

    // Patch en edición
    if (this.userData) {
      this.form.patchValue(this.userData);
    }

    // Carga única de roles
    this.roles$ = this.roleService.getAllRoles();
    this.roles$.subscribe((list) => {
      this.rolesList = list;

      if (this.isEditMode && this.userData) {
        // parchear valores simples
        this.form.patchValue(this.userData);

        // parchear lista de roles en el FormControl y stream
        this.form.get('roles')!.setValue(this.userData.roles);
        this.selectedRolesSubject.next(this.userData.roles);
      }
    });

    // Permisos
    this.selectedPermissions$ = this.selectedRolesSubject.pipe(
      switchMap((names) => this.roleService.getPermissionsForRoles(names))
    );

    // Validaciones en vivo de contraseña
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

    /* libera la URL anterior */
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);

    this.photoPreview = file ? URL.createObjectURL(file) : null;
  }

  ngOnDestroy() {
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
  }

  //VALIDACIONES PARA CONTRASEÑA:

  /* submit */
  submit(): void {
    if (this.form.invalid) {
      return;
    }

    // 1) Obtiene todos los valores (incluido el File)
    const data = this.form.getRawValue();

    // 2) Si estamos en modo edición, agrega el id al payload
    if (this.isEditMode && this.userData?.id) {
      data.id = this.userData.id;
    }

    // 3) Emite un objeto con los datos y la bandera 'edit'
    this.submitForm.emit({ data: data, isEdit: this.isEditMode });
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'personal':
        return ['first_name', 'last_name', 'birth_date'];
      case 'contact':
        return ['dni', 'phone', 'address'];
      case 'work':
        return ['position', 'department', 'hire_date'];
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
}
