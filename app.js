import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
// Adicionamos collection e getDocs para puxar o histórico
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZsg2GbxrgX70VZwPHiXkoFMCTt7i3_6U",
  authDomain: "indicador-de-presenca-modular.firebaseapp.com",
  projectId: "indicador-de-presenca-modular",
  storageBucket: "indicador-de-presenca-modular.firebasestorage.app",
  messagingSenderId: "895253390208",
  appId: "1:895253390208:web:943f8679a0dbf36a531765"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variáveis de Estado
let textoVerticalCalculado = ""; 
let chaveBancoAtual = ""; 
let dadosAtuais = []; 
let historicoCompleto = []; // Guarda o histórico da Sanfona

function getEstruturaZerada() {
    return [
        { area: 'Fabricação', turno: '1º', dias: ['','','','',''] }, { area: 'Fabricação', turno: '2º', dias: ['','','','',''] },
        { area: 'Estrutural', turno: '1º', dias: ['','','','',''] }, { area: 'Estrutural', turno: '2º', dias: ['','','','',''] },
        { area: 'Mont. Final', turno: '1º', dias: ['','','','',''] }, { area: 'Mont. Final', turno: '2º', dias: ['','','','',''] },
        { area: 'Painéis', turno: '1º', dias: ['','','','',''] }, { area: 'Painéis', turno: '2º', dias: ['','','','',''] }
    ];
}

// Navegação entre abas
window.mudarAba = function(abaDestino) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
    
    document.getElementById(`tab-btn-${abaDestino}`).classList.add('active');
    document.getElementById(`aba-${abaDestino}`).classList.add('active');

    // Se clicou na aba DADOS, dispara o gatilho para puxar o histórico da nuvem
    if(abaDestino === 'dados') { 
        carregarHistoricoNuvem(); 
    }
}

// Lógica de Calendário (Mantida igual)
window.processarDataCalendario = async function() {
    const dateStr = document.getElementById('input-data').value;
    if (!dateStr) return;

    const dataSelecionada = new Date(dateStr + 'T12:00:00'); 
    const diaDaSemana = dataSelecionada.getDay(); 
    const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
    
    const segundaFeira = new Date(dataSelecionada);
    segundaFeira.setDate(dataSelecionada.getDate() + diffParaSegunda);

    const sextaFeira = new Date(segundaFeira);
    sextaFeira.setDate(segundaFeira.getDate() + 4);

    const mesesSiglas = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const diaSeg = String(segundaFeira.getDate()).padStart(2, '0');
    const mesSeg = mesesSiglas[segundaFeira.getMonth()];
    const anoSeg = segundaFeira.getFullYear();
    const diaSex = String(sextaFeira.getDate()).padStart(2, '0');
    const mesSex = mesesSiglas[sextaFeira.getMonth()];

    if (mesSeg === mesSex) {
        textoVerticalCalculado = `${diaSeg} a ${diaSex} ${mesSeg}`;
    } else {
        textoVerticalCalculado = `${diaSeg} ${mesSeg} a ${diaSex} ${mesSex}`; 
    }

    chaveBancoAtual = `${textoVerticalCalculado} de ${anoSeg}`;

    const displaySemana = document.getElementById('display-semana-calculada');
    displaySemana.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Buscando na nuvem...`;
    
    try {
        const docRef = doc(db, "faltas_producao", chaveBancoAtual);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            dadosAtuais = docSnap.data().dados;
        } else {
            dadosAtuais = getEstruturaZerada();
        }
        displaySemana.innerHTML = `<i class="fa-regular fa-calendar-check" style="margin-right:8px;"></i> ${textoVerticalCalculado}`;
        renderizarFormularioLote();

    } catch (error) {
        console.error("Erro:", error);
        displaySemana.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right:8px; color: red;"></i> Erro de conexão.`;
    }
}

// Renderiza aba 1
function renderizarFormularioLote() {
    const container = document.getElementById('form-areas');
    container.innerHTML = '';
    const areas = ['Fabricação', 'Estrutural', 'Mont. Final', 'Painéis'];
    
    areas.forEach(nomeArea => {
        const card = document.createElement('div');
        card.className = 'factory-area-card';
        let htmlInterno = `<div class="factory-area-header">${nomeArea}</div>`;
        
        ['1º', '2º'].forEach(nomeTurno => {
            const indexBD = dadosAtuais.findIndex(d => d.area === nomeArea && d.turno === nomeTurno);
            const valores = dadosAtuais[indexBD].dias;
            
            htmlInterno += `
            <div class="shift-row">
                <div class="shift-label">${nomeTurno}</div>
                <div class="days-grid">
                    <div class="day-cell"><label>S</label><input type="number" min="0" id="in-${indexBD}-0" value="${valores[0]}"></div>
                    <div class="day-cell"><label>T</label><input type="number" min="0" id="in-${indexBD}-1" value="${valores[1]}"></div>
                    <div class="day-cell"><label>Q</label><input type="number" min="0" id="in-${indexBD}-2" value="${valores[2]}"></div>
                    <div class="day-cell"><label>Q</label><input type="number" min="0" id="in-${indexBD}-3" value="${valores[3]}"></div>
                    <div class="day-cell"><label>S</label><input type="number" min="0" id="in-${indexBD}-4" value="${valores[4]}"></div>
                </div>
            </div>`;
        });
        card.innerHTML = htmlInterno;
        container.appendChild(card);
    });
}

// Salvar no Firebase
window.salvarTodosOsDados = async function() {
    const btn = document.getElementById('btn-save');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando com a Nuvem...`;
    
    dadosAtuais.forEach((linha, indexBD) => {
        for(let i=0; i<5; i++) {
            let val = document.getElementById(`in-${indexBD}-${i}`).value;
            linha.dias[i] = val === "" ? "" : parseInt(val);
        }
    });

    try {
        await setDoc(doc(db, "faltas_producao", chaveBancoAtual), {
            dados: dadosAtuais,
            ultimaAtualizacao: new Date().toISOString()
        });

        btn.innerHTML = `<i class="fa-solid fa-check"></i> Salvo na Nuvem!`;
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => { 
            btn.innerHTML = originalHtml; 
            btn.style.backgroundColor = ''; 
            mudarAba('dados'); 
        }, 1200);

    } catch (error) {
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Falha ao Salvar.`;
        btn.style.backgroundColor = '#dc2626'; 
        setTimeout(() => { btn.innerHTML = originalHtml; btn.style.backgroundColor = ''; }, 3000);
    }
}

// =========================================================
// O NOVO MOTOR DA ABA DADOS (SANFONA, PESQUISA E CARDS)
// =========================================================

// 1. Puxar todos os dados do Firebase
window.carregarHistoricoNuvem = async function() {
    const container = document.getElementById('accordion-container');
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Montando Histórico...</div>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, "faltas_producao"));
        historicoCompleto = [];
        
        querySnapshot.forEach((doc) => {
            historicoCompleto.push({
                id: doc.id, // Ex: "02 a 06 mar de 2026"
                dados: doc.data().dados,
                atualizado: doc.data().ultimaAtualizacao
            });
        });

        // Ordenar do mais recente para o mais antigo baseado no timestamp invisível
        historicoCompleto.sort((a, b) => new Date(b.atualizado) - new Date(a.atualizado));

        renderizarSanfona(''); // Renderiza tudo vazio (sem filtro)
    } catch (error) {
        console.error("Erro ao puxar histórico:", error);
        container.innerHTML = `<div style="color:red; text-align:center;">Erro ao carregar os dados.</div>`;
    }
}

// 2. Filtro de digitação
window.filtrarSanfona = function() {
    const termo = document.getElementById('input-busca').value;
    renderizarSanfona(termo);
}

// 3. Construtor HTML da Sanfona
function renderizarSanfona(termoBusca) {
    const container = document.getElementById('accordion-container');
    container.innerHTML = '';
    
    // Filtra pelo que o usuário digitou (Ex: "fev")
    const filtrados = historicoCompleto.filter(item => item.id.toLowerCase().includes(termoBusca.toLowerCase()));

    if (filtrados.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:15px; color:#64748b;">Nenhuma semana encontrada.</div>`;
        return;
    }

    filtrados.forEach((item) => {
        const accItem = document.createElement('div');
        accItem.className = 'acc-item';
        
        // Cabeçalho Clicável
        const accHeader = document.createElement('div');
        accHeader.className = 'acc-header';
        accHeader.innerHTML = `<span><i class="fa-regular fa-calendar-check" style="margin-right:8px;"></i> ${item.id}</span> <i class="fa-solid fa-chevron-down acc-icon"></i>`;
        
        // Área Oculta (Cards Responsivos)
        const accContent = document.createElement('div');
        accContent.className = 'acc-content';
        accContent.innerHTML = gerarHTMLCardsResponsivos(item.dados);

        // Ação de Abrir/Fechar
        accHeader.onclick = () => {
            accItem.classList.toggle('active');
        };

        accItem.appendChild(accHeader);
        accItem.appendChild(accContent);
        container.appendChild(accItem);
    });
}

// 4. Transformar Dados em Cards Mobile
function gerarHTMLCardsResponsivos(dadosDaSemana) {
    let html = '<div class="resp-grid">';
    const areas = ['Fabricação', 'Estrutural', 'Mont. Final', 'Painéis'];
    
    areas.forEach(area => {
        const linhasArea = dadosDaSemana.filter(d => d.area === area);
        let somaTotalArea = 0;
        
        let areaHtml = `<div class="resp-card">
            <div class="resp-card-header">${area}</div>
            <div class="resp-turnos-container">`;

        linhasArea.forEach(linha => {
            // Conta os vazios ("") como 0 para a matemática bater
            let somaTurno = linha.dias.reduce((a, b) => a + (b === "" ? 0 : parseInt(b)), 0);
            somaTotalArea += somaTurno;

            areaHtml += `
                <div class="resp-turno-row">
                    <div class="resp-badge">${linha.turno}</div>
                    <div class="resp-dias">
                        <span><b>S:</b> ${linha.dias[0]||0}</span>
                        <span><b>T:</b> ${linha.dias[1]||0}</span>
                        <span><b>Q:</b> ${linha.dias[2]||0}</span>
                        <span><b>Q:</b> ${linha.dias[3]||0}</span>
                        <span><b>S:</b> ${linha.dias[4]||0}</span>
                    </div>
                    <div class="resp-total-turno">${somaTurno}</div>
                </div>`;
        });
        
        areaHtml += `</div>
            <div class="resp-card-footer">Total de Faltas: <b>${somaTotalArea}</b></div>
        </div>`;
        
        html += areaHtml;
    });
    
    html += '</div>';
    return html;
}

// =========================================================
// EXPORTAÇÃO MESTRE (Placeholder para Etapa 2)
// =========================================================
window.gerarExcelMestre = function() {
    alert("Pronto para a Etapa 2: Exportação Múltipla. Como isso exige uma reescrita do motor do Excel, vamos implementar isso no próximo passo!");
}

// INICIA O SISTEMA
const inputData = document.getElementById('input-data');
const hoje = new Date();
inputData.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
processarDataCalendario();
