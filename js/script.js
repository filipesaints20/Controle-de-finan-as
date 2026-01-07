const API = "SUA_URL_DO_DEPLOY_AQUI"; // COLOQUE SEU LINK AQUI

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
        } catch (e) { console.error("Erro ao carregar dados"); }
    },

    render() {
        // Cálculo de Totais Blindado contra NaN
        const tBruto = this.data.despesas.reduce((acc, d) => acc + (d.valor_total || d.valor || 0), 0);
        const tPago = this.data.pagamentos.reduce((acc, p) => acc + (p.valor_pago || p.valor || 0), 0);
        const tPend = tBruto - tPago;

        document.getElementById("bruto").innerText = this.fmt(tBruto);
        document.getElementById("pago").innerText = this.fmt(tPago);
        document.getElementById("pend").innerText = this.fmt(tPend);

        this.renderPagar();
        this.renderChart(tPago, tPend);
    },

    renderPagar() {
        const list = document.getElementById("lista-pagar");
        if(!list) return;
        list.innerHTML = "";

        this.data.despesas.forEach(d => {
            const id = (d.id || d.id_custos).toString();
            // Filtra pagamentos vinculados a esta despesa
            const pagoD = this.data.pagamentos
                .filter(p => (p.id_custos || p.id_despesa).toString() === id)
                .reduce((acc, p) => acc + (p.valor_pago || 0), 0);
            
            const totalD = d.valor_total || 0;
            const restante = totalD - pagoD;

            if (restante > 0) {
                list.innerHTML += `<tr>
                    <td><b>${d.descricao}</b></td>
                    <td>${this.fmt(totalD)}</td>
                    <td style="color:var(--d); font-weight:700">${this.fmt(restante)}</td>
                    <td><button class="btn-pay" onclick="App.makePay('${id}')">BAIXAR</button></td>
                </tr>`;
            }
        });
    },

    async makePay(id) {
        const val = prompt("Qual valor deseja pagar?");
        if(!val) return;

        await fetch(API, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: val.replace(',','.') })
        });
        
        alert("Pagamento enviado! Atualizando em 2 segundos...");
        setTimeout(() => this.init(), 2000);
    },

    renderChart(pago, pend) {
        const ctx = document.getElementById("chart").getContext("2d");
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pago', 'Pendente'],
                datasets: [{ data: [pago, pend], backgroundColor: ['#2ecc71', '#e74c3c'], borderJoinStyle: 'round' }]
            },
            options: { maintainAspectRatio: false, cutout: '85%' }
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