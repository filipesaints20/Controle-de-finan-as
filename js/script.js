// ===============================
// CONFIG
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbw7MbUY-e5RSapZ9kVNLmOQGCO4DrvCvNeVol4c4TbmV4uk4CYAAaiWOzcLpghyPBZ-ew/exec";

// ===============================
// ESTADO
// ===============================
let despesas = [];
let pagamentos = [];
let chart;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    await carregarDadosAPI();
    
    // Listener para o formulário de cadastro
    const form = document.getElementById("formDespesa");
    if(form) {
        form.addEventListener("submit", salvarNovaDespesa);
    }
});

// ===============================
// NAVEGAÇÃO (Faltava esta função)
// ===============================
function showPage(pageId, element) {
    // Remove classe active de todas as seções
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
    // Ativa a seção clicada
    document.getElementById(pageId).classList.add('active-section');

    // Atualiza menu lateral
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    element.classList.add('active');
}

// ===============================
// API
// ===============================
async function carregarDadosAPI() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        despesas = data.despesas || [];
        pagamentos = data.pagamentos || [];
        atualizarTudo();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

async function salvarNovaDespesa(e) {
    e.preventDefault();
    
    const dados = {
        tipo: "despesa",
        descricao: document.getElementById("desc").value,
        categoria: document.getElementById("categoria").value,
        valor_total: Number(document.getElementById("valorTotal").value),
        vencimento: document.getElementById("vencimento").value
    };

    await enviarDados(dados);
    e.target.reset(); // Limpa o formulário
}

async function registrarPagamento(idDespesa) {
    const valor = prompt("Valor pago:");
    if (!valor || isNaN(valor)) return;

    const dados = {
        tipo: "pagamento",
        id_despesa: idDespesa,
        valor: Number(valor)
    };

    await enviarDados(dados);
}

// Função genérica para enviar dados (POST)
async function enviarDados(objeto) {
    try {
        // O Google Script às vezes exige que o redirecionamento seja seguido
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // Tente no-cors se receber erro de política de origem
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(objeto)
        });
        
        alert("Operação realizada! Aguarde a atualização.");
        // Como o 'no-cors' não retorna resposta, forçamos um reload após 2 segundos
        setTimeout(() => carregarDadosAPI(), 2000);
    } catch (error) {
        console.error("Erro ao enviar:", error);
    }
}

// ===============================
// RENDERIZAÇÃO (Dashboard, Tabelas e Gráfico)
// ===============================
function atualizarDashboard() {
    let totalDespesas = 0;
    let totalPago = 0;

    despesas.forEach(d => totalDespesas += Number(d.valor_total) || 0);
    pagamentos.forEach(p => totalPago += Number(p.valor) || 0);

    const totalPendente = totalDespesas - totalPago;

    document.getElementById("totalDespesas").innerText = moeda(totalDespesas);
    document.getElementById("totalPago").innerText = moeda(totalPago);
    document.getElementById("totalPendente").innerText = moeda(totalPendente);

    gerarGrafico(totalPago, totalPendente);
}

function renderPagamentos() {
    const tbody = document.getElementById("tabelaPagamentos");
    if (!tbody) return;
    tbody.innerHTML = "";

    despesas.forEach(d => {
        const pago = pagamentos
            .filter(p => p.id_despesa == d.id)
            .reduce((s, p) => s + Number(p.valor), 0);
        const pendente = d.valor_total - pago;

        tbody.innerHTML += `
            <tr>
                <td>${d.descricao}</td>
                <td>${moeda(d.valor_total)}</td>
                <td class="text-green">${moeda(pago)}</td>
                <td class="text-red">${moeda(pendente)}</td>
                <td>
                    <button class="btn btn-primary" onclick="registrarPagamento('${d.id}')">
                        Pagar
                    </button>
                </td>
            </tr>`;
    });
}

function renderHistorico() {
    const tbody = document.getElementById("historicoTable");
    if (!tbody) return;
    tbody.innerHTML = "";

    pagamentos.forEach(p => {
        const despesa = despesas.find(d => d.id == p.id_despesa);
        tbody.innerHTML += `
            <tr>
                <td>${p.data || '-'}</td>
                <td>${despesa?.descricao || "Desconhecido"}</td>
                <td>Pagamento</td>
                <td>${moeda(p.valor)}</td>
            </tr>`;
    });
}

function gerarGrafico(pago, pendente) {
    const ctx = document.getElementById("graficoFinanceiro");
    if (!ctx) return;
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Pago", "Pendente"],
            datasets: [{
                data: [pago, pendente],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function atualizarTudo() {
    atualizarDashboard();
    renderPagamentos();
    renderHistorico();
}

function moeda(v) {
    return Number(v).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
