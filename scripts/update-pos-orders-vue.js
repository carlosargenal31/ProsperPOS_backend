const fs = require('fs');
const path = require('path');

const vueContent = `<template>
  <layout-header></layout-header>
  <layout-sidebar></layout-sidebar>
  <div class="page-wrapper">
    <div class="content">
      <div class="page-header">
        <div class="add-item d-flex">
          <div class="page-title">
            <h4>Registro de Facturas</h4>
            <h6>Todas las facturas de ventas registradas</h6>
          </div>
        </div>
        <ul class="table-top-head">
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Actualizar" @click="loadInvoices">
              <i class="ti ti-refresh"></i>
            </a>
          </li>
          <li>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Colapsar" id="collapse-header" @click="toggleHeader">
              <i class="ti ti-chevron-up"></i>
            </a>
          </li>
        </ul>
        <div class="page-btn">
          <router-link to="/pos-invoice" class="btn btn-primary btn-md d-inline-flex align-items-center">
            <vue-feather type="plus-circle" class="me-2"></vue-feather> Nueva Factura
          </router-link>
        </div>
      </div>

      <div class="row mb-4" v-if="stats">
        <div class="col-md-3">
          <div class="card bg-primary-light">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <p class="text-muted mb-1">Total Facturas</p>
                  <h3 class="mb-0">{{ stats.total_invoices }}</h3>
                </div>
                <div class="avatar avatar-lg bg-primary">
                  <i class="ti ti-file-invoice fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success-light">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <p class="text-muted mb-1">Total Ventas</p>
                  <h3 class="mb-0">L {{ formatMoney(stats.total_sales) }}</h3>
                </div>
                <div class="avatar avatar-lg bg-success">
                  <i class="ti ti-cash fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success-light">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <p class="text-muted mb-1">Cobrado</p>
                  <h3 class="mb-0">L {{ formatMoney(stats.total_collected) }}</h3>
                </div>
                <div class="avatar avatar-lg bg-success">
                  <i class="ti ti-check fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning-light">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <p class="text-muted mb-1">Pendiente</p>
                  <h3 class="mb-0">L {{ formatMoney(stats.total_pending) }}</h3>
                </div>
                <div class="avatar avatar-lg bg-warning">
                  <i class="ti ti-clock fs-24"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-list-card">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div class="search-set">
            <div class="search-input">
              <a href="javascript:void(0);" class="btn-searchset">
                <i class="ti ti-search fs-14 feather-search"></i>
              </a>
              <input type="search" class="form-control form-control-sm" placeholder="Buscar..." v-model="searchQuery" @input="onSearch" />
            </div>
          </div>
          <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
            <div class="dropdown me-2">
              <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                {{ selectedStatus || 'Todos los Estados' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end p-3">
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByStatus('')">Todos</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByStatus('Completed')">Completadas</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByStatus('Pending')">Pendientes</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByStatus('Returned')">Devueltas</a></li>
              </ul>
            </div>
            <div class="dropdown me-2">
              <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                {{ selectedPaymentStatus || 'Estado de Pago' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end p-3">
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByPaymentStatus('')">Todos</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByPaymentStatus('Paid')">Pagadas</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByPaymentStatus('Unpaid')">Sin Pagar</a></li>
                <li><a href="javascript:void(0);" class="dropdown-item rounded-1" @click="filterByPaymentStatus('Partial')">Parcial</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
          </div>
          <div v-else class="table-responsive">
            <table class="table datanew">
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Saldo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoices" :key="inv.id">
                  <td>
                    <span class="fw-bold text-primary">{{ inv.invoice_number }}</span><br/>
                    <small class="text-muted">{{ inv.document_type }}</small>
                  </td>
                  <td>
                    <span class="fw-medium">{{ inv.customer_name }}</span><br/>
                    <small class="text-muted" v-if="inv.customer_id_number && inv.customer_id_number !== '0'">RTN: {{ inv.customer_id_number }}</small>
                  </td>
                  <td>{{ formatDate(inv.invoice_date) }}</td>
                  <td>{{ inv.seller_name }}</td>
                  <td><span :class="getStatusClass(inv.status)">{{ getStatusText(inv.status) }}</span></td>
                  <td><span :class="getPaymentStatusClass(inv.payment_status)"><i class="ti ti-point-filled me-1"></i>{{ getPaymentStatusText(inv.payment_status) }}</span></td>
                  <td class="fw-bold">L {{ formatMoney(inv.total_amount) }}</td>
                  <td :class="inv.balance_amount > 0 ? 'text-danger fw-bold' : 'text-success'">L {{ formatMoney(inv.balance_amount) }}</td>
                  <td>
                    <div class="dropdown">
                      <button class="btn btn-sm btn-white dropdown-toggle" data-bs-toggle="dropdown"><i class="fa fa-ellipsis-v"></i></button>
                      <ul class="dropdown-menu">
                        <li><a class="dropdown-item" @click="viewInvoice(inv)"><i class="ti ti-eye me-2"></i>Ver</a></li>
                        <li><a class="dropdown-item" @click="printInvoice(inv)"><i class="ti ti-printer me-2"></i>Imprimir</a></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
      <p class="mb-0 text-gray-9">{{ new Date().getFullYear() }} &copy; ProsperPOS. All Rights Reserved</p>
      <p>Diseñado & Desarrollado Por; <a href="javascript:void(0);" class="text-primary">Carlos Argeñal</a></p>
    </div>
  </div>
</template>

<script>
import api from '@/api/config';
import Swal from 'sweetalert2';

export default {
  data() {
    return {
      invoices: [],
      stats: null,
      loading: false,
      searchQuery: '',
      selectedStatus: '',
      selectedPaymentStatus: '',
      searchTimeout: null
    };
  },
  mounted() {
    this.loadStats();
    this.loadInvoices();
  },
  methods: {
    async loadInvoices() {
      this.loading = true;
      try {
        const params = { page: 1, limit: 100, search: this.searchQuery, status: this.selectedStatus, payment_status: this.selectedPaymentStatus };
        const response = await api.get('/invoices-sales', { params });
        if (response.data.success) this.invoices = response.data.data;
      } catch (error) {
        console.error('Error loading invoices:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las facturas' });
      } finally {
        this.loading = false;
      }
    },
    async loadStats() {
      try {
        const response = await api.get('/invoices-sales/stats');
        if (response.data.success) this.stats = response.data.data;
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },
    onSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.loadInvoices(), 500);
    },
    filterByStatus(status) {
      this.selectedStatus = status;
      this.loadInvoices();
    },
    filterByPaymentStatus(status) {
      this.selectedPaymentStatus = status;
      this.loadInvoices();
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },
    formatMoney(amount) {
      if (!amount) return '0.00';
      return parseFloat(amount).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    getStatusClass(status) {
      const classes = { 'Completed': 'badge badge-success', 'Pending': 'badge badge-warning', 'Returned': 'badge badge-danger', 'Cancelled': 'badge badge-secondary' };
      return classes[status] || 'badge badge-secondary';
    },
    getStatusText(status) {
      const texts = { 'Completed': 'Completada', 'Pending': 'Pendiente', 'Returned': 'Devuelta', 'Cancelled': 'Cancelada' };
      return texts[status] || status;
    },
    getPaymentStatusClass(status) {
      const classes = { 'Paid': 'badge badge-soft-success shadow-none badge-xs', 'Unpaid': 'badge badge-soft-danger shadow-none badge-xs', 'Partial': 'badge badge-soft-warning shadow-none badge-xs', 'Overdue': 'badge badge-soft-danger shadow-none badge-xs' };
      return classes[status] || 'badge badge-soft-secondary shadow-none badge-xs';
    },
    getPaymentStatusText(status) {
      const texts = { 'Paid': 'Pagada', 'Unpaid': 'Sin Pagar', 'Partial': 'Pago Parcial', 'Overdue': 'Vencida' };
      return texts[status] || status;
    },
    viewInvoice(invoice) {
      Swal.fire({
        title: 'Detalles de Factura',
        html: \`<div class="text-start"><p><strong>Número:</strong> \${invoice.invoice_number}</p><p><strong>Cliente:</strong> \${invoice.customer_name}</p><p><strong>Fecha:</strong> \${this.formatDate(invoice.invoice_date)}</p><p><strong>Vendedor:</strong> \${invoice.seller_name}</p><p><strong>Neto:</strong> L \${this.formatMoney(invoice.net_amount)}</p><p><strong>Impuesto:</strong> L \${this.formatMoney(invoice.tax_amount)}</p><p><strong>Descuentos:</strong> L \${this.formatMoney(invoice.discount_amount)}</p><p><strong>Recargos:</strong> L \${this.formatMoney(invoice.surcharge_amount)}</p><p><strong>Total:</strong> L \${this.formatMoney(invoice.total_amount)}</p><p><strong>Pagado:</strong> L \${this.formatMoney(invoice.paid_amount)}</p><p><strong>Saldo:</strong> L \${this.formatMoney(invoice.balance_amount)}</p></div>\`,
        width: 600,
        confirmButtonText: 'Cerrar'
      });
    },
    printInvoice(invoice) {
      Swal.fire({ icon: 'info', title: 'Imprimir Factura', text: \`Imprimiendo factura \${invoice.invoice_number}...\`, timer: 2000, showConfirmButton: false });
    },
    toggleHeader() {
      document.getElementById("collapse-header").classList.toggle("active");
      document.body.classList.toggle("header-collapse");
    }
  }
};
</script>

<style scoped>
.bg-primary-light { background-color: #e3f2fd; }
.bg-success-light { background-color: #e8f5e9; }
.bg-warning-light { background-color: #fff3e0; }
.avatar-lg { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
</style>
`;

const outputPath = path.join(__dirname, '../../template/src/views/pages/sales/pos-orders.vue');
fs.writeFileSync(outputPath, vueContent, 'utf8');
console.log('✓ pos-orders.vue actualizado exitosamente');
