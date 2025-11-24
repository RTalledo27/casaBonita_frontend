import { Routes } from "@angular/router";
import { employeeROUTES } from "./employee.routes";

export const HR_ROUTES: Routes = [
  {
    path: '',
    children: [
      ...employeeROUTES,
      {
        path: 'commissions',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/commission-list/commission-list.component').then(m => m.CommissionListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/commission-form/commission-form.component').then(m => m.CommissionFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/commission-form/commission-form.component').then(m => m.CommissionFormComponent)
          },
          {
            path: 'view/:id',
            loadComponent: () => import('../components/commission-detail/commission-detail.component').then(m => m.CommissionDetailComponent)
          },
          {
            path: 'sales-detail',
            loadComponent: () => import('../components/sales-detail/sales-detail.component').then(m => m.SalesDetailComponent)
          },
          {
            path: 'advisor-commissions',
            loadComponent: () => import('../components/advisor-commissions/advisor-commissions.component').then(m => m.AdvisorCommissionsComponent)
          },
          {
            path: 'split-payment/:id',
            loadComponent: () => import('../components/commission-split-payment/commission-split-payment.component').then(m => m.CommissionSplitPaymentComponent)
          },
          {
            path: 'verification',
            loadComponent: () => import('../components/commission-verification/commission-verification.component').then(m => m.CommissionVerificationComponent)
          }
        ]
      },
      {
        path: 'commission-schemes',
        loadComponent: () => import('../components/commission-schemes/commission-schemes.component').then(m => m.CommissionSchemesComponent)
      },
      {
        path: 'teams',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/team-list/team-list.component').then(m => m.TeamListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/team-form/team-form.component').then(m => m.TeamFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/team-form/team-form.component').then(m => m.TeamFormComponent)
          },
          {
            path: 'view/:id',
            loadComponent: () => import('../components/team-detail/team-detail.component').then(m => m.TeamDetailComponent)
          }
        ]
      },
      {
        path: 'bonuses',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/bonus-list/bonus-list.component').then(m => m.BonusListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/bonus-form/bonus-form.component').then(m => m.BonusFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/bonus-form/bonus-form.component').then(m => m.BonusFormComponent)
          },
          {
            path: 'view/:id',
            loadComponent: () => import('../components/bonus-detail/bonus-detail.component').then(m => m.BonusDetailComponent)
          }
        ]
      },
      {
        path: 'bonus-types',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/bonus-type-list/bonus-type-list.component').then(m => m.BonusTypeListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/bonus-type-form/bonus-type-form.component').then(m => m.BonusTypeFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/bonus-type-form/bonus-type-form.component').then(m => m.BonusTypeFormComponent)
          }
        ]
      },
      {
        path: 'bonus-goals',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/bonus-goal-list/bonus-goal-list.component').then(m => m.BonusGoalListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/bonus-goal-form/bonus-goal-form.component').then(m => m.BonusGoalFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/bonus-goal-form/bonus-goal-form.component').then(m => m.BonusGoalFormComponent)
          }
        ]
      },
      {
        path: 'incentives',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/incentive-list/incentive-list.component').then(m => m.IncentiveListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/incentive-form/incentive-form.component').then(m => m.IncentiveFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/incentive-form/incentive-form.component').then(m => m.IncentiveFormComponent)
          }
        ]
      },
      {
        path: 'attendance',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('../components/attendance-form/attendance-form.component').then(m => m.AttendanceFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('../components/attendance-form/attendance-form.component').then(m => m.AttendanceFormComponent)
          }
        ]
      },
      {
        path: 'payroll',
        children: [
          {
            path: '',
            loadComponent: () => import('../components/payroll-list/payroll-list.component').then(m => m.PayrollListComponent)
          },
          {
            path: 'generate',
            loadComponent: () => import('../components/payroll-generate/payroll-generate.component').then(m => m.PayrollGenerateComponent)
          },
          {
            path: 'view/:id',
            loadComponent: () => import('../components/payroll-view/payroll-view.component').then(m => m.PayrollViewComponent)
          }
        ]
      },
      {
        path: 'tax-parameters',
        loadComponent: () => import('../components/tax-parameters/tax-parameters.component').then(m => m.TaxParametersComponent)
      }
    ]
  }
];