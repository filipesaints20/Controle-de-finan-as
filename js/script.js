const API_URL = "https://script.google.com/macros/s/AKfycbwHZYgj7Q-AeN0QznV8-_6I1Uxn8s-1oAKQs-NyPHvbzAyMxopjmEhj-0SlNCUhowAA_A/exec";

let despesas = [];
let pagamentos = [];
let chart;

document.addEventListener("DOMContentLoaded", () => {
    carregarDadosAPI();
    
    document.getElementById("formDespesa").addEventListener("submit", async (e) => {
        e.preventDefault();
        const dados = {
            tipo: "despesa",
            descricao: document.getElementById("desc").value,
            valor_total: Number(document.getElementById("valorTotal").value),
            categoria: document.getElementById("categoria").value,
            vencimento: document.getElementById("vencimento").value
        };
        await enviarParaAPI(dados);
        e.target.reset();
    });
});

function showPage(pageId, element) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(pageId).classList.add('active-section');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    element.classList.add('active');
}

async function carregarDadosAPI() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        despesas = data.despesas || [];
        pagamentos = data.pagamentos || [];
        atualizarTudo();
    } catch (e) { console.error("Erro ao carregar", e); }
}

async function enviarParaAPI(dados) {
    try {
        await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(dados) });
        alert("Enviado com sucesso! Atualizando...");
        setTimeout(carregarDadosAPI, 1500);
    } catch (e) { alert("Erro ao enviar"); }
}

async function registrarPagamento(id) {
    const v = prompt("Quanto deseja pagar?");
    if(!v || isNaN(v)) return;
    await enviarParaAPI({ tipo: "pagamento", id_despesa: id, valor: Number(v) });
}

function atualizarTudo() {
    let tDesp = 0, tPago = 0;
    despesas.forEach(d => tDesp += Number(d.valor_total));
    pagamentos.forEach(p => tPago += Number(p.valor));

    document.getElementById("totalDespesas").innerText = moeda(tDesp);
    document.getElementById("totalPago").innerText = moeda(tPago);
    document.getElementById("totalPendente").innerText = moeda(tDesp - tPago);

    renderTabelas();
    renderGrafico(tPago, tDesp - tPago);
}

function renderTabelas() {
    const tPag = document.getElementById("tabelaPagamentos");
    const tHist = document.getElementById("historicoTable");
    tPag.innerHTML = ""; tHist.innerHTML = "";

    despesas.forEach(d => {
        const pago = pagamentos.filter(p => p.id_despesa == d.id).reduce((s, p) => s + Number(p.valor), 0);
        tPag.innerHTML += `<tr><td>${d.descricao}</td><td>${moeda(d.valor_total)}</td><td class="text-green">${moeda(pago)}</td><td class="text-red">${moeda(d.valor_total - pago)}</td><td><button class="btn" onclick="registrarPagamento('${d.id}')">Pagar</button></td></tr>`;
    });

    pagamentos.forEach(p => {
        const d = despesas.find(x => x.id == p.id_despesa);
        tHist.innerHTML += `<tr><td>${p.data || '-'}</td><td>${d?.descricao || 'Pagamento'}</td><td>${moeda(p.valor)}</td></tr>`;
    });
}

function renderGrafico(pago, pendente) {
    const ctx = document.getElementById("graficoFinanceiro").getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pago', 'Pendente'],
            datasets: [{ data: [pago, pendente], backgroundColor: ['#2ecc71', '#e74c3c'] }]
        },
        options: { maintainAspectRatio: false }
    });
}

function moeda(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
