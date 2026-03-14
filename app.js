// --- IMPORTAÇÃO DO FIREBASE MODULAR ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

    if(abaDestino === 'relatorio') { atualizarTabelaHtml(); }
}

// --- INTELIGÊNCIA DO CALENDÁRIO (CONECTADA À NUVEM) ---
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
        document.getElementById('label-resumo-periodo').innerText = textoVerticalCalculado;

        renderizarFormularioLote();
        atualizarTabelaHtml();

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

// --- SALVA OS DADOS DIRETAMENTE NO FIREBASE ---
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
            mudarAba('relatorio'); 
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

// --- ATUALIZA A TABELA HTML DE PREVIEW ---
function atualizarTabelaHtml() {
    const tbody = document.getElementById('tabela-body');
    tbody.innerHTML = '';
    let totalColunas = [0, 0, 0, 0, 0]; let totalGeral = 0;

    const textoQuebradoNaTabela = textoVerticalCalculado.replace(' a ', '<br>a<br>');

    dadosAtuais.forEach((linha, index) => {
        const tr = document.createElement('tr');
        
        if (index === 0) {
            const tdSemana = document.createElement('td');
            tdSemana.rowSpan = 8; tdSemana.className = 'td-semana';
            tdSemana.innerHTML = textoQuebradoNaTabela;
            tr.appendChild(tdSemana);
        }
        if (index % 2 === 0) {
            const tdArea = document.createElement('td');
            tdArea.rowSpan = 2; tdArea.className = 'td-area';
            tdArea.innerText = linha.area;
            tr.appendChild(tdArea);
        }

        const tdTurno = document.createElement('td');
        tdTurno.className = 'td-turno'; tdTurno.innerText = linha.turno;
        tr.appendChild(tdTurno);

        let somaLinha = 0;
        linha.dias.forEach((val, i) => {
            const td = document.createElement('td'); 
            td.className = 'td-val'; 
            td.innerText = val;
            tr.appendChild(td);
            
            let numeroReal = val === "" ? 0 : parseInt(val);
            somaLinha += numeroReal; 
            totalColunas[i] += numeroReal;
        });

        const tdTotal = document.createElement('td');
        tdTotal.className = 'td-val'; tdTotal.style.fontWeight = 'bold'; tdTotal.innerText = somaLinha;
        tr.appendChild(tdTotal); totalGeral += somaLinha;
        tbody.appendChild(tr);
    });

    document.getElementById('tot-s1').innerText = totalColunas[0]; document.getElementById('tot-t').innerText = totalColunas[1];
    document.getElementById('tot-q1').innerText = totalColunas[2]; document.getElementById('tot-q2').innerText = totalColunas[3];
    document.getElementById('tot-s2').innerText = totalColunas[4]; document.getElementById('tot-geral').innerText = totalGeral;
}

// --- GERADOR NATIVO DO EXCEL ---
window.gerarExcel = async function() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Apontamento');

    worksheet.columns = [
        { key: 'semana', width: 8 }, { key: 'area', width: 16 }, { key: 'turno', width: 8 },
        { key: 's1', width: 6 }, { key: 't', width: 6 }, { key: 'q1', width: 6 }, { key: 'q2', width: 6 }, { key: 's2', width: 6 }, { key: 'total', width: 8 }
    ];

    const cabecalho = worksheet.getRow(1);
    cabecalho.values = ['Semana', 'Área', 'Turno', 'S', 'T', 'Q', 'Q', 'S', 'Total'];
    cabecalho.font = { bold: true }; cabecalho.alignment = { vertical: 'middle', horizontal: 'center' };

    dadosAtuais.forEach((linha, i) => {
        const rowIndex = i + 2; const row = worksheet.getRow(rowIndex);
        row.getCell('C').value = linha.turno;
        
        row.getCell('D').value = linha.dias[0] === "" ? null : linha.dias[0]; 
        row.getCell('E').value = linha.dias[1] === "" ? null : linha.dias[1]; 
        row.getCell('F').value = linha.dias[2] === "" ? null : linha.dias[2];
        row.getCell('G').value = linha.dias[3] === "" ? null : linha.dias[3]; 
        row.getCell('H').value = linha.dias[4] === "" ? null : linha.dias[4];
        
        row.getCell('I').value = { formula: `SUM(D${rowIndex}:H${rowIndex})` };
        row.getCell('I').font = { bold: true }; row.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const totalRow = worksheet.getRow(10);
    totalRow.getCell('C').value = 'Total';
    totalRow.getCell('D').value = { formula: 'SUM(D2:D9)' }; totalRow.getCell('E').value = { formula: 'SUM(E2:E9)' };
    totalRow.getCell('F').value = { formula: 'SUM(F2:F9)' }; totalRow.getCell('G').value = { formula: 'SUM(G2:G9)' };
    totalRow.getCell('H').value = { formula: 'SUM(H2:H9)' }; totalRow.getCell('I').value = { formula: 'SUM(I2:I9)' }; 
    totalRow.font = { bold: true }; totalRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:A9');
    const cellSemana = worksheet.getCell('A2');
    cellSemana.value = textoVerticalCalculado.replace(' a ', '\n a \n'); 
    cellSemana.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center', wrapText: true };

    worksheet.mergeCells('B2:B3'); worksheet.getCell('B2').value = 'Fabricação';
    worksheet.mergeCells('B4:B5'); worksheet.getCell('B4').value = 'Estrutural';
    worksheet.mergeCells('B6:B7'); worksheet.getCell('B6').value = 'Mont. Final';
    worksheet.mergeCells('B8:B9'); worksheet.getCell('B8').value = 'Painéis';
    
    ['B2','B4','B6','B8'].forEach(cel => {
        worksheet.getCell(cel).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(cel).font = { bold: true };
    });

    worksheet.mergeCells('A10:C10'); worksheet.getCell('A10').alignment = { vertical: 'middle', horizontal: 'right' };

    const borderStyle = { style: 'thick', color: { argb: 'FF000000' } };
    const thinBorder = { style: 'thin', color: { argb: 'FF000000' } };

    for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 9; col++) { worksheet.getCell(row, col).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }; }
    }
    worksheet.eachRow((row, rowNumber) => {
        row.getCell(1).border.left = borderStyle; row.getCell(9).border.right = borderStyle;
        if(rowNumber === 1 || rowNumber === 10) { row.eachCell(cell => { cell.border.top = borderStyle; cell.border.bottom = borderStyle; cell.border.left = borderStyle; cell.border.right = borderStyle; }); }
    });
    for(let i=2; i<=9; i++) { worksheet.getCell(`I${i}`).border.left = borderStyle; worksheet.getCell(`I${i}`).border.right = borderStyle; }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const nomeArquivo = `Apontamento_${textoVerticalCalculado.replace(/ /g, '_')}.xlsx`;
    saveAs(blob, nomeArquivo);
}

// INICIA O SISTEMA ASSIM QUE O SCRIPT CARREGAR
const inputData = document.getElementById('input-data');
const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, '0');
const dia = String(hoje.getDate()).padStart(2, '0');
inputData.value = `${ano}-${mes}-${dia}`;

processarDataCalendario();
