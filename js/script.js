const API_URL = "https://script.google.com/macros/s/AKfycbzV_KzGNPaiF3VIHnZzsmZkIXFkLOzTurRPA-9ncpL5NYipg2umuHUvdCn1G_m8hYW5JA/exec"; 

let despesas = [], pagamentos = [], chart;

async function carregarDadosAPI() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        despesas = data.despesas || [];
        pagamentos = data.pagamentos || [];
        atualizarTudo();
    } catch (e) { console.error("Erro ao carregar", e); }
}

function atualizarTudo() {
    let tDesp = 0, tPago = 0;

    despesas.forEach(d => {
        let v = d.valor_total || d.Valor_total || 0;
        tDesp += parseFloat(v.toString().replace(',','.')) || 0;
    });

    pagamentos.forEach(p => {
        let v = p.valor || p.Valor || 0;
        tPago += parseFloat(v.toString().replace(',','.')) || 0;
    });

    document.getElementById("totalDespesas").innerText = moeda(tDesp);
    document.getElementById("totalPago").innerText = moeda(tPago);
    document.getElementById("totalPendente").innerText = moeda(tDesp - tPago);

    renderTabelas(tDesp, tPago);
}

function renderTabelas(tDesp, tPago) {
    const tPag = document.getElementById("tabelaPagamentos");
    const tHist = document.getElementById("historicoTable");
    tPag.innerHTML = ""; tHist.innerHTML = "";

    despesas.forEach(d => {
        const pago = pagamentos.filter(p => p.id_despesa == d.id).reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
        tPag.innerHTML += `<tr><td>${d.descricao}</td><td>${moeda(d.valor_total)}</td><td>${moeda(pago)}</td><td><button class="btn" onclick="registrarPagamento('${d.id}')">Pagar</button></td></tr>`;
    });

    pagamentos.forEach(p => {
        const d = despesas.find(x => x.id == p.id_despesa);
        tHist.innerHTML += `<tr><td>${p.data}</td><td>${d?.descricao || 'Pagamento'}</td><td>${moeda(p.valor)}</td></tr>`;
    });

    renderGrafico(tPago, tDesp - tPago);
}

function renderGrafico(pago, pendente) {
    const ctx = document.getElementById("graficoFinanceiro").getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Pago', 'Pendente'], datasets: [{ data: [pago, pendente], backgroundColor: ['#2ecc71', '#e74c3c'] }] },
        options: { maintainAspectRatio: false }
    });
}

function showPage(id, el) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(id).classList.add('active-section');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
}

function moeda(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
window.onload = carregarDadosAPI;
