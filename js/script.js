const API = "https://script.google.com/macros/s/AKfycby2lrbhsMbfp0proCDju5KQQ30tFd6xaGwjZMitRKZNseHq3xso0IC5FBV7YiULNu-rHg/exec"; // <--- COLOQUE SEU LINK AQUI

const App = {
    data: { despesas: [], pagamentos: [] },
    chart: null,

    async init() {
        try {
            const res = await fetch(API);
            const json = await res.json();
            this.data.despesas = json.despesas || [];
            this.data.pagamentos = json.pagamentos || [];
            this.render();
        } catch (e) { console.error("Erro na sincronização"); }
    },

    render() {
        const tBruto = this.data.despesas.reduce((acc, d) => acc + (d.valor_total || 0), 0);
        const tPago = this.data.pagamentos.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
        
        document.getElementById("bruto").innerText = this.fmt(tBruto);
        document.getElementById("pago").innerText = this.fmt(tPago);
        document.getElementById("pend").innerText = this.fmt(tBruto - tPago);

        this.renderTabelas();
        this.renderChart(tPago, tBruto - tPago);
    },

    renderTabelas() {
        const pList = document.getElementById("lista-pagar");
        const hList = document.getElementById("lista-historico");
        pList.innerHTML = ""; hList.innerHTML = "";

        // 1. Tabela de Pagamentos Pendentes
        this.data.despesas.forEach(d => {
            const id = (d.id || "").toString();
            const pagoD = this.data.pagamentos
                .filter(p => (p.id_custos || p.id_despesa || "").toString() === id)
                .reduce((acc, p) => acc + (p.valor_pago || 0), 0);
            
            const restante = (d.valor_total || 0) - pagoD;
            if (restante > 0) {
                pList.innerHTML += `<tr><td>${d.descricao}</td><td>${this.fmt(d.valor_total)}</td><td style="color:var(--d)">${this.fmt(restante)}</td><td><button onclick="App.pay('${id}')" style="background:var(--p); color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer">PAGAR</button></td></tr>`;
            }
        });

        // 2. Histórico Ativo (Cruzamento de Dados)
        [...this.data.pagamentos].reverse().forEach(p => {
            const idV = (p.id_custos || p.id_despesa || "").toString();
            const original = this.data.despesas.find(d => (d.id || "").toString() === idV);
            hList.innerHTML += `<tr><td>${p.data_pagamento || p.data}</td><td>${original ? original.descricao : 'Item ' + idV}</td><td style="color:var(--s); font-weight:700">${this.fmt(p.valor_pago || 0)}</td></tr>`;
        });
    },

    async pay(id) {
        const v = prompt("Quanto deseja pagar?");
        if(!v) return;
        await fetch(API, { method: "POST", mode: "no-cors", body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') }) });
        alert("Enviado! Atualizando...");
        setTimeout(() => this.init(), 2000);
    },

    renderChart(pago, pend) {
        const ctx = document.getElementById("chart").getContext("2d");
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Pago', 'Pendente'], datasets: [{ data: [pago, pend], backgroundColor: ['#2ecc71', '#e74c3c'] }] },
            options: { maintainAspectRatio: false, cutout: '80%' }
        });
    },

    fmt(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
};

function Route(id, el) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

window.onload = () => App.init();