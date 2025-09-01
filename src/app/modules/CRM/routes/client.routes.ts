import { Route } from "@angular/router";
import { ClientsComponent } from "../clients/clients.component";
import { UserFormComponent } from "../../Secutiry/users/components/user-form/user-form.component";
import { ClientFormComponent } from "../clients/components/client-form/client-form.component";
import { ClientDetailComponent } from "../clients/components/client-detail/client-detail.component";
import { FamilyMemberFormComponent } from "../clients/components/family-members/family-member-form/family-member-form.component";
import { ClientFamilyMembersComponent } from "../clients/components/family-members/client-family-members/client-family-members.component";
import { ClientInteractionFormComponent } from "../interactions/client-interaction-form/client-interaction-form.component";
import { ClientInteractionsComponent } from "../interactions/client-interactions/client-interactions.component";

export const clientRoutes: Route[] = [
  {
    path: 'clients',
    component: ClientsComponent,
    data: { permission: 'crm.clients.view' },
    children: [
      {
        path: 'create',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.store' },
      },
      {
        path: 'edit/:id',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.update' },
      },
    ],
  },
  {
    path: 'clients/:id',
    component: ClientDetailComponent,
    data: { permission: 'crm.clients.view' },
    children: [
      {
        path: ':id/edit',
        component: ClientFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.update' },
      },
    ],
  },
  {
    path: 'clients/:id/interactions',
    component: ClientInteractionsComponent,
    data: { permission: 'crm.interactions.view' },
    children: [
      {
        path: 'create',
        component: ClientInteractionFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.interactions.create' },
      },
      {
        path: ':interactionId/edit',
        component: ClientInteractionFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.interactions.update' },
      },
    ],
  },
  {
    path: 'clients/:id/family',
    component: ClientFamilyMembersComponent,
    data: { permission: 'crm.clients.view' },
    children: [
      {
        path: 'create',
        component: FamilyMemberFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.store' },
      },
      {
        path: ':memberId/edit',
        component: FamilyMemberFormComponent,
        outlet: 'modal',
        data: { permission: 'crm.clients.update' },
      },
    ],
  },
];