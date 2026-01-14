const API = "https://script.google.com/macros/s/AKfycbz12mFcfViStYmH9-1X79Ww1AR8nr6kw1xOWg1vQeEIuwqiG2-lZCtBOPZgcs5k17Q/exec";

const App = {
    data: { despesas: [] },
    charts: {},

    async init() {
        try {
            const res = await fetch(API, { redirect: 'follow' });
            const json = await res.json();
            this.data.despesas = json.despesas || [];
            this.render();
        } catch (e) {
            alert("Erro na API. Verifique a URL.");
        }
    },

    render() {
        const tBruto = this.data.despesas.reduce((acc, d) => acc + (Number(d.valor_total) || 0), 0);
        const tPago = this.data.despesas.reduce((acc, d) => acc + (Number(d.valor_pago) || 0), 0);
        
        document.getElementById("bruto").innerText = this.fmt(tBruto);
        document.getElementById("pago").innerText = this.fmt(tPago);
        document.getElementById("pend").innerText = this.fmt(tBruto - tPago);

        this.renderTabelas();
        this.renderCharts(tPago, tBruto - tPago);
    },

    renderTabelas() {
        const pList = document.getElementById("lista-pagar");
        const hList = document.getElementById("lista-historico");
        pList.innerHTML = ""; hList.innerHTML = "";

        this.data.despesas.forEach(d => {
            const total = Number(d.valor_total) || 0;
            const pago = Number(d.valor_pago) || 0;
            const saldo = total - pago;
            const dataVenc = d.vencimento ? new Date(d.vencimento).toLocaleDateString('pt-BR') : '---';

            if (saldo > 0.01 && total > 0) {
                pList.innerHTML += `
                    <tr>
                        <td><strong>${d.descricao}</strong><br><small>${d.categoria}</small></td>
                        <td>${dataVenc}</td>
                        <td><span class="badge badge-pending" style="background:#fee2e2; color:#b91c1c">${this.fmt(saldo)}</span></td>
                        <td><button class="btn-pay" onclick="App.pay('${d.id}', '${d.descricao}')">Pagar</button></td>
                    </tr>`;
            }

            if (pago > 0) {
                hList.innerHTML += `
                    <tr>
                        <td>${d.criado_em}</td>
                        <td><strong>${d.descricao}</strong></td>
                        <td style="color:var(--success); font-weight:700">${this.fmt(pago)}</td>
                        <td><span class="badge" style="background:#dcfce7; color:#15803d">${d.status}</span></td>
                    </tr>`;
            }
        });
    },

    renderCharts(pago, pend) {
        // 1. Gráfico de Rosca (Doughnut)
        const ctx1 = document.getElementById("chartDoughnut").getContext("2d");
        if(this.charts.d) this.charts.d.destroy();
        this.charts.d = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Efetivado', 'Pendente'],
                datasets: [{ data: [pago, pend], backgroundColor: ['#10b981', '#f43f5e'], borderWeight: 0, hoverOffset: 20 }]
            },
            options: { cutout: '80%', plugins: { legend: { position: 'bottom' } } }
        });

        // 2. Gráfico de Barras (Gastos por Mês)
        const meses = {};
        this.data.despesas.forEach(d => {
            const mes = d.criado_em || "Outros";
            meses[mes] = (meses[mes] || 0) + (Number(d.valor_total) || 0);
        });

        const ctx2 = document.getElementById("chartBars").getContext("2d");
        if(this.charts.b) this.charts.b.destroy();
        this.charts.b = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: Object.keys(meses),
                datasets: [{ label: 'Total por Mês', data: Object.values(meses), backgroundColor: '#6366f1', borderRadius: 8 }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    },

    async pay(id, nome) {
        const v = prompt(`Confirmar pagamento para ${nome}:`);
        if(!v) return;
        document.body.style.opacity = "0.5";
        await fetch(API, { method: "POST", mode: "no-cors", body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') }) });
        alert("Sucesso! Atualizando...");
        setTimeout(() => { document.body.style.opacity = "1"; this.init(); }, 2000);
    },

    fmt(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
};

function Route(id, el) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

window.onload = () => App.init();