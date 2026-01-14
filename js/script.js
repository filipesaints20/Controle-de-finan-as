const API = "https://script.google.com/macros/s/AKfycbyLnV0u4MyS_Id0aej0Gr2LCQEoOamLmVaeiogX9KIn7jB-FJTcgMurJu3v55AbmvHaiw/exec";

const App = {
    data: { despesas: [], pagamentos: [] },
    chart: null,

    async init() {

        document.body.style.opacity = "0.6";
        try {
            const res = await fetch(API);
            const json = await res.json();
            this.data.despesas = json.despesas || [];
            this.data.pagamentos = json.pagamentos || [];
            this.render();
        } catch (e) { 
            console.error("Erro na sincronização");
            alert("Erro ao carregar dados. Verifique sua conexão.");
        } finally {
            document.body.style.opacity = "1";
        }
    },

    render() {
        const tBruto = this.data.despesas.reduce((acc, d) => acc + (Number(d.valor_total) || 0), 0);
        const tPago = this.data.pagamentos.reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0);
        const tPend = tBruto - tPago;
        
        document.getElementById("bruto").innerText = this.fmt(tBruto);
        document.getElementById("pago").innerText = this.fmt(tPago);
        document.getElementById("pend").innerText = this.fmt(tPend);

        this.renderTabelas();
        this.renderChart(tPago, tPend);
    },

    renderTabelas() {
        const pList = document.getElementById("lista-pagar");
        const hList = document.getElementById("lista-historico");
        pList.innerHTML = ""; 
        hList.innerHTML = "";

 
        this.data.despesas.forEach(d => {
            const id = (d.id || "").toString();
            const pagoD = this.data.pagamentos
                .filter(p => (p.id_custos || p.id_despesa || "").toString() === id)
                .reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0);
            
            const restante = (Number(d.valor_total) || 0) - pagoD;
            
            if (restante > 0) {
                pList.innerHTML += `
                    <tr>
                        <td>
                            <div style="font-weight:600; color:var(--text-main)">${d.descricao}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted)">ID: #${id}</div>
                        </td>
                        <td>${this.fmt(d.valor_total)}</td>
                        <td><span class="badge badge-pending">${this.fmt(restante)}</span></td>
                        <td>
                            <button class="btn" onclick="App.pay('${id}', '${d.descricao}')">
                                <span class="material-icons-outlined" style="font-size:16px">payments</span>
                                Pagar
                            </button>
                        </td>
                    </tr>`;
            }
        });


        let histHTML = `<table><thead><tr><th>DATA</th><th>ITEM</th><th>VALOR PAGO</th><th>STATUS</th></tr></thead><tbody>`;
        
        [...this.data.pagamentos].reverse().slice(0, 10).forEach(p => {
            const idV = (p.id_custos || p.id_despesa || "").toString();
            const original = this.data.despesas.find(d => (d.id || "").toString() === idV);
            const dataFmt = p.data_pagamento || p.data || "---";

            histHTML += `
                <tr>
                    <td style="color:var(--text-muted)">${dataFmt}</td>
                    <td><strong>${original ? original.descricao : 'Item ' + idV}</strong></td>
                    <td style="color:var(--success); font-weight:600">${this.fmt(p.valor_pago || 0)}</td>
                    <td><span class="badge badge-success">Efetivado</span></td>
                </tr>`;
        });
        
        histHTML += `</tbody></table>`;
        hList.innerHTML = histHTML;
    },

    async pay(id, nome) {
        const v = prompt(`Quanto deseja pagar para: ${nome}?`);
        if(!v) return;


        try {
            await fetch(API, { 
                method: "POST", 
                mode: "no-cors", 
                body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') }) 
            });
            
            alert("Pagamento enviado com sucesso!");

            setTimeout(() => this.init(), 1500);
        } catch (err) {
            alert("Erro ao processar pagamento.");
        }
    },

    renderChart(pago, pend) {
        const ctx = document.getElementById("chart").getContext("2d");
        if(this.chart) this.chart.destroy();
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Efetivado', 'Pendente'],
                datasets: [{
                    data: [pago, pend],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                }
            }
        });
    },

    fmt(v) { 
        return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
    }
};


function Route(id, el) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

window.onload = () => App.init();