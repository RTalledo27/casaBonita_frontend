import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DollarSign, LucideAngularModule, TrendingDown, TrendingUp } from 'lucide-angular';
import { BudgetService } from '../../../finance/services/budget.service';
import { CollectionService } from '../../../collections/services/collection.service';

@Component({
  selector: 'app-finance-widget',
  imports: [CommonModule, TranslateModule, LucideAngularModule],
  templateUrl: './finance-widget.component.html',
  styleUrl: './finance-widget.component.scss',
})
export class FinanceWidgetComponent {
  activeBudgets = 0;
  pendingAmount = 0;
  overdueCount = 0;

  dollarSign = DollarSign;
  trendingUp = TrendingUp;
  trendingDown = TrendingDown;

  constructor(
    private budgetService: BudgetService,
    private collectionService: CollectionService
  ) {}

  ngOnInit() {
    this.loadFinanceData();
  }

  loadFinanceData() {
    // Cargar presupuestos activos
    this.budgetService.list().subscribe((budgets) => {
      this.activeBudgets = budgets.filter((b) => b.status === 'active').length;
    });

    // Cargar cuentas por cobrar
    this.collectionService.listAccountsReceivable().subscribe((accounts) => {
      this.pendingAmount = accounts
        .filter((a) => a.status === 'pending' || a.status === 'partial')
        .reduce((sum, a) => sum + (a.balance || a.amount), 0);
    });

    // Cargar pagos vencidos
    this.collectionService.getOverdueAccounts().subscribe((overdue) => {
      this.overdueCount = overdue.length;
    });
  }
}
