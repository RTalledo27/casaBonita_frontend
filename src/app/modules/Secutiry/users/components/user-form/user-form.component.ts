import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { User,Phone,Building,Lock, Users, LucideAngularModule, ChevronUp, ChevronDown, X } from 'lucide-angular';
import {trigger, state, style, transition, animate} from '@angular/animations';
import { Role } from '../../models/role';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';
import { RolesService } from '../../../services/roles.service';
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, CommonModule, LucideAngularModule],
  templateUrl: './user-form.component.html', // ← CORRECTO
  animations: [
    trigger('expandCollapse', [
      state('void', style({ height: 0, opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition('void <=> *',
        animate('450ms cubic-bezier(0.4,0,0.2,1)'))
    ])
  ]
})
export class UserFormComponent {
 
  /* ───────────── outputs ───────────── */
  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  //IMPLEMENTAR CARGA POR API

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

  sections = [
    { title: 'Personal Info', icon: User, key: 'personal', expanded: true },
    { title: 'Contact Info', icon: Phone, key: 'contact', expanded: false },
    { title: 'Work Info', icon: Building, key: 'work', expanded: false },
    { title: 'Access Info', icon: Lock, key: 'access', expanded: false },
    { title: 'Roles', icon: Users, key: 'roles', expanded: false }
  ];

  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  X = X;

  photoPreview: string | null = null;


  constructor(private fb: FormBuilder,
    private cdr: ChangeDetectorRef, private roleService: RolesService ) {

    
    this.form = this.fb.group({
      /* personal */
      first_name: ['', [Validators.required, Validators.minLength(3)]],
      last_name: ['', [Validators.required, Validators.minLength(3)]],
      birth_date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      photo_profile: [null],          // opcional


      /* contact */
      dni: ['', Validators.required],
      phone: ['', Validators.required],
      address: [''],

      /* work */
      position: ['', Validators.required],
      department: ['', Validators.required],
      hire_date: [''],

      /* access */
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      status: ['active', Validators.required],

      /* roles */
      roles: [[], Validators.required]
    }, { validators: this.passwordMatch }
    );
  }

  //FUNCION OBTENER ROLES:
  

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.roles$ = this.roleService.getAllRoles();

    //EXTRAER NOMBRES DE ROLES
    this.roleNames$ = this.roles$.pipe(
      map(roles => roles.map(role => role.name))
    );

    //CALCULAR PERMISOS CADA VEZ QUE SE CAMBIA EL ROL
    this.selectedPermissions$ = this.selectedRoles$.pipe(
      switchMap(names => this.roleService.getPermissionsForRoles(names))
    );
  }


  /* shortcut para template */
  fc = (n: string) => this.form.get(n)!;

  /* current step */
  get currentStep(): number {
    return this.sections.findIndex(s => s.expanded) + 1;
  }

  /* navigation */
  toggleSection(i: number): void {
    const current = this.sections.findIndex(s => s.expanded);
    if (i < current) {                     // ‼️ solo retroceder
      this.sections.forEach((s, idx) => s.expanded = idx === i);
      this.cdr.detectChanges();
    }
  }

  next(): void {
    const idx = this.sections.findIndex(s => s.expanded);
    if (!this.isSectionValid(this.sections[idx].key)) { return; }

    this.sections[idx].expanded = false;
    if (idx + 1 < this.sections.length) {
      this.sections[idx + 1].expanded = true;
      this.cdr.detectChanges();
    }
  }

  /* roles checkbox handler */
  onRoleChange(evt: Event, roleName: string): void {
    const checked = (evt.target as HTMLInputElement).checked;
    const current = this.form.value.roles as string[];
    const next = checked
      ? [...current, roleName]
      : current.filter(r => r !== roleName);

    //Actualizo el FormControl
    this.form.get('roles')!.setValue(next);

    // Emite la nueva lista en el stream
    this.selectedRolesSubject.next(next);
  }

  /*────────────── onPhotoChange ──────────────*/
  onPhotoChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.fc('photo_profile').setValue(file);

    /* libera la URL anterior */
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);

    this.photoPreview = file ? URL.createObjectURL(file) : null;
  }

  ngOnDestroy(){
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
  }



  /* submit */
  submit(): void {
    if (this.form.valid) { this.submitForm.emit(this.form.value); }
  }

  /* helpers */
  isSectionValid(key: string): boolean {
    return this.controlsFor(key).every(c => this.fc(c).valid);
  }

  private controlsFor(key: string): string[] {
    switch (key) {
      case 'personal': return ['first_name','last_name','birth_date'];
      case 'contact' : return ['dni','phone','address'];
      case 'work'    : return ['position','department','hire_date'];
      case 'access'  : return ['username','email','password',
                               'confirmPassword','status'];
      case 'roles'   : return ['roles'];
      default        : return [];
    }
  }

  private passwordMatch(ctrl: AbstractControl) {
    const p = ctrl.get('password')?.value;
    const c = ctrl.get('confirmPassword')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }
}