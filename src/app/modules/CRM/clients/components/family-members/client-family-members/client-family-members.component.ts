import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { FamilyMember } from '../../../../models/family-member';
import { ColumnDef, SharedTableComponent } from '../../../../../../shared/components/shared-table/shared-table.component';
import { FamilyMembersService } from '../../../../services/family-members.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-family-members',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslateModule,
    LucideAngularModule,
    SharedTableComponent,
  ],
  templateUrl: './client-family-members.component.html',
  styleUrl: './client-family-members.component.scss',
})
export class ClientFamilyMembersComponent {
  members: FamilyMember[] = [];
  columns: ColumnDef[] = [
    { field: 'first_name', header: 'First Name' },
    { field: 'last_name', header: 'Last Name' },
    { field: 'dni', header: 'DNI' },
    { field: 'relation', header: 'Relation' },
  ];
  isModalOpen = false;
  plus = Plus;
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
    this.service.list(this.clientId).subscribe((res) => (this.members = res));
  }

  onCreate() {
    this.isModalOpen = true;
    this.router.navigate([{ outlets: { modal: 'create' } }], {
      relativeTo: this.route,
    });
  }

  onModalActivate() {
    this.loadMembers();
  }

  onModalDeactivate() {
    this.isModalOpen = false;
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
