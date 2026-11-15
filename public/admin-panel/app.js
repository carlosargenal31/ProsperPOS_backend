/* ProsperPOS · Panel del propietario (empresas, suscripciones y pagos) */
(function () {
  const { createApp } = Vue;
  const API = '/api/admin';
  const TOKEN_KEY = 'pp_admin_token';

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
  const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

  async function api(method, path, body) {
    const isForm = body instanceof FormData;
    const headers = isForm ? {} : { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(API + path, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
    let data = null;
    try { data = await res.json(); } catch {}
    if (res.status === 401 && path !== '/auth/login') {
      setToken(null);
      window.dispatchEvent(new Event('pp-logout'));
    }
    if (!res.ok || (data && data.success === false)) {
      throw new Error((data && data.message) || `Error ${res.status}`);
    }
    return data ? data.data : null;
  }

  const money = (n, cur = 'HNL') => `${cur === 'HNL' ? 'L' : cur} ${Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = (d) => {
    if (!d) return '—';
    const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
  };
  const datetime = (d) => (d ? new Date(d).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const STATUS = { trial: 'Prueba', active: 'Activa', suspended: 'Suspendida', cancelled: 'Cancelada' };
  const KIND = { pos: 'POS', store: 'Tienda', other: 'Otro' };
  const ROOT_DOMAIN = 'myprosperpos.com';

  const emptyTenant = () => ({
    mode: 'new', slug: '', name: '', legal_name: '', rtn: '', business_type: '', contact_name: '',
    contact_email: '', contact_phone: '', plan_id: '', monthly_price: '', status: 'trial', trial_days: 15,
    existing_db: '', paid_until: '',
    admin: { first_name: '', last_name: '', email: '', password: '' },
    pos_host: '', store_host: ''
  });

  createApp({
    data() {
      return {
        token: getToken(), me: null, view: 'dashboard',
        login: { email: '', password: '' }, loginError: '', loading: false,
        dashboard: null, tenants: [], plans: [], payments: [], audit: [], filter: '',
        current: null, editing: null,
        modal: null, form: emptyTenant(), payForm: null, domainForm: { host: '', kind: 'pos' },
        planForm: null, resetForm: null, pwdForm: null,
        toast: null, STATUS, KIND, ROOT_DOMAIN
      };
    },
    computed: {
      filteredTenants() {
        const q = this.filter.trim().toLowerCase();
        if (!q) return this.tenants;
        return this.tenants.filter(t => [t.name, t.slug, t.rtn, t.contact_name, t.contact_email, ...(t.domains || []).map(d => d.host)]
          .filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
      }
    },
    mounted() {
      window.addEventListener('pp-logout', () => { this.token = null; this.me = null; });
      if (this.token) this.boot();
    },
    methods: {
      money, date, datetime,
      notify(message, type = 'success') {
        this.toast = { message, type };
        clearTimeout(this._t);
        this._t = setTimeout(() => { this.toast = null; }, 4000);
      },
      async run(fn) {
        this.loading = true;
        try { return await fn(); } catch (e) { this.notify(e.message, 'danger'); } finally { this.loading = false; }
      },
      async doLogin() {
        this.loginError = '';
        this.loading = true;
        try {
          const data = await api('POST', '/auth/login', this.login);
          setToken(data.token);
          this.token = data.token;
          this.login.password = '';
          await this.boot();
        } catch (e) { this.loginError = e.message; } finally { this.loading = false; }
      },
      logout() { setToken(null); this.token = null; this.me = null; },
      async boot() {
        await this.run(async () => {
          this.me = await api('GET', '/auth/me');
          await Promise.all([this.loadDashboard(), this.loadTenants(), this.loadPlans()]);
        });
      },
      go(view) {
        this.view = view;
        this.current = null;
        if (view === 'dashboard') this.run(this.loadDashboard);
        if (view === 'tenants') this.run(this.loadTenants);
        if (view === 'plans') this.run(this.loadPlans);
        if (view === 'payments') this.run(async () => { this.payments = await api('GET', '/payments'); });
        if (view === 'audit') this.run(async () => { this.audit = await api('GET', '/audit'); });
      },
      async loadDashboard() { this.dashboard = await api('GET', '/dashboard'); },
      async loadTenants() { this.tenants = await api('GET', '/tenants'); },
      async loadPlans() { this.plans = await api('GET', '/plans'); },
      async openTenant(id) {
        await this.run(async () => {
          this.current = await api('GET', `/tenants/${id}`);
          this.editing = null;
          this.view = 'tenant';
        });
      },

      // ---- Crear empresa ----
      newTenant() {
        this.form = emptyTenant();
        if (this.plans.length) this.form.plan_id = this.plans[0].id;
        this.modal = 'tenant';
      },
      slugify() {
        if (this.form._slugTouched) return;
        this.form.slug = this.form.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
        this.form.pos_host = this.form.slug ? `${this.form.slug}.${ROOT_DOMAIN}` : '';
      },
      async createTenant() {
        const f = this.form;
        const domains = [];
        if (f.pos_host) domains.push({ host: f.pos_host, kind: 'pos' });
        if (f.store_host) domains.push({ host: f.store_host, kind: 'store' });
        const body = {
          slug: f.slug, name: f.name, legal_name: f.legal_name, rtn: f.rtn, business_type: f.business_type,
          contact_name: f.contact_name, contact_email: f.contact_email, contact_phone: f.contact_phone,
          plan_id: f.plan_id || null, monthly_price: f.monthly_price === '' ? null : Number(f.monthly_price),
          domains
        };
        if (f.mode === 'dump') {
          const file = this.$refs.dumpFile && this.$refs.dumpFile.files[0];
          if (!file) { this.notify('Seleccione el archivo .sql', 'danger'); return; }
          const fd = new FormData();
          Object.entries(body).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            fd.append(k, k === 'domains' ? JSON.stringify(v) : v);
          });
          fd.append('status', 'active');
          if (f.paid_until) fd.append('paid_until', f.paid_until);
          fd.append('dump', file);
          await this.run(async () => {
            this.notify('Importando respaldo... puede tardar unos minutos', 'info');
            const r = await api('POST', '/tenants/import', fd);
            this.modal = null;
            this.notify(`Empresa importada (${r.db_name})`);
            await this.loadTenants();
            await this.openTenant(r.id);
          });
          return;
        }
        if (f.mode === 'existing') {
          Object.assign(body, { existing_db: f.existing_db, status: 'active', paid_until: f.paid_until || null });
        } else {
          Object.assign(body, { status: f.status, trial_days: Number(f.trial_days || 0), admin: f.admin });
        }
        await this.run(async () => {
          const r = await api('POST', '/tenants', body);
          this.modal = null;
          this.notify(`Empresa creada (${r.db_name})`);
          await this.loadTenants();
          await this.openTenant(r.id);
        });
      },

      // ---- Editar empresa ----
      startEdit() {
        const t = this.current;
        this.editing = {
          name: t.name, legal_name: t.legal_name, rtn: t.rtn, business_type: t.business_type,
          contact_name: t.contact_name, contact_email: t.contact_email, contact_phone: t.contact_phone,
          plan_id: t.plan_id || '', monthly_price: t.monthly_price ?? '', status: t.status,
          trial_ends_at: t.trial_ends_at || '', paid_until: t.paid_until || '', grace_days: t.grace_days, notes: t.notes
        };
      },
      async saveEdit() {
        await this.run(async () => {
          await api('PUT', `/tenants/${this.current.id}`, this.editing);
          this.notify('Empresa actualizada');
          await this.openTenant(this.current.id);
        });
      },
      async setStatus(status) {
        const label = STATUS[status];
        if (!confirm(`¿Cambiar el estado de "${this.current.name}" a ${label}?`)) return;
        await this.run(async () => {
          await api('PUT', `/tenants/${this.current.id}`, { status });
          this.notify(`Estado: ${label}`);
          await this.openTenant(this.current.id);
        });
      },

      // ---- Dominios ----
      async addDomain() {
        await this.run(async () => {
          await api('POST', `/tenants/${this.current.id}/domains`, this.domainForm);
          this.domainForm = { host: '', kind: 'pos' };
          this.notify('Dominio agregado');
          await this.openTenant(this.current.id);
        });
      },
      async removeDomain(d) {
        if (!confirm(`¿Quitar el dominio ${d.host}? La empresa dejará de abrir desde esa dirección.`)) return;
        await this.run(async () => {
          await api('DELETE', `/tenants/${this.current.id}/domains/${d.id}`);
          this.notify('Dominio eliminado');
          await this.openTenant(this.current.id);
        });
      },

      // ---- Pagos ----
      newPayment() {
        this.payForm = { amount: this.current.price || '', months: 1, method: 'transferencia', reference: '', notes: '' };
        this.modal = 'payment';
      },
      async savePayment() {
        await this.run(async () => {
          const r = await api('POST', `/tenants/${this.current.id}/payments`, this.payForm);
          this.modal = null;
          this.notify(`Pago registrado: activa hasta ${date(r.period_end)}`);
          await this.openTenant(this.current.id);
        });
      },
      async deletePayment(p) {
        if (!confirm(`¿Anular el pago de ${money(p.amount, p.currency)} del ${date(p.created_at)}?`)) return;
        await this.run(async () => {
          await api('DELETE', `/payments/${p.id}`);
          this.notify('Pago anulado');
          await this.openTenant(this.current.id);
        });
      },

      // ---- Soporte ----
      openReset() { this.resetForm = { email: '', password: '' }; this.modal = 'reset'; },
      async saveReset() {
        await this.run(async () => {
          await api('POST', `/tenants/${this.current.id}/reset-user-password`, this.resetForm);
          this.modal = null;
          this.notify('Contraseña restablecida');
        });
      },

      // ---- Planes ----
      editPlan(p) {
        this.planForm = p ? { ...p } : { name: '', description: '', price_monthly: 0, currency: 'HNL', max_users: '', max_branches: '', includes_ecommerce: true, is_active: true };
        this.modal = 'plan';
      },
      async savePlan() {
        const { id, tenants, created_at, updated_at, ...body } = this.planForm;
        await this.run(async () => {
          await api(id ? 'PUT' : 'POST', id ? `/plans/${id}` : '/plans', body);
          this.modal = null;
          this.notify('Plan guardado');
          await this.loadPlans();
        });
      },

      // ---- Cuenta ----
      openPwd() { this.pwdForm = { current_password: '', new_password: '' }; this.modal = 'pwd'; },
      async savePwd() {
        await this.run(async () => {
          await api('PUT', '/auth/password', this.pwdForm);
          this.modal = null;
          this.notify('Contraseña actualizada');
        });
      }
    },
    template: `
<div>
  <!-- Inicio de sesión -->
  <div v-if="!token || !me" class="pp-login">
    <div class="card shadow-lg">
      <div class="card-body p-4">
        <div class="pp-brand fs-3 mb-1">Prosper<span>POS</span></div>
        <p class="pp-muted mb-4">Panel del propietario</p>
        <form @submit.prevent="doLogin">
          <div class="mb-3"><label class="form-label">Correo</label><input v-model="login.email" type="email" class="form-control" autocomplete="username" required></div>
          <div class="mb-3"><label class="form-label">Contraseña</label><input v-model="login.password" type="password" class="form-control" autocomplete="current-password" required></div>
          <div v-if="loginError" class="alert alert-danger py-2 small">{{ loginError }}</div>
          <button class="btn btn-pp w-100" :disabled="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="pp-shell">
    <nav class="pp-side">
      <div class="pp-brand">Prosper<span>POS</span></div>
      <a :class="{active: view==='dashboard'}" @click="go('dashboard')">Resumen</a>
      <a :class="{active: view==='tenants' || view==='tenant'}" @click="go('tenants')">Empresas</a>
      <a :class="{active: view==='payments'}" @click="go('payments')">Pagos</a>
      <a :class="{active: view==='plans'}" @click="go('plans')">Planes</a>
      <a :class="{active: view==='audit'}" @click="go('audit')">Bitácora</a>
      <div class="pp-user">
        {{ me.email }}<br>
        <a class="p-0 d-inline" @click="openPwd">Cambiar contraseña</a> ·
        <a class="p-0 d-inline" @click="logout">Salir</a>
      </div>
    </nav>

    <main class="pp-main">
      <!-- Resumen -->
      <template v-if="view==='dashboard' && dashboard">
        <div class="pp-top"><h1>Resumen</h1><button class="btn btn-pp" @click="newTenant">+ Nueva empresa</button></div>
        <div v-if="!dashboard.template_ready" class="alert alert-warning">Falta la plantilla de base de datos: todavía no se pueden crear empresas nuevas desde cero (sí registrar bases existentes).</div>
        <div class="row g-3 mb-3">
          <div class="col-6 col-lg-3"><div class="pp-card pp-kpi"><div class="label">Empresas</div><div class="value">{{ dashboard.total }}</div></div></div>
          <div class="col-6 col-lg-3"><div class="pp-card pp-kpi"><div class="label">Activas / en prueba</div><div class="value">{{ dashboard.by_status.active || 0 }} / {{ dashboard.by_status.trial || 0 }}</div></div></div>
          <div class="col-6 col-lg-3"><div class="pp-card pp-kpi"><div class="label">Ingreso mensual (activas)</div><div class="value">{{ money(dashboard.mrr) }}</div></div></div>
          <div class="col-6 col-lg-3"><div class="pp-card pp-kpi"><div class="label">Cobrado este mes</div><div class="value">{{ money(dashboard.payments_month.total) }}</div></div></div>
        </div>
        <div class="pp-card">
          <h2 class="h6 mb-3">Requieren atención</h2>
          <div v-if="!dashboard.attention.length" class="pp-muted">Todo al día.</div>
          <table v-else class="table mb-0">
            <thead><tr><th>Empresa</th><th>Estado</th><th>Detalle</th></tr></thead>
            <tbody><tr v-for="t in dashboard.attention" :key="t.id" style="cursor:pointer" @click="openTenant(t.id)">
              <td>{{ t.name }}</td><td><span class="pp-badge" :class="t.status">{{ STATUS[t.status] }}</span></td>
              <td class="pp-access" :class="t.access">{{ t.access_message || ('Prueba termina ' + date(t.trial_ends_at)) }}</td>
            </tr></tbody>
          </table>
        </div>
      </template>

      <!-- Empresas -->
      <template v-if="view==='tenants'">
        <div class="pp-top"><h1>Empresas</h1>
          <div class="d-flex gap-2"><input v-model="filter" class="form-control" placeholder="Buscar..." style="max-width:240px"><button class="btn btn-pp text-nowrap" @click="newTenant">+ Nueva empresa</button></div>
        </div>
        <div class="pp-card p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead><tr><th>Empresa</th><th>Dirección</th><th>Plan</th><th>Estado</th><th>Vigencia</th><th class="text-end">Precio</th></tr></thead>
            <tbody>
              <tr v-for="t in filteredTenants" :key="t.id" style="cursor:pointer" @click="openTenant(t.id)">
                <td><strong>{{ t.name }}</strong><div class="pp-muted small">{{ t.slug }}</div></td>
                <td class="pp-domain">{{ (t.domains.find(d => d.kind==='pos') || t.domains[0] || {}).host || '—' }}</td>
                <td>{{ t.plan_name || '—' }}</td>
                <td><span class="pp-badge" :class="t.status">{{ STATUS[t.status] }}</span></td>
                <td class="pp-access" :class="t.access">{{ t.status==='trial' ? 'Prueba hasta ' + date(t.trial_ends_at) : (t.paid_until ? 'Pagada hasta ' + date(t.paid_until) : '—') }}</td>
                <td class="text-end">{{ money(t.price) }}</td>
              </tr>
              <tr v-if="!filteredTenants.length"><td colspan="6" class="text-center pp-muted py-4">No hay empresas</td></tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Detalle de empresa -->
      <template v-if="view==='tenant' && current">
        <div class="pp-top">
          <div><a class="pp-muted small" style="cursor:pointer" @click="go('tenants')">← Empresas</a><h1>{{ current.name }}</h1></div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-pp" @click="newPayment">Registrar pago</button>
            <button v-if="current.status!=='suspended'" class="btn btn-outline-danger" @click="setStatus('suspended')">Suspender</button>
            <button v-else class="btn btn-outline-success" @click="setStatus('active')">Reactivar</button>
          </div>
        </div>
        <div v-if="current.access_message" class="alert" :class="current.access==='blocked' ? 'alert-danger' : 'alert-warning'">{{ current.access_message }}</div>

        <div class="row g-3">
          <div class="col-lg-7">
            <div class="pp-card mb-3">
              <div class="d-flex justify-content-between mb-2"><h2 class="h6 mb-0">Datos</h2><button v-if="!editing" class="btn btn-sm btn-outline-secondary" @click="startEdit">Editar</button></div>
              <dl v-if="!editing" class="row mb-0 small">
                <dt class="col-sm-4">Identificador</dt><dd class="col-sm-8">{{ current.slug }} <span class="pp-muted">(base {{ current.db_name }})</span></dd>
                <dt class="col-sm-4">Razón social</dt><dd class="col-sm-8">{{ current.legal_name || '—' }}</dd>
                <dt class="col-sm-4">RTN</dt><dd class="col-sm-8">{{ current.rtn || '—' }}</dd>
                <dt class="col-sm-4">Giro</dt><dd class="col-sm-8">{{ current.business_type || '—' }}</dd>
                <dt class="col-sm-4">Contacto</dt><dd class="col-sm-8">{{ current.contact_name || '—' }} · {{ current.contact_email || '' }} · {{ current.contact_phone || '' }}</dd>
                <dt class="col-sm-4">Plan</dt><dd class="col-sm-8">{{ current.plan_name || '—' }} · {{ money(current.price) }}/mes</dd>
                <dt class="col-sm-4">Estado</dt><dd class="col-sm-8"><span class="pp-badge" :class="current.status">{{ STATUS[current.status] }}</span></dd>
                <dt class="col-sm-4">Prueba hasta</dt><dd class="col-sm-8">{{ date(current.trial_ends_at) }}</dd>
                <dt class="col-sm-4">Pagada hasta</dt><dd class="col-sm-8">{{ date(current.paid_until) }} <span class="pp-muted">(gracia {{ current.grace_days }} días)</span></dd>
                <dt class="col-sm-4">Notas</dt><dd class="col-sm-8">{{ current.notes || '—' }}</dd>
              </dl>
              <form v-else @submit.prevent="saveEdit" class="row g-2">
                <div class="col-md-6"><label class="form-label small">Nombre comercial</label><input v-model="editing.name" class="form-control form-control-sm" required></div>
                <div class="col-md-6"><label class="form-label small">Razón social</label><input v-model="editing.legal_name" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">RTN</label><input v-model="editing.rtn" class="form-control form-control-sm" maxlength="14"></div>
                <div class="col-md-8"><label class="form-label small">Giro</label><input v-model="editing.business_type" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Contacto</label><input v-model="editing.contact_name" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Correo</label><input v-model="editing.contact_email" type="email" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Teléfono</label><input v-model="editing.contact_phone" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Plan</label><select v-model="editing.plan_id" class="form-select form-select-sm"><option value="">—</option><option v-for="p in plans" :value="p.id">{{ p.name }}</option></select></div>
                <div class="col-md-4"><label class="form-label small">Precio especial (L/mes)</label><input v-model="editing.monthly_price" type="number" step="0.01" min="0" class="form-control form-control-sm" placeholder="Del plan"></div>
                <div class="col-md-4"><label class="form-label small">Estado</label><select v-model="editing.status" class="form-select form-select-sm"><option v-for="(l,k) in STATUS" :value="k">{{ l }}</option></select></div>
                <div class="col-md-4"><label class="form-label small">Prueba hasta</label><input v-model="editing.trial_ends_at" type="date" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Pagada hasta</label><input v-model="editing.paid_until" type="date" class="form-control form-control-sm"></div>
                <div class="col-md-4"><label class="form-label small">Días de gracia</label><input v-model="editing.grace_days" type="number" min="0" class="form-control form-control-sm"></div>
                <div class="col-12"><label class="form-label small">Notas</label><textarea v-model="editing.notes" rows="2" class="form-control form-control-sm"></textarea></div>
                <div class="col-12 text-end"><button type="button" class="btn btn-sm btn-light me-2" @click="editing=null">Cancelar</button><button class="btn btn-sm btn-pp">Guardar</button></div>
              </form>
            </div>

            <div class="pp-card">
              <div class="d-flex justify-content-between mb-2"><h2 class="h6 mb-0">Pagos</h2></div>
              <div class="table-responsive"><table class="table table-sm mb-0">
                <thead><tr><th>Fecha</th><th>Período</th><th>Método</th><th class="text-end">Monto</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="p in current.payments" :key="p.id">
                    <td>{{ datetime(p.created_at) }}</td><td>{{ date(p.period_start) }} – {{ date(p.period_end) }}</td>
                    <td>{{ p.method || '—' }} <span class="pp-muted small">{{ p.reference }}</span></td>
                    <td class="text-end">{{ money(p.amount, p.currency) }}</td>
                    <td class="text-end"><button class="btn btn-sm btn-link text-danger p-0" @click="deletePayment(p)">Anular</button></td>
                  </tr>
                  <tr v-if="!current.payments.length"><td colspan="5" class="pp-muted text-center">Sin pagos</td></tr>
                </tbody>
              </table></div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="pp-card mb-3">
              <h2 class="h6">Uso este mes</h2>
              <div v-if="current.usage.error" class="text-danger small">No se pudo leer la base: {{ current.usage.error }}</div>
              <div v-else class="row text-center g-2">
                <div class="col-4"><div class="pp-muted small">Usuarios</div><div class="fs-5 fw-bold">{{ current.usage.users }}</div></div>
                <div class="col-4"><div class="pp-muted small">Facturas</div><div class="fs-5 fw-bold">{{ current.usage.invoices_month }}</div></div>
                <div class="col-4"><div class="pp-muted small">Ventas</div><div class="fs-6 fw-bold">{{ money(current.usage.sales_month) }}</div></div>
                <div class="col-12 pp-muted small">Última factura: {{ datetime(current.usage.last_invoice) }}</div>
              </div>
            </div>

            <div class="pp-card mb-3">
              <h2 class="h6">Direcciones</h2>
              <ul class="list-unstyled mb-2">
                <li v-for="d in current.domains" :key="d.id" class="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <span><span class="badge bg-light text-dark me-1">{{ KIND[d.kind] }}</span><a class="pp-domain" :href="'https://' + d.host" target="_blank" rel="noopener">{{ d.host }}</a></span>
                  <button class="btn btn-sm btn-link text-danger p-0" @click="removeDomain(d)">Quitar</button>
                </li>
                <li v-if="!current.domains.length" class="pp-muted small">Sin direcciones: la empresa no se puede abrir.</li>
              </ul>
              <form class="d-flex gap-1" @submit.prevent="addDomain">
                <input v-model="domainForm.host" class="form-control form-control-sm pp-domain" :placeholder="current.slug + '.' + ROOT_DOMAIN" required>
                <select v-model="domainForm.kind" class="form-select form-select-sm" style="max-width:100px"><option value="pos">POS</option><option value="store">Tienda</option><option value="other">Otro</option></select>
                <button class="btn btn-sm btn-outline-secondary">Agregar</button>
              </form>
              <p class="pp-muted small mt-2 mb-0">Cada dirección también debe existir en Cloudflare/Vercel.</p>
            </div>

            <div class="pp-card">
              <h2 class="h6">Soporte</h2>
              <button class="btn btn-sm btn-outline-secondary" @click="openReset">Restablecer contraseña de un usuario</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Pagos -->
      <template v-if="view==='payments'">
        <div class="pp-top"><h1>Pagos recibidos</h1></div>
        <div class="pp-card p-0 table-responsive"><table class="table mb-0">
          <thead><tr><th>Fecha</th><th>Empresa</th><th>Período</th><th>Método</th><th class="text-end">Monto</th></tr></thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id"><td>{{ datetime(p.created_at) }}</td><td>{{ p.tenant_name }}</td><td>{{ date(p.period_start) }} – {{ date(p.period_end) }}</td><td>{{ p.method || '—' }} <span class="pp-muted small">{{ p.reference }}</span></td><td class="text-end">{{ money(p.amount, p.currency) }}</td></tr>
            <tr v-if="!payments.length"><td colspan="5" class="text-center pp-muted py-4">Sin pagos</td></tr>
          </tbody>
        </table></div>
      </template>

      <!-- Planes -->
      <template v-if="view==='plans'">
        <div class="pp-top"><h1>Planes</h1><button class="btn btn-pp" @click="editPlan(null)">+ Nuevo plan</button></div>
        <div class="row g-3">
          <div v-for="p in plans" :key="p.id" class="col-md-6 col-xl-4">
            <div class="pp-card h-100">
              <div class="d-flex justify-content-between"><h2 class="h5">{{ p.name }}</h2><span v-if="!p.is_active" class="pp-badge cancelled">Inactivo</span></div>
              <div class="fs-4 fw-bold mb-2">{{ money(p.price_monthly, p.currency) }}<span class="fs-6 pp-muted">/mes</span></div>
              <p class="small pp-muted">{{ p.description }}</p>
              <ul class="small"><li>Usuarios: {{ p.max_users || 'ilimitados' }}</li><li>Sucursales: {{ p.max_branches || 'ilimitadas' }}</li><li>Tienda en línea: {{ p.includes_ecommerce ? 'sí' : 'no' }}</li></ul>
              <div class="d-flex justify-content-between align-items-center"><span class="pp-muted small">{{ p.tenants }} empresa(s)</span><button class="btn btn-sm btn-outline-secondary" @click="editPlan(p)">Editar</button></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Bitácora -->
      <template v-if="view==='audit'">
        <div class="pp-top"><h1>Bitácora</h1></div>
        <div class="pp-card p-0 table-responsive"><table class="table table-sm mb-0">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Empresa</th><th>Acción</th></tr></thead>
          <tbody><tr v-for="a in audit" :key="a.id"><td>{{ datetime(a.created_at) }}</td><td>{{ a.admin_email || '—' }}</td><td>{{ a.tenant_name || '—' }}</td><td class="pp-domain">{{ a.action }}</td></tr></tbody>
        </table></div>
      </template>
    </main>
  </div>

  <!-- Modal: nueva empresa -->
  <div v-if="modal==='tenant'" class="pp-modal" @click.self="modal=null">
    <div class="pp-card">
      <h2 class="h5 mb-3">Nueva empresa</h2>
      <div class="btn-group mb-3 w-100">
        <button type="button" class="btn btn-sm" :class="form.mode==='new' ? 'btn-dark' : 'btn-outline-dark'" @click="form.mode='new'">Empresa nueva (base vacía)</button>
        <button type="button" class="btn btn-sm" :class="form.mode==='dump' ? 'btn-dark' : 'btn-outline-dark'" @click="form.mode='dump'">Desde respaldo .sql</button>
        <button type="button" class="btn btn-sm" :class="form.mode==='existing' ? 'btn-dark' : 'btn-outline-dark'" @click="form.mode='existing'">Base existente</button>
      </div>
      <form @submit.prevent="createTenant" class="row g-2">
        <div class="col-md-7"><label class="form-label small">Nombre comercial *</label><input v-model="form.name" @input="slugify" class="form-control" required></div>
        <div class="col-md-5"><label class="form-label small">Identificador *</label><input v-model="form.slug" @input="form._slugTouched = true" class="form-control pp-domain" pattern="[a-z0-9]([a-z0-9\\-]*[a-z0-9])?" required></div>
        <div class="col-md-8"><label class="form-label small">Razón social</label><input v-model="form.legal_name" class="form-control"></div>
        <div class="col-md-4"><label class="form-label small">RTN</label><input v-model="form.rtn" class="form-control" maxlength="14" pattern="\\d{14}" title="14 dígitos"></div>
        <div class="col-12"><label class="form-label small">Giro del negocio</label><input v-model="form.business_type" class="form-control" placeholder="Ej. materiales de construcción"></div>
        <div class="col-md-4"><label class="form-label small">Contacto</label><input v-model="form.contact_name" class="form-control"></div>
        <div class="col-md-4"><label class="form-label small">Correo</label><input v-model="form.contact_email" type="email" class="form-control"></div>
        <div class="col-md-4"><label class="form-label small">Teléfono</label><input v-model="form.contact_phone" class="form-control"></div>
        <div class="col-md-6"><label class="form-label small">Plan</label><select v-model="form.plan_id" class="form-select"><option value="">—</option><option v-for="p in plans" :value="p.id">{{ p.name }} ({{ money(p.price_monthly) }})</option></select></div>
        <div class="col-md-6"><label class="form-label small">Precio especial (L/mes)</label><input v-model="form.monthly_price" type="number" step="0.01" min="0" class="form-control" placeholder="Del plan"></div>
        <div class="col-md-6"><label class="form-label small">Dirección del POS</label><input v-model="form.pos_host" class="form-control pp-domain"></div>
        <div class="col-md-6"><label class="form-label small">Dirección de la tienda</label><input v-model="form.store_host" class="form-control pp-domain" placeholder="opcional"></div>

        <template v-if="form.mode==='new'">
          <div class="col-md-6"><label class="form-label small">Estado inicial</label><select v-model="form.status" class="form-select"><option value="trial">Prueba</option><option value="active">Activa</option></select></div>
          <div class="col-md-6" v-if="form.status==='trial'"><label class="form-label small">Días de prueba</label><input v-model="form.trial_days" type="number" min="1" class="form-control"></div>
          <div class="col-12 mt-3"><strong class="small">Usuario administrador de la empresa</strong></div>
          <div class="col-md-6"><label class="form-label small">Nombre</label><input v-model="form.admin.first_name" class="form-control" required></div>
          <div class="col-md-6"><label class="form-label small">Apellido</label><input v-model="form.admin.last_name" class="form-control"></div>
          <div class="col-md-6"><label class="form-label small">Correo *</label><input v-model="form.admin.email" type="email" class="form-control" required></div>
          <div class="col-md-6"><label class="form-label small">Contraseña inicial * (mín. 8)</label><input v-model="form.admin.password" type="text" minlength="8" class="form-control" autocomplete="new-password" required></div>
        </template>
        <template v-else-if="form.mode==='dump'">
          <div class="col-md-8"><label class="form-label small">Respaldo de la base (.sql de mysqldump) *</label><input ref="dumpFile" type="file" accept=".sql" class="form-control" required></div>
          <div class="col-md-4"><label class="form-label small">Pagada hasta</label><input v-model="form.paid_until" type="date" class="form-control"></div>
          <div class="col-12 small pp-muted">Se crea una base nueva con todos los datos del respaldo (usuarios, productos, facturas...). Los usuarios entran con sus mismas contraseñas.</div>
        </template>
        <template v-else>
          <div class="col-md-6"><label class="form-label small">Nombre de la base existente *</label><input v-model="form.existing_db" class="form-control pp-domain" required></div>
          <div class="col-md-6"><label class="form-label small">Pagada hasta</label><input v-model="form.paid_until" type="date" class="form-control"></div>
        </template>
        <div class="col-12 text-end mt-3"><button type="button" class="btn btn-light me-2" @click="modal=null">Cancelar</button><button class="btn btn-pp" :disabled="loading">{{ loading ? (form.mode==='dump' ? 'Importando...' : 'Creando...') : 'Crear empresa' }}</button></div>
      </form>
    </div>
  </div>

  <!-- Modal: pago -->
  <div v-if="modal==='payment'" class="pp-modal" @click.self="modal=null">
    <div class="pp-card" style="max-width:440px">
      <h2 class="h5 mb-3">Registrar pago · {{ current.name }}</h2>
      <form @submit.prevent="savePayment" class="row g-2">
        <div class="col-6"><label class="form-label small">Monto (L)</label><input v-model="payForm.amount" type="number" step="0.01" min="0" class="form-control" required></div>
        <div class="col-6"><label class="form-label small">Meses</label><input v-model="payForm.months" type="number" min="1" class="form-control" required></div>
        <div class="col-6"><label class="form-label small">Método</label><select v-model="payForm.method" class="form-select"><option>transferencia</option><option>efectivo</option><option>depósito</option><option>tarjeta</option></select></div>
        <div class="col-6"><label class="form-label small">Referencia</label><input v-model="payForm.reference" class="form-control"></div>
        <div class="col-12"><label class="form-label small">Notas</label><input v-model="payForm.notes" class="form-control"></div>
        <div class="col-12 small pp-muted">El período empieza cuando vence el actual ({{ date(current.paid_until) }}) o hoy si ya venció.</div>
        <div class="col-12 text-end"><button type="button" class="btn btn-light me-2" @click="modal=null">Cancelar</button><button class="btn btn-pp">Registrar</button></div>
      </form>
    </div>
  </div>

  <!-- Modal: restablecer contraseña -->
  <div v-if="modal==='reset'" class="pp-modal" @click.self="modal=null">
    <div class="pp-card" style="max-width:420px">
      <h2 class="h5 mb-3">Restablecer contraseña</h2>
      <form @submit.prevent="saveReset" class="row g-2">
        <div class="col-12"><label class="form-label small">Correo del usuario</label><input v-model="resetForm.email" type="email" class="form-control" required></div>
        <div class="col-12"><label class="form-label small">Nueva contraseña (mín. 8)</label><input v-model="resetForm.password" type="text" minlength="8" class="form-control" autocomplete="new-password" required></div>
        <div class="col-12 text-end"><button type="button" class="btn btn-light me-2" @click="modal=null">Cancelar</button><button class="btn btn-pp">Guardar</button></div>
      </form>
    </div>
  </div>

  <!-- Modal: plan -->
  <div v-if="modal==='plan'" class="pp-modal" @click.self="modal=null">
    <div class="pp-card" style="max-width:480px">
      <h2 class="h5 mb-3">{{ planForm.id ? 'Editar plan' : 'Nuevo plan' }}</h2>
      <form @submit.prevent="savePlan" class="row g-2">
        <div class="col-8"><label class="form-label small">Nombre</label><input v-model="planForm.name" class="form-control" required></div>
        <div class="col-4"><label class="form-label small">Precio/mes (L)</label><input v-model="planForm.price_monthly" type="number" step="0.01" min="0" class="form-control" required></div>
        <div class="col-12"><label class="form-label small">Descripción</label><textarea v-model="planForm.description" rows="2" class="form-control"></textarea></div>
        <div class="col-6"><label class="form-label small">Máx. usuarios</label><input v-model="planForm.max_users" type="number" min="1" class="form-control" placeholder="Ilimitados"></div>
        <div class="col-6"><label class="form-label small">Máx. sucursales</label><input v-model="planForm.max_branches" type="number" min="1" class="form-control" placeholder="Ilimitadas"></div>
        <div class="col-6 form-check ms-2"><input v-model="planForm.includes_ecommerce" type="checkbox" class="form-check-input" id="pe"><label for="pe" class="form-check-label small">Incluye tienda en línea</label></div>
        <div class="col-5 form-check"><input v-model="planForm.is_active" type="checkbox" class="form-check-input" id="pa"><label for="pa" class="form-check-label small">Activo</label></div>
        <div class="col-12 text-end"><button type="button" class="btn btn-light me-2" @click="modal=null">Cancelar</button><button class="btn btn-pp">Guardar</button></div>
      </form>
    </div>
  </div>

  <!-- Modal: contraseña propia -->
  <div v-if="modal==='pwd'" class="pp-modal" @click.self="modal=null">
    <div class="pp-card" style="max-width:420px">
      <h2 class="h5 mb-3">Cambiar mi contraseña</h2>
      <form @submit.prevent="savePwd" class="row g-2">
        <div class="col-12"><label class="form-label small">Contraseña actual</label><input v-model="pwdForm.current_password" type="password" class="form-control" autocomplete="current-password" required></div>
        <div class="col-12"><label class="form-label small">Nueva contraseña (mín. 10)</label><input v-model="pwdForm.new_password" type="password" minlength="10" class="form-control" autocomplete="new-password" required></div>
        <div class="col-12 text-end"><button type="button" class="btn btn-light me-2" @click="modal=null">Cancelar</button><button class="btn btn-pp">Guardar</button></div>
      </form>
    </div>
  </div>

  <div v-if="toast" class="pp-toast alert shadow" :class="'alert-' + toast.type">{{ toast.message }}</div>
</div>`
  }).mount('#app');
})();
