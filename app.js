// --- IMPORTAÇÃO DO FIREBASE MODULAR ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// CHAVES DO PROJETO "INDICADOR DE PRESENÇA MODULAR"
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

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let textoVerticalCalculado = ""; 
let chaveBancoAtual = ""; 
let dadosAtuais = []; 
let historicoCompleto = []; // Guarda o histórico da aba Dados

// Retorna a matriz limpa (COM CAMPOS VAZIOS EM VEZ DE ZEROS)
function getEstruturaZerada() {
    return [
        { area: 'Fabricação', turno: '1º', dias: ['','','','',''] }, { area: 'Fabricação', turno: '2º', dias: ['','','','',''] },
        { area: 'Estrutural', turno: '1º', dias: ['','','','',''] }, { area: 'Estrutural', turno: '2º', dias: ['','','','',''] },
        { area: 'Mont. Final', turno: '1º', dias: ['','','','',''] }, { area: 'Mont. Final', turno: '2º', dias: ['','','','',''] },
        { area: 'Painéis', turno: '1º', dias: ['','','','',''] }, { area: 'Painéis', turno: '2º', dias: ['','','','',''] }
    ];
}

// --- NAVEGAÇÃO ENTRE ABAS ---
window.mudarAba = function(abaDestino) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
    
    document.getElementById(`tab-btn-${abaDestino}`).classList.add('active');
    document.getElementById(`aba-${abaDestino}`).classList.add('active');

    // Se clicou na aba DADOS, puxa o histórico da nuvem
    if(abaDestino === 'dados') { 
        carregarHistoricoNuvem(); 
    }
}

// --- INTELIGÊNCIA DO CALENDÁRIO ---
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
        console.error("Erro ao puxar dados do Firebase:", error);
        displaySemana.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right:8px; color: red;"></i> Erro de conexão. Verifique a internet.`;
    }
}

// --- RENDERIZA O FORMULÁRIO NA TELA ---
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

// --- SALVA OS DADOS NO FIREBASE ---
window.salvarTodosOsDados = async function() {
    const btn = document.getElementById('btn-save');
    const originalHtml = btn.innerHTML;
    
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando com a Nuvem...`;
    
    dadosAtuais.forEach((linha, indexBD) => {
        for(let i=0; i<5; i++) {
            let valorDigitado = document.getElementById(`in-${indexBD}-${i}`).value;
            linha.dias[i] = valorDigitado === "" ? "" : parseInt(valorDigitado);
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
        console.error("Erro ao gravar no Firebase: ", error);
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Falha ao Salvar. Tente de novo.`;
        btn.style.backgroundColor = '#dc2626'; 
        setTimeout(() => { 
            btn.innerHTML = originalHtml; 
            btn.style.backgroundColor = ''; 
        }, 3000);
    }
}

// =========================================================
// O MOTOR DA ABA DADOS (SANFONA, PESQUISA E CARDS)
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

        // Ordenar do mais recente para o mais antigo
        historicoCompleto.sort((a, b) => new Date(b.atualizado) - new Date(a.atualizado));

        renderizarSanfona(''); 
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
    
    const filtrados = historicoCompleto.filter(item => item.id.toLowerCase().includes(termoBusca.toLowerCase()));

    if (filtrados.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:15px; color:#64748b;">Nenhuma semana encontrada.</div>`;
        return;
    }

    filtrados.forEach((item) => {
        const accItem = document.createElement('div');
        accItem.className = 'acc-item';
        
        const accHeader = document.createElement('div');
        accHeader.className = 'acc-header';
        accHeader.innerHTML = `<span><i class="fa-regular fa-calendar-check" style="margin-right:8px;"></i> ${item.id}</span> <i class="fa-solid fa-chevron-down acc-icon"></i>`;
        
        const accContent = document.createElement('div');
        accContent.className = 'acc-content';
        accContent.innerHTML = gerarHTMLCardsResponsivos(item.dados);

        accHeader.onclick = () => { accItem.classList.toggle('active'); };

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
// EXPORTAÇÃO MESTRE (TODO O HISTÓRICO EMPILHADO NO EXCEL)
// =========================================================
window.gerarExcelMestre = async function() {
    const termo = document.getElementById('input-busca').value;
    
    const filtrados = historicoCompleto.filter(item => item.id.toLowerCase().includes(termo.toLowerCase()));

    if (filtrados.length === 0) {
        alert("Não existem dados para exportar com este filtro.");
        return;
    }

    const btn = document.querySelector('.btn-excel');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gerando Arquivo...`;

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Histórico');

        worksheet.columns = [
            { key: 'semana', width: 8 }, { key: 'area', width: 16 }, { key: 'turno', width: 8 },
            { key: 's1', width: 6 }, { key: 't', width: 6 }, { key: 'q1', width: 6 }, { key: 'q2', width: 6 }, { key: 's2', width: 6 }, { key: 'total', width: 8 }
        ];

        let linhaInicial = 1; 

        filtrados.forEach((item) => {
            
            const cabecalho = worksheet.getRow(linhaInicial);
            cabecalho.values = ['Semana', 'Área', 'Turno', 'S', 'T', 'Q', 'Q', 'S', 'Total'];
            cabecalho.font = { bold: true }; 
            cabecalho.alignment = { vertical: 'middle', horizontal: 'center' };

            item.dados.forEach((linhaData, i) => {
                const rIndex = linhaInicial + 1 + i; 
                const row = worksheet.getRow(rIndex);
                
                row.getCell('C').value = linhaData.turno;
                
                row.getCell('D').value = linhaData.dias[0] === "" ? null : linhaData.dias[0]; 
                row.getCell('E').value = linhaData.dias[1] === "" ? null : linhaData.dias[1]; 
                row.getCell('F').value = linhaData.dias[2] === "" ? null : linhaData.dias[2];
                row.getCell('G').value = linhaData.dias[3] === "" ? null : linhaData.dias[3]; 
                row.getCell('H').value = linhaData.dias[4] === "" ? null : linhaData.dias[4];
                
                row.getCell('I').value = { formula: `SUM(D${rIndex}:H${rIndex})` };
                row.getCell('I').font = { bold: true }; 
                row.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            const linhaFinal = linhaInicial + 9;
            const totalRow = worksheet.getRow(linhaFinal);
            totalRow.getCell('C').value = 'Total';
            
            totalRow.getCell('D').value = { formula: `SUM(D${linhaInicial+1}:D${linhaInicial+8})` }; 
            totalRow.getCell('E').value = { formula: `SUM(E${linhaInicial+1}:E${linhaInicial+8})` };
            totalRow.getCell('F').value = { formula: `SUM(F${linhaInicial+1}:F${linhaInicial+8})` }; 
            totalRow.getCell('G').value = { formula: `SUM(G${linhaInicial+1}:G${linhaInicial+8})` };
            totalRow.getCell('H').value = { formula: `SUM(H${linhaInicial+1}:H${linhaInicial+8})` }; 
            totalRow.getCell('I').value = { formula: `SUM(I${linhaInicial+1}:I${linhaInicial+8})` }; 
            totalRow.font = { bold: true }; 
            totalRow.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.mergeCells(`A${linhaInicial+1}:A${linhaInicial+8}`);
            const cellSemana = worksheet.getCell(`A${linhaInicial+1}`);
            cellSemana.value = item.id.split(' de ')[0].replace(' a ', '\n a \n'); 
            cellSemana.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`B${linhaInicial+1}:B${linhaInicial+2}`); worksheet.getCell(`B${linhaInicial+1}`).value = 'Fabricação';
            worksheet.mergeCells(`B${linhaInicial+3}:B${linhaInicial+4}`); worksheet.getCell(`B${linhaInicial+3}`).value = 'Estrutural';
            worksheet.mergeCells(`B${linhaInicial+5}:B${linhaInicial+6}`); worksheet.getCell(`B${linhaInicial+5}`).value = 'Mont. Final';
            worksheet.mergeCells(`B${linhaInicial+7}:B${linhaInicial+8}`); worksheet.getCell(`B${linhaInicial+7}`).value = 'Painéis';
            
            [`B${linhaInicial+1}`, `B${linhaInicial+3}`, `B${linhaInicial+5}`, `B${linhaInicial+7}`].forEach(cel => {
                worksheet.getCell(cel).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getCell(cel).font = { bold: true };
            });

            worksheet.mergeCells(`A${linhaFinal}:C${linhaFinal}`); 
            worksheet.getCell(`A${linhaFinal}`).alignment = { vertical: 'middle', horizontal: 'right' };

            const borderStyle = { style: 'thick', color: { argb: 'FF000000' } };
            const thinBorder = { style: 'thin', color: { argb: 'FF000000' } };

            for (let r = linhaInicial; r <= linhaFinal; r++) {
                for (let c = 1; c <= 9; c++) { 
                    worksheet.getCell(r, c).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }; 
                }
            }
            
            worksheet.eachRow((row, rowNumber) => {
                if(rowNumber >= linhaInicial && rowNumber <= linhaFinal) {
                    row.getCell(1).border.left = borderStyle; 
                    row.getCell(9).border.right = borderStyle;
                    if(rowNumber === linhaInicial || rowNumber === linhaFinal) { 
                        row.eachCell(cell => { 
                            cell.border.top = (rowNumber === linhaInicial) ? borderStyle : cell.border.top; 
                            cell.border.bottom = (rowNumber === linhaFinal) ? borderStyle : cell.border.bottom;
                            if(cell.col === 1) cell.border.left = borderStyle;
                            if(cell.col === 9) cell.border.right = borderStyle;
                        }); 
                    }
                }
            });
            for(let i=1; i<=8; i++) { 
                worksheet.getCell(`I${linhaInicial+i}`).border.left = borderStyle; 
                worksheet.getCell(`I${linhaInicial+i}`).border.right = borderStyle; 
            }

            linhaInicial += 11;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        let nomeArquivo = termo === "" ? "Historico_Completo_Producao.xlsx" : `Historico_Producao_${termo}.xlsx`;
        saveAs(blob, nomeArquivo);

    } catch (err) {
        console.error("Erro ao gerar o Excel Mestre:", err);
        alert("Ocorreu um erro ao gerar a planilha Excel.");
    } finally {
        btn.innerHTML = textoOriginal;
    }
}

// --- INICIA O SISTEMA ASSIM QUE O SCRIPT CARREGAR ---
const inputData = document.getElementById('input-data');
const hoje = new Date();
inputData.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
processarDataCalendario();
