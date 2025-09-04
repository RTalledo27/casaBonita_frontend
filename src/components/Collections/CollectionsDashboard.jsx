import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Progress
} from '../ui';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  RefreshCw
} from 'lucide-react';
import { collectionsApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CollectionsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [overdueSchedules, setOverdueSchedules] = useState([]);
  const [collectionsSummary, setCollectionsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, upcomingRes, overdueRes, summaryRes] = await Promise.all([
        collectionsApi.getDashboardMetrics(),
        collectionsApi.getUpcomingSchedules({ days: 30, limit: 10 }),
        collectionsApi.getOverdueSchedules({ limit: 10 }),
        collectionsApi.getCollectionsSummary()
      ]);

      setDashboardData(metricsRes.data);
      setUpcomingSchedules(upcomingRes.data);
      setOverdueSchedules(overdueRes.data);
      setCollectionsSummary(summaryRes.data);
    } catch (err) {
      setError('Error cargando datos del dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateBulkSchedules = async () => {
    try {
      setRefreshing(true);
      await collectionsApi.generateBulkSchedules({
        payment_type: 'installments',
        installments: 24,
        start_date: new Date().toISOString().split('T')[0]
      });
      await loadDashboardData();
      alert('Cronogramas generados exitosamente');
    } catch (err) {
      alert('Error generando cronogramas: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { schedules, accounts_receivable, payments, contracts, generation_stats } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Cobranzas</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de cronogramas de pagos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={generateBulkSchedules}
            disabled={refreshing}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generar Cronogramas
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cronogramas Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules?.total_schedules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(schedules?.total_amount || 0)} en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {schedules?.pending_schedules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(schedules?.pending_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {schedules?.overdue_schedules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(schedules?.overdue_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {schedules?.paid_schedules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(schedules?.paid_amount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de contratos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cobertura de Cronogramas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Contratos con cronogramas</span>
                <span>{contracts?.contracts_with_schedules || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Contratos sin cronogramas</span>
                <span>{contracts?.contracts_without_schedules || 0}</span>
              </div>
              <Progress 
                value={contracts?.schedule_coverage_percentage || 0} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(contracts?.schedule_coverage_percentage || 0)}% de cobertura
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatCurrency(payments?.this_month_amount || 0)}
              </div>
              <div className="flex items-center text-sm">
                {payments?.monthly_growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={payments?.monthly_growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(payments?.monthly_growth || 0).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">vs mes anterior</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {payments?.this_month_count || 0} pagos este mes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cuentas por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatCurrency(accounts_receivable?.pending_ar_amount || 0)}
              </div>
              <div className="flex justify-between text-sm">
                <span>Pendientes</span>
                <span>{accounts_receivable?.pending_ar || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pagadas</span>
                <span>{accounts_receivable?.paid_ar || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para cronogramas */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos a Vencer</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Cronogramas Próximos a Vencer (30 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSchedules.map((schedule) => (
                    <TableRow key={schedule.schedule_id}>
                      <TableCell>{schedule.contract_number}</TableCell>
                      <TableCell>{schedule.client_name}</TableCell>
                      <TableCell>{schedule.lot_info}</TableCell>
                      <TableCell>{formatDate(schedule.due_date)}</TableCell>
                      <TableCell>{formatCurrency(schedule.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {schedule.days_until_due} días
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Cronogramas Vencidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Días Vencido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueSchedules.map((schedule) => (
                    <TableRow key={schedule.schedule_id}>
                      <TableCell>{schedule.contract_number}</TableCell>
                      <TableCell>{schedule.client_name}</TableCell>
                      <TableCell>{schedule.lot_info}</TableCell>
                      <TableCell>{formatDate(schedule.due_date)}</TableCell>
                      <TableCell>{formatCurrency(schedule.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {schedule.days_overdue} días
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Cobranzas</CardTitle>
            </CardHeader>
            <CardContent>
              {collectionsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Período Actual</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(collectionsSummary.period.start_date)} - {formatDate(collectionsSummary.period.end_date)}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Pagos Recibidos:</span>
                        <span className="font-medium">
                          {formatCurrency(collectionsSummary.payments_received)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cronogramas por Vencer:</span>
                        <span className="font-medium">
                          {formatCurrency(collectionsSummary.schedules_due)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cronogramas Pagados:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(collectionsSummary.schedules_paid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monto Pendiente:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(collectionsSummary.pending_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Eficiencia de Cobranza</h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {collectionsSummary.collection_efficiency.toFixed(1)}%
                    </div>
                    <Progress value={collectionsSummary.collection_efficiency} />
                    <p className="text-xs text-muted-foreground">
                      Porcentaje de cronogramas cobrados en el período
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollectionsDashboard;