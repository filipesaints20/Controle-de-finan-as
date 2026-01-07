const AppConfig = {
    URL: "https://script.google.com/macros/s/AKfycbwjKljG-d6X6Edmk9kp1abY1zA4lay8eS4Ylg9Z2Ro4BJZQysr5lrmeJMLY5iMkuVNPmA/exec",
    Colors: { success: '#2ecc71', danger: '#e74c3c', primary: '#4361ee' }
};

const App = {
    state: { despesas: [], pagamentos: [], chart: null },

    async init() {
        this.toggleLoader(true);
        try {
            const res = await fetch(AppConfig.URL);
            const data = await res.json();
            this.state.despesas = data.despesas || [];
            this.state.pagamentos = data.pagamentos || [];
            this.refreshUI();
        } catch (err) {
            alert("Erro ao sincronizar dados com a nuvem.");
        } finally {
            this.toggleLoader(false);
        }
    },

    refreshUI() {
        const totals = this.calculateTotals();
        document.getElementById("totalDespesas").innerText = this.formatBRL(totals.bruto);
        document.getElementById("totalPago").innerText = this.formatBRL(totals.pago);
        document.getElementById("totalPendente").innerText = this.formatBRL(totals.pendente);
        
        this.renderTables();
        this.renderChart(totals.pago, totals.pendente);
    },

    calculateTotals() {
        const bruto = this.state.despesas.reduce((acc, d) => acc + (parseFloat(d.valor_total) || 0), 0);
        const pago = this.state.pagamentos.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
        return { bruto, pago, pendente: bruto - pago };
    },

    renderTables() {
        const pagBody = document.getElementById("tbl-pagamentos");
        pagBody.innerHTML = `<thead><tr><th>DESCRIÇÃO</th><th>VALOR</th><th>PAGO</th><th>AÇÃO</th></tr></thead><tbody>`;
        
        this.state.despesas.forEach(d => {
            const id = (d.id || d.Id).toString();
            const pagoD = this.state.pagamentos
                .filter(p => (p.id_despesa || p.id_custos).toString() === id)
                .reduce((acc, p) => acc + parseFloat(p.valor), 0);
            
            if(parseFloat(d.valor_total) - pagoD > 0) {
                pagBody.innerHTML += `<tr>
                    <td><b>${d.descricao}</b></td>
                    <td>${this.formatBRL(d.valor_total)}</td>
                    <td style="color:var(--success)">${this.formatBRL(pagoD)}</td>
                    <td><button class="btn" style="padding: 5px 12px; font-size: 0.8rem" onclick="App.pay('${id}')">QUITAR</button></td>
                </tr>`;
            }
        });

        const histBody = document.getElementById("tbl-historico");
        histBody.innerHTML = `<thead><tr><th>DATA</th><th>ITEM</th><th>VALOR</th></tr></thead>`;
        [...this.state.pagamentos].reverse().forEach(p => {
            const item = this.state.despesas.find(d => (d.id || d.Id).toString() === (p.id_despesa || p.id_custos).toString());
            histBody.innerHTML += `<tr><td>${p.data || p.data_pagamento}</td><td>${item ? item.descricao : '---'}</td><td style="font-weight:700">${this.formatBRL(p.valor)}</td></tr>`;
        });
    },

    async pay(id) {
        const val = prompt("Confirmar valor do pagamento:");
        if(!val) return;

        this.toggleLoader(true);
        await fetch(AppConfig.URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: val.replace(',','.') })
        });
        setTimeout(() => this.init(), 1500);
    },

    renderChart(pago, pendente) {
        const ctx = document.getElementById("mainChart").getContext("2d");
        if(this.state.chart) this.state.chart.destroy();
        this.state.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Efetivado', 'Pendente'],
                datasets: [{ data: [pago, pendente], backgroundColor: [AppConfig.Colors.success, AppConfig.Colors.danger], borderWidth: 0 }]
            },
            options: { maintainAspectRatio: false, cutout: '80%', plugins: { legend: { position: 'bottom' } } }
        });
    },

    formatBRL(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
    toggleLoader(show) { document.getElementById("loader").style.display = show ? "block" : "none"; }
};

const Router = {
    go(id, el) {
        document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
        document.getElementById(id).style.display = 'block';
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        el.classList.add('active');
    }
};

window.onload = () => App.init();