const API_URL = "https://script.google.com/macros/s/AKfycbxWy9wO327WcVTDMQhpLh_ijukFADgH7eO59ADh2ofeaFuAh-9jHI0Hj1-gIGkRv6ZGgQ/exec"; 

let despesas = [], pagamentos = [], chart;

async function carregarDadosAPI() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        despesas = data.despesas || [];
        pagamentos = data.pagamentos || [];
        atualizarTudo();
    } catch (e) { console.error("Erro:", e); }
}

function atualizarTudo() {
    let tDesp = 0, tPago = 0;
    despesas.forEach(d => tDesp += parseFloat(d.valor_total || d.Valor_total || 0));
    pagamentos.forEach(p => tPago += parseFloat(p.valor || p.valor_pago || p.Valor_pago || 0));

    document.getElementById("totalDespesas").innerText = moeda(tDesp);
    document.getElementById("totalPago").innerText = moeda(tPago);
    document.getElementById("totalPendente").innerText = moeda(tDesp - tPago);

    renderTabelas(tPago, tDesp - tPago);
}

function renderTabelas(pagoG, pendG) {
    const tPag = document.getElementById("tabelaPagamentos");
    tPag.innerHTML = "";

    despesas.forEach(d => {
        const idD = (d.id || d.Id).toString();
        const pagoI = pagamentos
            .filter(p => (p.id_despesa || p.id_custos || p.Id_custos).toString() === idD)
            .reduce((s, p) => s + parseFloat(p.valor || p.valor_pago || 0), 0);

        const totalD = parseFloat(d.valor_total || 0);
        if (totalD - pagoI > 0) {
            tPag.innerHTML += `<tr>
                <td>${d.descricao}</td>
                <td>${moeda(totalD)}</td>
                <td>${moeda(pagoI)}</td>
                <td><button class="btn" style="padding:5px" onclick="registrarPagamento('${idD}')">Pagar</button></td>
            </tr>`;
        }
    });
    renderGrafico(pagoG, pendG);
}

async function registrarPagamento(id) {
    const v = prompt("Quanto deseja pagar?");
    if(!v || isNaN(v.replace(',','.'))) return;
    
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') })
    });
    alert("Processando... Aguarde 2 segundos.");
    setTimeout(carregarDadosAPI, 2000);
}

function renderGrafico(pago, pend) {
    const ctx = document.getElementById("graficoFinanceiro").getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Pago', 'Pendente'], datasets: [{ data: [pago, pend], backgroundColor: ['#2ecc71', '#e74c3c'] }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
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

document.getElementById("formDespesa").onsubmit = async (e) => {
    e.preventDefault();
    const d = {
        tipo: "despesa",
        descricao: document.getElementById("desc").value,
        valor_total: document.getElementById("valorTotal").value
    };
    await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(d) });
    alert("Salvo!");
    e.target.reset();
    setTimeout(carregarDadosAPI, 2000);
};