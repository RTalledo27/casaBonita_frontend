import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FamilyMember } from '../../../../models/family-member';
import { FamilyMembersService } from '../../../../services/family-members.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-family-members',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './client-family-members.component.html',
  styleUrl: './client-family-members.component.scss',
})
export class ClientFamilyMembersComponent {
  members: FamilyMember[] = [];
  filteredMembers: FamilyMember[] = [];
  searchTerm = '';
  isModalOpen = false;
  clientId: number;

  constructor(
    private route: ActivatedRoute,
    private service: FamilyMembersService,
    private router: Router
  ) {
    this.clientId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.service.list(this.clientId).subscribe((res) => {
      this.members = res;
      this.applyFilter();
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredMembers = [...this.members];
      return;
    }
    this.filteredMembers = this.members.filter(
      (m) =>
        m.first_name?.toLowerCase().includes(term) ||
        m.last_name?.toLowerCase().includes(term) ||
        m.dni?.toLowerCase().includes(term) ||
        m.doc_number?.toLowerCase().includes(term) ||
        m.relation?.toLowerCase().includes(term) ||
        m.relationship?.toLowerCase().includes(term)
    );
  }

  get membersWithDni(): number {
    return this.members.filter((m) => m.dni || m.doc_number).length;
  }

  get membersWithoutDni(): number {
    return this.members.filter((m) => !m.dni && !m.doc_number).length;
  }

  get uniqueRelations(): number {
    const rels = new Set(
      this.members.map((m) => (m.relation || m.relationship || '').toLowerCase()).filter(Boolean)
    );
    return rels.size;
  }

  trackMember(_: number, fm: FamilyMember): number {
    return fm.member_id;
  }

  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }

  onEdit(fm: FamilyMember) {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: ['edit', fm.member_id] } }], {
      relativeTo: this.route,
    });
  }

  onDelete(fm: FamilyMember) {
    if (!confirm(`¿Eliminar a ${fm.first_name} ${fm.last_name}?`)) return;
    this.service.delete(fm.member_id).subscribe(() => this.loadMembers());
  }

  onModalActivate() {
    this.loadMembers();
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  onModalBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.isModalOpen = false;
      this.router.navigate([{ outlets: { modal: null } }], {
        relativeTo: this.route,
      });
    }
  }
}
