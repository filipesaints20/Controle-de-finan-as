const API = "https://script.google.com/macros/s/AKfycbzEv8cdj1HpibaWKuwYzqysHxi0m7Q4tggG3qVozcmE6GR_sSF3AzTStoRtultWVdzh/exec";

/* ========= TOAST ========= */
function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
        success: "check_circle",
        error: "error",
        warning: "warning",
        info: "info"
    };

    toast.innerHTML = `
        <span class="material-icons-outlined toast-icon">${icons[type]}</span>
        <div>
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ========= APP ========= */
const App = {
    data: { despesas: [] },
    charts: {},

    async init() {
        try {
            const res = await fetch(API);
            const json = await res.json();
            this.data.despesas = json.despesas || [];
            this.render();
            showToast("success", "Sistema carregado", "Dados financeiros atualizados.");
        } catch {
            showToast("error", "Erro na API", "Não foi possível carregar os dados.");
        }
    },

    render() {
        const tBruto = this.data.despesas.reduce((a, d) => a + (+d.valor_total || 0), 0);
        const tPago = this.data.despesas.reduce((a, d) => a + (+d.valor_pago || 0), 0);

        bruto.innerText = this.fmt(tBruto);
        pago.innerText = this.fmt(tPago);
        pend.innerText = this.fmt(tBruto - tPago);

        this.renderTabelas();
        this.renderCharts(tPago, tBruto - tPago);
    },

   renderTabelas() {
    const listaPagar = document.getElementById("lista-pagar");
    const listaHistorico = document.getElementById("lista-historico");

    listaPagar.innerHTML = "";
    listaHistorico.innerHTML = "";

    this.data.despesas.forEach(d => {
        const total = Number(d.valor_total) || 0;
        const pago = Number(d.valor_pago) || 0;
        const saldo = total - pago;

        const venc = d.vencimento
            ? new Date(d.vencimento).toLocaleDateString("pt-BR")
            : "---";

        if (saldo > 0) {
            listaPagar.innerHTML += `
                <tr>
                    <td><strong>${d.descricao}</strong><br><small>${d.categoria}</small></td>
                    <td>${venc}</td>
                    <td>${this.fmt(saldo)}</td>
                    <td>
                        <button class="btn-pay" onclick="App.pay('${d.id}', '${d.descricao}')">
                            Pagar
                        </button>
                    </td>
                </tr>
            `;
        }

        if (pago > 0) {
            listaHistorico.innerHTML += `
                <tr>
                    <td>${d.criado_em || "-"}</td>
                    <td>${d.descricao}</td>
                    <td style="color:var(--success); font-weight:700">
                        ${this.fmt(pago)}
                    </td>
                    <td>${d.status || "PAGO"}</td>
                </tr>
            `;
        }
    });
},

    async pay(id, nome) {
        const valor = prompt(`Informe o valor pago para ${nome}`);
        if (!valor) {
            showToast("warning", "Operação cancelada", "Nenhum valor informado.");
            return;
        }

        showToast("info", "Processando", "Registrando pagamento...");

        await fetch(API, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor })
        });

        showToast("success", "Pagamento confirmado", "Operação realizada com sucesso.");
        setTimeout(() => this.init(), 2000);
    },

    fmt(v) {
        return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
};

function Route(id, el) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(id).style.display = "block";
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    el.classList.add("active");
}

window.onload = () => App.init();
