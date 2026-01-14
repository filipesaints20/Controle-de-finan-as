// CONFIGURAÇÃO: Insira aqui a URL gerada na "Nova Implantação" do Google
const API = "https://script.google.com/macros/s/AKfycbz12mFcfViStYmH9-1X79Ww1AR8nr6kw1xOWg1vQeEIuwqiG2-lZCtBOPZgcs5k17Q/exec;"

const App = {
    data: { despesas: [], pagamentos: [] },
    chart: null,

    // Inicialização: Busca dados da Planilha
    async init() {
        try {
            console.log("Conectando à API...");
            const res = await fetch(API, { redirect: 'follow' });
            if (!res.ok) throw new Error("Falha na rede");
            
            const json = await res.json();
            this.data.despesas = json.despesas || [];
            this.data.pagamentos = json.pagamentos || [];
            
            this.render();
        } catch (e) { 
            console.error("Erro no Init:", e);
            alert("Erro ao carregar dados. Verifique a URL da API no arquivo script.js"); 
        }
    },

    // Renderiza os valores nos cards e tabelas
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

        // Tabela Contas a Pagar
        this.data.despesas.forEach(d => {
            const id = (d.id || "").toString();
            const pagoJa = this.data.pagamentos
                .filter(p => (p.id_despesa || p.id_custos || "").toString() === id)
                .reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0);
            
            const restante = Number(d.valor_total) - pagoJa;
            
            if (restante > 0.01) {
                pList.innerHTML += `
                    <tr>
                        <td><strong>${d.descricao}</strong></td>
                        <td>${this.fmt(d.valor_total)}</td>
                        <td><span class="badge badge-pending">${this.fmt(restante)}</span></td>
                        <td>
                            <button class="btn-pay" onclick="App.pay('${id}', '${d.descricao}')">
                                <span class="material-icons-outlined" style="font-size:16px">payments</span>
                                Pagar
                            </button>
                        </td>
                    </tr>`;
            }
        });

        // Tabela Histórico
        [...this.data.pagamentos].reverse().forEach(p => {
            const idV = (p.id_despesa || p.id_custos || "").toString();
            const item = this.data.despesas.find(d => (d.id || "").toString() === idV);
            const dataVal = p.data_pagamento || p.data || new Date();

            hList.innerHTML += `
                <tr>
                    <td>${new Date(dataVal).toLocaleDateString()}</td>
                    <td>${item ? item.descricao : 'Item #' + idV}</td>
                    <td style="color:var(--success); font-weight:700">${this.fmt(p.valor_pago)}</td>
                    <td><span class="badge badge-success">Pago</span></td>
                </tr>`;
        });
    },

    // Função para enviar pagamento para a Planilha
    async pay(id, nome) {
        const v = prompt(`Quanto deseja pagar para "${nome}"?`);
        if (!v) return;
        
        document.body.style.opacity = "0.5"; // Feedback visual de loading
        
        try {
            await fetch(API, { 
                method: "POST", 
                mode: "no-cors", 
                body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') }) 
            });
            
            alert("Pagamento enviado! Atualizando dados...");
            setTimeout(() => {
                document.body.style.opacity = "1";
                this.init();
            }, 2000);
        } catch (err) {
            alert("Erro ao enviar pagamento.");
            document.body.style.opacity = "1";
        }
    },

    // Configuração do Gráfico
    renderChart(pago, pend) {
        const ctx = document.getElementById("chart").getContext("2d");
        if (this.chart) this.chart.destroy();
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: { 
                labels: ['Efetivado', 'Pendente'], 
                datasets: [{ 
                    data: [pago, pend], 
                    backgroundColor: ['#10b981', '#ef4444'], 
                    borderWidth: 0,
                    hoverOffset: 15 
                }] 
            },
            options: { 
                cutout: '75%', 
                plugins: { 
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } 
                } 
            }
        });
    },

    // Formatação de Moeda
    fmt(v) { 
        return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
    }
};

// Controle de Navegação das abas
function Route(id, el) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

// Inicia o App ao carregar a página
window.onload = () => App.init();