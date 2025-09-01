import { Component } from "lucide-angular";
import { PermissionsComponent } from "../permissions.component";
import { Route } from "@angular/router";


export const permissionRoutes:Route[] = [
    {
        path: 'permissions',
        component: PermissionsComponent,
        data: { permission: 'security.permissions.view' },
        children: [
            {
                path: 'create',
                component: PermissionsComponent,
                outlet: 'modal',
                data: { permission: 'security.permissions.store' }
            },
            {
                path: ':id/edit',
                component: PermissionsComponent,
                outlet: 'modal',
                data: { permission: 'security.permissions.update' }
            }
        ]
    }
]
