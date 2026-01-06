// ===============================
// CONFIGURAÇÃO
// ===============================
// COLOQUE SUA URL DO GOOGLE AQUI
const API_URL = "https://script.google.com/macros/s/AKfycbzV_KzGNPaiF3VIHnZzsmZkIXFkLOzTurRPA-9ncpL5NYipg2umuHUvdCn1G_m8hYW5JA/exec"; 

let despesas = [];
let pagamentos = [];
let chart;

// ===============================
// INICIALIZAÇÃO
// ===============================
window.onload = () => {
    carregarDadosAPI();
    
    // Configura o formulário de cadastro
    const form = document.getElementById("formDespesa");
    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const dados = {
                tipo: "despesa",
                descricao: document.getElementById("desc").value,
                valor_total: Number(document.getElementById("valorTotal").value),
                categoria: "Geral",
                vencimento: new Date().toISOString().split('T')[0]
            };
            await enviarDados(dados);
            e.target.reset();
        });
    }
};

// ===============================
// FUNÇÕES DE NAVEGAÇÃO
// ===============================
function showPage(id, el) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(id).classList.add('active-section');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    if(el) el.classList.add('active');
}

// ===============================
// COMUNICAÇÃO COM API
// ===============================
async function carregarDadosAPI() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        despesas = data.despesas || [];
        pagamentos = data.pagamentos || [];
        atualizarTudo();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

async function enviarDados(objeto) {
    try {
        // Usamos no-cors para evitar bloqueios do navegador com Google Apps Script
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(objeto)
        });
        alert("Enviado com sucesso! Atualizando...");
        setTimeout(carregarDadosAPI, 1500);
    } catch (e) {
        alert("Erro na conexão.");
    }
}

// ===============================
// FUNÇÃO DE PAGAMENTO (O BOTÃO)
// ===============================
async function registrarPagamento(idDespesa) {
    if (!idDespesa || idDespesa === "undefined") {
        alert("Erro: Esta despesa não possui um ID válido na planilha.");
        return;
    }

    const valor = prompt("Qual valor deseja pagar?");
    if (!valor || isNaN(valor.replace(',', '.'))) return;

    const dados = {
        tipo: "pagamento",
        id_despesa: idDespesa,
        valor: parseFloat(valor.replace(',', '.'))
    };

    await enviarDados(dados);
}

// ===============================
// ATUALIZAÇÃO DA TELA
// ===============================
function atualizarTudo() {
    let tDesp = 0, tPago = 0;

    // Soma Despesas (Trata Maiúsculas/Minúsculas da Planilha)
    despesas.forEach(d => {
        let v = d.valor_total || d.Valor_total || 0;
        tDesp += parseFloat(v.toString().replace(',', '.')) || 0;
    });

    // Soma Pagamentos
    pagamentos.forEach(p => {
        let v = p.valor || p.Valor || 0;
        tPago += parseFloat(v.toString().replace(',', '.')) || 0;
    });

    document.getElementById("totalDespesas").innerText = moeda(tDesp);
    document.getElementById("totalPago").innerText = moeda(tPago);
    document.getElementById("totalPendente").innerText = moeda(tDesp - tPago);

    renderTabelas();
    renderGrafico(tPago, tDesp - tPago);
}

function renderTabelas() {
    const tPag = document.getElementById("tabelaPagamentos");
    const tHist = document.getElementById("historicoTable");
    if(!tPag || !tHist) return;

    tPag.innerHTML = ""; 
    tHist.innerHTML = "";

    despesas.forEach(d => {
        // Encontra o ID (pode ser 'id' ou 'Id')
        const idAtual = d.id || d.Id;
        
        // Calcula quanto já foi pago para esta despesa específica
        const pagoIndividual = pagamentos
            .filter(p => (p.id_despesa || p.Id_despesa) == idAtual)
            .reduce((s, p) => s + (parseFloat(p.valor || p.Valor) || 0), 0);

        const valorTotal = parseFloat(d.valor_total || d.Valor_total) || 0;
        const restante = valorTotal - pagoIndividual;

        tPag.innerHTML += `
            <tr>
                <td>${d.descricao || d.Descricao}</td>
                <td>${moeda(valorTotal)}</td>
                <td class="text-green">${moeda(pagoIndividual)}</td>
                <td>
                    <button class="btn" onclick="registrarPagamento('${idAtual}')">
                        Pagar
                    </button>
                </td>
            </tr>`;
    });

    pagamentos.forEach(p => {
        const d = despesas.find(x => (x.id || x.Id) == (p.id_despesa || p.Id_despesa));
        tHist.innerHTML += `
            <tr>
                <td>${p.data || '-'}</td>
                <td>${d ? (d.descricao || d.Descricao) : 'Pagamento'}</td>
                <td>${moeda(p.valor || p.Valor)}</td>
            </tr>`;
    });
}

function renderGrafico(pago, pendente) {
    const canvas = document.getElementById("graficoFinanceiro");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pago', 'Pendente'],
            datasets: [{
                data: [pago, pendente],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: { maintainAspectRatio: false }
    });
}

function moeda(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}