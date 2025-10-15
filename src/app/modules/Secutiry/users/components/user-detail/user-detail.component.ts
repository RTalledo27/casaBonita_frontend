import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../services/users.service';
import { Observable, switchMap, tap } from 'rxjs';
import { LucideAngularModule, User as userIcon, Edit, Save, X, ArrowLeft, Trash2, Camera, Mail, CreditCard, Phone, Award, Building, Calendar, CalendarCheck, Shield, FileText, Download, Upload, Users, Crown, Key, Lock, Briefcase } from 'lucide-angular';
import { User } from '../../models/user';
import { environment } from '../../../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../../../services/roles.service';



@Component({
  selector: 'app-user-detail',
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    LucideAngularModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent {
  user$: Observable<any>;
  isEditing = false;
  editForm: FormGroup;
  roles: any[] = [];
  selectedRoleId: number | null = null;
  selectedFile: File | null = null;
  selectedCvFile: File | null = null;

  backendBaseUrl = environment.BACKEND_BASE_URL;

  // Icons
  User = userIcon;
  Edit = Edit;
  Save = Save;
  X = X;
  ArrowLeft = ArrowLeft;
  Trash2 = Trash2;
  Camera = Camera;
  Mail = Mail;
  CreditCard = CreditCard;
  Phone = Phone;
  Award = Award;
  Building = Building;
  Calendar = Calendar;
  CalendarCheck = CalendarCheck;
  Shield = Shield;
  FileText = FileText;
  Download = Download;
  Upload = Upload;
  Users = Users;
  Crown = Crown;
  Key = Key;
  Lock = Lock;
  Briefcase = Briefcase;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private toast: ToastService,
    private fb: FormBuilder,
    private rolesService: RolesService
  ) {
    this.editForm = this.fb.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dni: [''],
      phone: [''],
      position: [''],
      department: [''],
      birth_date: [''],
      hire_date: [''],
      status: ['active'],
      roles: [null]
    });

    this.user$ = this.route.paramMap.pipe(
      switchMap((p) => this.usersService.get(+p.get('id')!)),
      tap(user => {
        if (user) {
          console.log('=== CONSTRUCTOR USER DATA DEBUG ===');
          console.log('User data received:', user);
          console.log('User roles:', user.roles);
          console.log('User roles type:', typeof user.roles);
          console.log('User roles length:', user.roles?.length);
          
          if (user.roles) {
            user.roles.forEach((role: any, index: number) => {
              console.log(`User role ${index}:`, role, `Type: ${typeof role}`);
              if (typeof role === 'object' && role) {
                console.log(`Role ${index} properties:`, Object.keys(role));
                console.log(`Role ${index} id:`, role.id, `Type: ${typeof role.id}`);
              }
            });
          }
          
          // For radio buttons, we need a single value, not an array
          // Since we're now working with role names, we need to get the role name
          let selectedRoleName = null;
          console.log('Processing roles for form control...');
          
          if (user.roles && user.roles.length > 0) {
            const firstRole = user.roles[0];
            console.log('First role:', firstRole, `Type: ${typeof firstRole}`);
            
            if (typeof firstRole === 'object' && firstRole) {
              // If it's an object, look for name property
              if ((firstRole as any).name) {
                selectedRoleName = (firstRole as any).name;
                console.log('Found role name from object:', selectedRoleName);
              } else if ((firstRole as any).id) {
                // If no name but has ID, we need to find the role name from the roles array
                const roleId = (firstRole as any).id;
                console.log('Role has ID but no name, will find name after roles are loaded:', roleId);
                // We'll set this after roles are loaded
                this.selectedRoleId = Number(roleId);
              }
            } else if (typeof firstRole === 'string') {
              // If it's already a string, assume it's the role name
              selectedRoleName = firstRole;
              console.log('Role is already a string (name):', selectedRoleName);
            }
          } else {
            console.log('No roles found for user');
            selectedRoleName = null;
          }
          
          console.log('Final selected role name for radio button:', selectedRoleName);
          console.log('selectedRoleName type:', typeof selectedRoleName);
          console.log('=== END CONSTRUCTOR DEBUG ===');
          
          this.editForm.patchValue({
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            dni: user.dni,
            phone: user.phone,
            position: user.position,
            department: user.department,
            birth_date: user.birth_date,
            hire_date: user.hire_date,
            status: user.status,
            roles: selectedRoleName
          });
          
          console.log('Form patched with roles value:', selectedRoleName);
          console.log('Form control value after patch:', this.editForm.get('roles')?.value);
        }
      })
    );

    this.loadRoles();
  }

  // Getter methods for form controls to ensure proper typing
  get firstNameControl(): FormControl {
    return this.editForm.get('first_name') as FormControl;
  }

  get lastNameControl(): FormControl {
    return this.editForm.get('last_name') as FormControl;
  }

  get usernameControl(): FormControl {
    return this.editForm.get('username') as FormControl;
  }

  get emailControl(): FormControl {
    return this.editForm.get('email') as FormControl;
  }

  get dniControl(): FormControl {
    return this.editForm.get('dni') as FormControl;
  }

  get phoneControl(): FormControl {
    return this.editForm.get('phone') as FormControl;
  }

  get positionControl(): FormControl {
    return this.editForm.get('position') as FormControl;
  }

  get departmentControl(): FormControl {
    return this.editForm.get('department') as FormControl;
  }

  get birthDateControl(): FormControl {
    return this.editForm.get('birth_date') as FormControl;
  }

  get hireDateControl(): FormControl {
    return this.editForm.get('hire_date') as FormControl;
  }

  get statusControl(): FormControl {
    return this.editForm.get('status') as FormControl;
  }

  loadRoles() {
    this.rolesService.list().subscribe({
      next: (response: any) => {
        this.roles = response.data || response;
        console.log('Loaded roles:', this.roles);
        this.roles.forEach(role => {
          console.log(`Role: ${role.name}, ID: ${role.role_id}, Type: ${typeof role.role_id}`);
        });
        
        // If we have a selectedRoleId but no role name in form, find the role name
        if (this.selectedRoleId && !this.editForm.get('roles')?.value) {
          const role = this.roles.find(r => r.role_id === this.selectedRoleId);
          if (role) {
            console.log('Setting role name from loaded roles:', role.name);
            this.editForm.get('roles')?.setValue(role.name);
          }
        }
      },
      error: () => {
        this.toast.show('Error loading roles', 'error');
      }
    });
  }

  toggleEdit() {
    console.log('=== TOGGLE EDIT DEBUG ===');
    console.log('Current isEditing state:', this.isEditing);
    
    this.isEditing = !this.isEditing;
    console.log('New isEditing state:', this.isEditing);
    
    if (!this.isEditing) {
      console.log('Canceling edit - resetting form');
      // Reset form when canceling
      this.user$.subscribe(user => {
        console.log('=== TOGGLE EDIT RESET DEBUG ===');
        console.log('User data for reset:', user);
        console.log('User roles for reset:', user.roles);
        
        // For radio buttons, we need a single value, not an array
        let selectedRoleId = null;
        if (user.roles && user.roles.length > 0) {
          const firstRole = user.roles[0];
          console.log('First role for reset:', firstRole, `Type: ${typeof firstRole}`);
          
          if (typeof firstRole === 'object' && firstRole.id) {
            console.log('Processing object role for reset with id:', firstRole.id);
            const roleIdValue = firstRole.id;
            
            // Validate the role ID before conversion
            if (roleIdValue !== null && roleIdValue !== undefined && roleIdValue !== '') {
              selectedRoleId = Number(roleIdValue);
              console.log('Converted role ID for reset:', selectedRoleId);
              
              // Double-check for NaN after conversion
              if (isNaN(selectedRoleId)) {
                console.error('ERROR: Role ID conversion resulted in NaN from object role in reset!');
                console.error('Original role ID value:', roleIdValue);
                selectedRoleId = null; // Reset to null if conversion fails
              }
            } else {
              console.warn('Role ID is null, undefined, or empty in object role for reset');
              selectedRoleId = null;
            }
          } else if (typeof firstRole === 'string' || typeof firstRole === 'number') {
            console.log('Processing primitive role for reset:', firstRole);
            
            // Validate the primitive role before conversion
            if (firstRole !== null && firstRole !== undefined && firstRole !== '') {
              selectedRoleId = Number(firstRole);
              console.log('Converted primitive role for reset:', selectedRoleId);
              
              // Double-check for NaN after conversion
              if (isNaN(selectedRoleId)) {
                console.error('ERROR: Role ID conversion resulted in NaN from primitive role in reset!');
                console.error('Original role value:', firstRole);
                selectedRoleId = null; // Reset to null if conversion fails
              }
            } else {
              console.warn('Primitive role is null, undefined, or empty for reset');
              selectedRoleId = null;
            }
          } else {
            console.warn('Unexpected role type for reset:', typeof firstRole, firstRole);
            selectedRoleId = null;
          }
        } else {
          console.log('No roles found for user in reset');
          selectedRoleId = null;
        }
        
        console.log('Final selected role ID for reset:', selectedRoleId);
        console.log('selectedRoleId type for reset:', typeof selectedRoleId);
        console.log('isNaN(selectedRoleId) for reset:', selectedRoleId !== null ? isNaN(selectedRoleId) : 'null value');
        
        this.editForm.patchValue({
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          dni: user.dni,
          phone: user.phone,
          position: user.position,
          department: user.department,
          birth_date: user.birth_date,
          hire_date: user.hire_date,
          status: user.status,
          roles: selectedRoleId
        });
        
        console.log('Form reset with roles value:', selectedRoleId);
        console.log('Form control value after reset:', this.editForm.get('roles')?.value);
        console.log('=== END TOGGLE EDIT RESET DEBUG ===');
      });
      this.selectedFile = null;
      this.selectedCvFile = null;
    }
    console.log('=== END TOGGLE EDIT DEBUG ===');
  }

  onFileSelect(event: any, type: 'photo' | 'cv') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'photo') {
        this.selectedFile = file;
      } else {
        this.selectedCvFile = file;
      }
    }
  }

  onRoleChange(event: any, roleName: string): void {
    console.log('onRoleChange called with event:', event);
    console.log('onRoleChange called with roleName parameter:', roleName);
    console.log('Event target:', event.target);
    console.log('Event target checked:', event.target.checked);
    
    const inputElement = event.target as HTMLInputElement;
    console.log('Input element:', inputElement);
    console.log('Input element checked property:', inputElement.checked);
    
    // Only update if the radio button is checked
    if (inputElement.checked) {
      console.log('Radio button is checked, setting role name to:', roleName);
      console.log('Role name type:', typeof roleName);
      
      // Update the form control with the selected role name
      this.editForm.get('roles')?.setValue(roleName);
      console.log('Form control roles value after update:', this.editForm.get('roles')?.value);
      console.log('Form control roles validity:', this.editForm.get('roles')?.valid);
    } else {
      console.log('Radio button is not checked, ignoring change event');
    }
  }

  isRoleSelected(roleId: number): boolean {
    const selectedRoleName = this.editForm.get('roles')?.value;
    // Find the role by ID to get its name
    const role = this.roles.find(r => r.role_id === roleId);
    const isSelected = role && selectedRoleName === role.name;
    console.log(`isRoleSelected(${roleId}): selectedRoleName=${selectedRoleName}, roleName=${role?.name}, isSelected=${isSelected}`);
    return isSelected;
  }

  saveChanges() {
    console.log('saveChanges called');
    console.log('Form valid:', this.editForm.valid);
    console.log('Form value:', this.editForm.value);
    console.log('Form errors:', this.editForm.errors);
    
    // Debug roles form control specifically
    const rolesControl = this.editForm.get('roles');
    console.log('Roles FormControl:', rolesControl);
    console.log('Roles FormControl value:', rolesControl?.value);
    console.log('Roles FormControl errors:', rolesControl?.errors);
    console.log('Roles FormControl status:', rolesControl?.status);
    console.log('Roles FormControl touched:', rolesControl?.touched);
    console.log('Roles FormControl dirty:', rolesControl?.dirty);
    
    if (this.editForm.invalid) {
      console.log('Form is invalid');
      this.toast.show('Please fill all required fields', 'error');
      return;
    }

    const userId = +this.route.snapshot.paramMap.get('id')!;
    console.log('User ID:', userId);
    const formData = new FormData();

    // Check if a role is selected
    const rolesValue = this.editForm.value.roles;
    console.log('Roles form control value:', rolesValue, 'Type:', typeof rolesValue);
    
    if (rolesValue === null || rolesValue === undefined) {
      console.error('No role selected');
      this.toast.error('Error: Debe seleccionar un rol');
      return;
    }

    // Add form data
    Object.keys(this.editForm.value).forEach(key => {
      const value = this.editForm.value[key];
      console.log(`Processing field: ${key}, value:`, value, `type: ${typeof value}`);
      
      if (key === 'roles') {
        console.log('Processing role:', value);
        console.log('Available roles for mapping:', this.roles);
        
        // Handle single role selection - value is now a role name, not an ID
        const roleName = value;
        
        // DETAILED DEBUGGING FOR ROLE NAME VALIDATION
        console.log('=== ROLE NAME VALIDATION DEBUG ===');
        console.log('Original roleName value:', roleName);
        console.log('roleName type:', typeof roleName);
        console.log('roleName === null:', roleName === null);
        console.log('roleName === undefined:', roleName === undefined);
        console.log('roleName === "":', roleName === '');
        console.log('=== END DEBUG ===');
        
        // Additional validation to prevent empty values
        // Check for null, undefined, or empty string values
        if (roleName === null || roleName === undefined || roleName === '') {
          console.error('Invalid role name detected in form data:', roleName);
          console.error('Validation failed - roleName is null, undefined, or empty');
          this.toast.error('Error: Nombre de rol inválido');
          return;
        }
        
        const role = this.roles.find(r => r.name === roleName);
        if (role) {
          console.log(`Sending role name "${role.name}" as array for role ID: ${role.role_id}`);
          // Send role name as array (backend expects roles to be an array of names)
          formData.append('roles[]', role.name);
        } else {
          console.warn(`Role with name "${roleName}" not found in available roles`);
          this.toast.error('Error: Rol no encontrado');
          return;
        }
      } else if (key !== 'roles' && value !== null && value !== undefined) {
        // Ensure value can be safely converted to string
        let stringValue: string;
        if (typeof value === 'string') {
          stringValue = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = value.toString();
        } else if (value instanceof Date) {
          stringValue = value.toISOString();
        } else if (typeof value === 'object') {
          // For objects, convert to JSON string
          stringValue = JSON.stringify(value);
        } else {
          // Fallback: convert to string
          stringValue = String(value);
        }
        console.log(`Appending ${key}: ${stringValue}`);
        formData.append(key, stringValue);
      }
    });

    // Add files
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }
    if (this.selectedCvFile) {
      formData.append('cv', this.selectedCvFile);
    }

    formData.append('_method', 'PATCH');

    console.log('Calling usersService.update with:', userId, formData);
    
    this.usersService.update(userId, formData).subscribe({
      next: (response) => {
        console.log('Update successful:', response);
        this.toast.show('User updated successfully', 'success');
        this.isEditing = false;
        this.selectedFile = null;
        this.selectedCvFile = null;
        // Refresh user data
        this.user$ = this.route.paramMap.pipe(
          switchMap((p) => this.usersService.get(+p.get('id')!))
        );
      },
      error: (err) => {
        console.log('Update error:', err);
        const errors: Record<string, string[]> = err.error?.errors || {};
        Object.values(errors).forEach((fieldMsgs) => {
          fieldMsgs.forEach((msg) => this.toast.show(msg, 'error', 5000));
        });
        if (!Object.keys(errors).length) {
          this.toast.show('Error updating user', 'error');
        }
      }
    });
  }

  onDelete(id: number) {
    if (!confirm('¿Eliminar usuario?')) return;
    this.usersService.delete(id).subscribe(() => {
      this.toast.show('Usuario eliminado', 'success');
      this.router.navigate(['/security/users']);
    });
  }
}




