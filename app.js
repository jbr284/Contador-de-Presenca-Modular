// =========================================================
// MODULAR | CONTADOR DE PRESENÇA (APP 1) - VERSÃO OURO
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
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

let textoVerticalCalculado = ""; 
let chaveBancoAtual = ""; 
let dadosAtuais = []; 
let historicoCompleto = []; 
const COLECAO_BD = "contador_de_presenca";

function getEstruturaZerada() {
    return [
        { area: 'Fabricação', turno: '1º', dias: ['','','','',''] }, { area: 'Fabricação', turno: '2º', dias: ['','','','',''] },
        { area: 'Estrutural', turno: '1º', dias: ['','','','',''] }, { area: 'Estrutural', turno: '2º', dias: ['','','','',''] },
        { area: 'Mont. Final', turno: '1º', dias: ['','','','',''] }, { area: 'Mont. Final', turno: '2º', dias: ['','','','',''] },
        { area: 'Painéis', turno: '1º', dias: ['','','','',''] }, { area: 'Painéis', turno: '2º', dias: ['','','','',''] }
    ];
}

window.mudarAba = function(abaDestino) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-btn-${abaDestino}`).classList.add('active');
    document.getElementById(`aba-${abaDestino}`).classList.add('active');
    if (abaDestino === 'dados') { carregarHistoricoNuvem(); }
}

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

    if (mesSeg === mesSex) { textoVerticalCalculado = `${diaSeg} a ${diaSex} ${mesSeg}`; } 
    else { textoVerticalCalculado = `${diaSeg} ${mesSeg} a ${diaSex} ${mesSex}`; }

    chaveBancoAtual = `${textoVerticalCalculado} de ${anoSeg}`;

    const displaySemana = document.getElementById('display-semana-calculada');
    displaySemana.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Buscando...`;
    
    try {
        const docRef = doc(db, COLECAO_BD, chaveBancoAtual);
        const docSnap = await getDoc(docRef);
        const textoResumoEl = document.getElementById('texto-resumo');

        if (docSnap.exists()) {
            dadosAtuais = docSnap.data().dados;
            if(textoResumoEl) textoResumoEl.value = docSnap.data().resumo || "";
        } else {
            dadosAtuais = getEstruturaZerada();
            if(textoResumoEl) textoResumoEl.value = "";
        }
        displaySemana.innerHTML = `<i class="fa-regular fa-calendar-check" style="margin-right:8px;"></i> ${textoVerticalCalculado}`;
        renderizarFormularioLote();

    } catch (error) {
        displaySemana.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: red;"></i> Falha de rede.`;
    }
}

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
                <div class="shift-label">${nomeTurno} T</div>
                <div class="days-grid">
                    <div class="day-cell"><label>seg</label><input type="number" min="0" id="in-${indexBD}-0" value="${valores[0]}"></div>
                    <div class="day-cell"><label>ter</label><input type="number" min="0" id="in-${indexBD}-1" value="${valores[1]}"></div>
                    <div class="day-cell"><label>qua</label><input type="number" min="0" id="in-${indexBD}-2" value="${valores[2]}"></div>
                    <div class="day-cell"><label>qui</label><input type="number" min="0" id="in-${indexBD}-3" value="${valores[3]}"></div>
                    <div class="day-cell"><label>sex</label><input type="number" min="0" id="in-${indexBD}-4" value="${valores[4]}"></div>
                </div>
            </div>`;
        });
        card.innerHTML = htmlInterno; 
        container.appendChild(card);
    });
}

window.salvarTodosOsDados = async function() {
    const btn = document.getElementById('btn-save');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;
    
    dadosAtuais.forEach((linha, indexBD) => {
        for (let i = 0; i < 5; i++) {
            let valorDigitado = document.getElementById(`in-${indexBD}-${i}`).value;
            linha.dias[i] = valorDigitado === "" ? "" : parseInt(valorDigitado);
        }
    });

    const textoResumoEl = document.getElementById('texto-resumo');
    // Dupla proteção: se o usuário digitar os símbolos, eles também são removidos ao salvar
    const textoResumo = textoResumoEl ? textoResumoEl.value.replace(/[*_~]/g, '').trim() : "";

    try {
        await setDoc(doc(db, COLECAO_BD, chaveBancoAtual), {
            dados: dadosAtuais,
            resumo: textoResumo,
            ultimaAtualizacao: new Date().toISOString()
        });

        btn.innerHTML = `<i class="fa-solid fa-check"></i> Salvo na Nuvem!`;
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => { btn.innerHTML = originalHtml; btn.style.backgroundColor = ''; mudarAba('dados'); }, 1200);

    } catch (error) {
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Falha.`;
        btn.style.backgroundColor = '#dc2626'; 
        setTimeout(() => { btn.innerHTML = originalHtml; btn.style.backgroundColor = ''; }, 3000);
    }
}

function converterIdParaData(idString) {
    const mesesMap = { "jan":0, "fev":1, "mar":2, "abr":3, "mai":4, "jun":5, "jul":6, "ago":7, "set":8, "out":9, "nov":10, "dez":11 };
    const regex = /(\d{2})\s(?:([a-zA-ZçÇ]{3})\s)?a\s(\d{2})\s([a-zA-ZçÇ]{3})\sde\s(\d{4})/i;
    const match = idString.match(regex);
    if (match) {
        const dia = parseInt(match[3], 10);
        const mesStr = match[4].toLowerCase();
        const ano = parseInt(match[5], 10);
        return new Date(ano, mesesMap[mesStr] !== undefined ? mesesMap[mesStr] : 0, dia).getTime();
    }
    return 0; 
}

window.carregarHistoricoNuvem = async function() {
    const container = document.getElementById('accordion-container');
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Montando Histórico...</div>`;
    try {
        const querySnapshot = await getDocs(collection(db, COLECAO_BD));
        historicoCompleto = [];
        querySnapshot.forEach((doc) => {
            historicoCompleto.push({
                id: doc.id, dados: doc.data().dados, resumo: doc.data().resumo || "", atualizado: doc.data().ultimaAtualizacao
            });
        });
        historicoCompleto.sort((a, b) => converterIdParaData(b.id) - converterIdParaData(a.id));
        renderizarSanfona(''); 
    } catch (error) { container.innerHTML = `<div style="color:red; text-align:center;">Erro ao carregar o histórico.</div>`; }
}

window.filtrarSanfona = function() {
    renderizarSanfona(document.getElementById('input-busca').value);
}

function renderizarSanfona(termoBusca) {
    const container = document.getElementById('accordion-container');
    container.innerHTML = '';
    const filtrados = historicoCompleto.filter(item => item.id.toLowerCase().includes(termoBusca.toLowerCase()));

    if (filtrados.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:15px; color:#64748b;">Nenhum registro encontrado.</div>`; return;
    }

    filtrados.forEach((item) => {
        const accItem = document.createElement('div'); accItem.className = 'acc-item';
        const accHeader = document.createElement('div'); accHeader.className = 'acc-header';
        accHeader.innerHTML = `<span><i class="fa-regular fa-calendar-check" style="margin-right:8px;"></i> ${item.id}</span> <i class="fa-solid fa-chevron-down acc-icon"></i>`;
        const accContent = document.createElement('div'); accContent.className = 'acc-content';
        accContent.innerHTML = gerarHTMLCardsResponsivos(item.dados, item.resumo); 

        accHeader.onclick = () => { accItem.classList.toggle('active'); };
        accItem.appendChild(accHeader); accItem.appendChild(accContent); container.appendChild(accItem);
    });
}

function gerarHTMLCardsResponsivos(dadosDaSemana, textoResumo) {
    let totaisDias = [0, 0, 0, 0, 0]; let totalGeralSemana = 0;
    let html = `
    <div class="hist-table-wrapper">
        <table class="hist-table">
            <thead><tr><th>Área</th><th>Turno</th><th>seg</th><th>ter</th><th>qua</th><th>qui</th><th>sex</th><th>Total</th></tr></thead>
            <tbody>`;

    dadosDaSemana.forEach((linha, index) => {
        let somaLinha = 0; let colunasDias = '';
        linha.dias.forEach((val, i) => {
            let num = val === "" ? 0 : parseInt(val);
            somaLinha += num; totaisDias[i] += num;
            colunasDias += `<td>${val}</td>`;
        });
        totalGeralSemana += somaLinha;
        html += `<tr>`;
        if (index % 2 === 0) html += `<td rowspan="2" class="td-area-hist">${linha.area}</td>`;
        html += `<td class="td-turno-hist">${linha.turno} T</td>${colunasDias}<td class="td-total-hist">${somaLinha}</td></tr>`;
    });

    html += `
            </tbody>
            <tfoot>
                <tr class="row-total-hist">
                    <td colspan="2" style="text-align: right; padding-right: 15px;">TOTAL GERAL</td>
                    <td>${totaisDias[0]}</td><td>${totaisDias[1]}</td><td>${totaisDias[2]}</td><td>${totaisDias[3]}</td><td>${totaisDias[4]}</td><td>${totalGeralSemana}</td>
                </tr>
            </tfoot>
        </table>
    </div>`;

    if (textoResumo) {
        html += `
        <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
            <div style="font-weight: bold; color: #1e293b; margin-bottom: 8px;"><i class="fa-solid fa-align-left"></i> Resumo da Semana:</div>
            <div style="white-space: pre-wrap; font-size: 0.9rem; color: #475569; line-height: 1.5;">${textoResumo}</div>
        </div>`;
    }
    return html;
}

window.gerarExcelMestre = async function() {
    const termo = document.getElementById('input-busca').value;
    const filtrados = historicoCompleto.filter(item => item.id.toLowerCase().includes(termo.toLowerCase()));

    if (filtrados.length === 0) return alert("Não existem dados para exportar com este filtro.");

    const btn = document.querySelector('.btn-excel');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Gerando Arquivo...`;

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Histórico Modular');

        worksheet.columns = [
            { key: 'semana', width: 10 }, { key: 'area', width: 16 }, { key: 'turno', width: 10 },
            { key: 's1', width: 8 }, { key: 't', width: 8 }, { key: 'q1', width: 8 }, 
            { key: 'q2', width: 8 }, { key: 's2', width: 8 }, { key: 'total', width: 10 }
        ];

        let linhaInicial = 1; 
        const borderStyle = { style: 'thick', color: { argb: 'FF000000' } };
        const thinBorder = { style: 'thin', color: { argb: 'FF000000' } };

        filtrados.forEach((item) => {
            const cabecalho = worksheet.getRow(linhaInicial);
            cabecalho.values = ['Semana', 'Área', 'Turno', 'seg', 'ter', 'qua', 'qui', 'sex', 'Total'];
            cabecalho.font = { bold: true }; cabecalho.alignment = { vertical: 'middle', horizontal: 'center' };

            item.dados.forEach((linhaData, i) => {
                const rIndex = linhaInicial + 1 + i; const row = worksheet.getRow(rIndex);
                row.getCell('C').value = linhaData.turno + ' T';
                row.getCell('D').value = linhaData.dias[0] === "" ? null : linhaData.dias[0]; 
                row.getCell('E').value = linhaData.dias[1] === "" ? null : linhaData.dias[1]; 
                row.getCell('F').value = linhaData.dias[2] === "" ? null : linhaData.dias[2];
                row.getCell('G').value = linhaData.dias[3] === "" ? null : linhaData.dias[3]; 
                row.getCell('H').value = linhaData.dias[4] === "" ? null : linhaData.dias[4];
                row.getCell('I').value = { formula: `SUM(D${rIndex}:H${rIndex})` };
                row.getCell('I').font = { bold: true }; row.alignment = { vertical: 'middle', horizontal: 'center' };
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
            totalRow.font = { bold: true }; totalRow.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.mergeCells(`A${linhaInicial+1}:A${linhaInicial+8}`);
            const cellSemana = worksheet.getCell(`A${linhaInicial+1}`);
            cellSemana.value = item.id.split(' de ')[0].replace(' a ', '\n a \n'); 
            cellSemana.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`B${linhaInicial+1}:B${linhaInicial+2}`); worksheet.getCell(`B${linhaInicial+1}`).value = 'Fabricação';
            worksheet.mergeCells(`B${linhaInicial+3}:B${linhaInicial+4}`); worksheet.getCell(`B${linhaInicial+3}`).value = 'Estrutural';
            worksheet.mergeCells(`B${linhaInicial+5}:B${linhaInicial+6}`); worksheet.getCell(`B${linhaInicial+5}`).value = 'Mont. Final';
            worksheet.mergeCells(`B${linhaInicial+7}:B${linhaInicial+8}`); worksheet.getCell(`B${linhaInicial+7}`).value = 'Painéis';
            
            [`B${linhaInicial+1}`, `B${linhaInicial+3}`, `B${linhaInicial+5}`, `B${linhaInicial+7}`].forEach(cel => { worksheet.getCell(cel).alignment = { vertical: 'middle', horizontal: 'center' }; worksheet.getCell(cel).font = { bold: true }; });
            worksheet.mergeCells(`A${linhaFinal}:C${linhaFinal}`); worksheet.getCell(`A${linhaFinal}`).alignment = { vertical: 'middle', horizontal: 'right' };

            for (let r = linhaInicial; r <= linhaFinal; r++) { for (let c = 1; c <= 9; c++) { worksheet.getCell(r, c).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }; } }
            worksheet.eachRow((row, rowNumber) => {
                if(rowNumber >= linhaInicial && rowNumber <= linhaFinal) {
                    row.getCell(1).border.left = borderStyle; row.getCell(9).border.right = borderStyle;
                    if(rowNumber === linhaInicial || rowNumber === linhaFinal) { 
                        row.eachCell(cell => { 
                            cell.border.top = (rowNumber === linhaInicial) ? borderStyle : cell.border.top; 
                            cell.border.bottom = (rowNumber === linhaFinal) ? borderStyle : cell.border.bottom;
                            if(cell.col === 1) cell.border.left = borderStyle; if(cell.col === 9) cell.border.right = borderStyle;
                        }); 
                    }
                }
            });
            for(let i = 1; i <= 8; i++) { worksheet.getCell(`I${linhaInicial+i}`).border.left = borderStyle; worksheet.getCell(`I${linhaInicial+i}`).border.right = borderStyle; }

            let saltoProximaTabela = 12; 

            if (item.resumo) {
                const linhaResumo = linhaFinal + 2; 
                const linhaResumoFim = linhaResumo + 6; 
                worksheet.mergeCells(`A${linhaResumo}:I${linhaResumoFim}`);
                
                const cellR = worksheet.getCell(`A${linhaResumo}`);
                cellR.value = "📝 RESUMO GERENCIAL DA SEMANA:\n\n" + item.resumo;
                cellR.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
                cellR.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF333333' } };
                
                for(let r = linhaResumo; r <= linhaResumoFim; r++) {
                    for(let c = 1; c <= 9; c++) {
                        let b = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
                        if(r === linhaResumo) b.top = borderStyle;
                        if(r === linhaResumoFim) b.bottom = borderStyle;
                        if(c === 1) b.left = borderStyle;
                        if(c === 9) b.right = borderStyle;
                        worksheet.getCell(r, c).border = b;
                    }
                }
                saltoProximaTabela = 12 + 8; 
            }
            linhaInicial += saltoProximaTabela;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const dataHoje = new Date().toISOString().split('T')[0];
        let nomeArquivo = termo === "" ? `Contador_Modular_Export_${dataHoje}.xlsx` : `Contador_Modular_Filtro_${termo}.xlsx`;
        saveAs(blob, nomeArquivo);

    } catch (err) {
        alert("Ocorreu um erro ao gerar a planilha Excel.");
    } finally {
        btn.innerHTML = textoOriginal;
    }
}

const inputData = document.getElementById('input-data');
const hoje = new Date();
inputData.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
processarDataCalendario();

window.lerMensagemWhatsApp = async function() {
    const inputTexto = document.getElementById('texto-whatsapp');
    const texto = inputTexto.value;
    if (!texto || texto.trim() === '') { alert("⚠️ Cole a mensagem padrão do WhatsApp primeiro."); return; }

    let dia, mes; const anoAtual = new Date().getFullYear();
    const regexBarra = /(\d{1,2})\/(\d{1,2})/; const matchBarra = texto.match(regexBarra);
    const regexExtenso = /(\d{1,2})\s*de\s*([a-zA-ZçÇ]+)/i; const matchExtenso = texto.match(regexExtenso);

    if (matchBarra) { dia = parseInt(matchBarra[1], 10); mes = parseInt(matchBarra[2], 10) - 1; } 
    else if (matchExtenso) {
        dia = parseInt(matchExtenso[1], 10); const nomeMes = matchExtenso[2].toLowerCase();
        const mesesMap = { 'janeiro': 0, 'jan': 0, 'fevereiro': 1, 'fev': 1, 'março': 2, 'marco': 2, 'mar': 2, 'abril': 3, 'abr': 3, 'maio': 4, 'mai': 4, 'junho': 5, 'jun': 5, 'julho': 6, 'jul': 6, 'agosto': 7, 'ago': 7, 'setembro': 8, 'set': 8, 'outubro': 9, 'out': 9, 'novembro': 10, 'nov': 10, 'dezembro': 11, 'dez': 11 };
        mes = mesesMap[nomeMes];
        if (mes === undefined) return alert(`❌ Erro de Leitura: Mês "${nomeMes}" inválido.`);
    } else return alert("❌ Erro: Não encontrei uma data válida na mensagem.");

    const dataMensagem = new Date(anoAtual, mes, dia, 12, 0, 0);
    const diaDaSemana = dataMensagem.getDay(); 
    if (diaDaSemana === 0 || diaDaSemana === 6) return alert(`⚠️ O sistema não permite lançamentos em finais de semana.`);

    const diaIndex = diaDaSemana - 1; 
    const mesFormatado = String(mes + 1).padStart(2, '0');
    const diaFormatado = String(dia).padStart(2, '0');
    
    document.getElementById('input-data').value = `${anoAtual}-${mesFormatado}-${diaFormatado}`;
    await window.processarDataCalendario();

    const turnoMatch = texto.match(/(1|2)[º°oO]?\s*turno/i);
    const turno = turnoMatch ? turnoMatch[1] : null;
    if (!turno) return alert("❌ Erro de Leitura: Turno não identificado.");

    const extrairValor = (nomeAreaRegex) => { const regex = new RegExp(`${nomeAreaRegex}:\\s*(\\d+)`, 'i'); const match = texto.match(regex); return match ? parseInt(match[1], 10) : 0; };
    const dadosLidos = { fabricacao: extrairValor("Fabricação"), estrutural: extrairValor("Estrutural"), montagem: extrairValor("Montagem Final"), paineis: extrairValor("Pain[eé]is") };

    try {
        const idxFab = turno === "1" ? 0 : 1; const idxEst = turno === "1" ? 2 : 3; const idxMont = turno === "1" ? 4 : 5; const idxPainel = turno === "1" ? 6 : 7;
        document.getElementById(`in-${idxFab}-${diaIndex}`).value = dadosLidos.fabricacao; document.getElementById(`in-${idxEst}-${diaIndex}`).value = dadosLidos.estrutural;
        document.getElementById(`in-${idxMont}-${diaIndex}`).value = dadosLidos.montagem; document.getElementById(`in-${idxPainel}-${diaIndex}`).value = dadosLidos.paineis;
        alert(`✅ Automação Concluída!\n\nDados do ${turno}º Turno injetados. Verifique e salve.`);
        inputTexto.value = '';
    } catch (error) { alert("❌ Falha na injeção dos dados lidos para a tabela."); }
};

// --- MÁGICA: AUTO-DETECTAR DATA DO RESUMO E LIMPAR WHATSAPP ---
window.processarDataResumo = async function(textoOriginal) {
    // 1. Limpeza Imediata da Formatação do WhatsApp (* _ ~)
    const textoLimpo = textoOriginal.replace(/[*_~]/g, '');
    
    // Atualiza a caixa de texto instantaneamente na tela
    document.getElementById('texto-resumo').value = textoLimpo;

    // 2. Continua com a detecção de data
    const trechoInicial = textoLimpo.substring(0, 100); 
    const regexBarra = /(\d{1,2})\/(\d{1,2})/;
    const regexExtenso = /(\d{1,2})\s*(?:de\s*)?-?\s*([a-zA-ZçÇ]{3,})/i;

    let dia, mes;
    const anoAtual = new Date().getFullYear();

    let matchBarra = trechoInicial.match(regexBarra);
    let matchExtenso = trechoInicial.match(regexExtenso);

    if (matchBarra) {
        dia = parseInt(matchBarra[1], 10);
        mes = parseInt(matchBarra[2], 10) - 1;
    } else if (matchExtenso) {
        dia = parseInt(matchExtenso[1], 10);
        const nomeMes = matchExtenso[2].toLowerCase().replace('ç', 'c');
        const mesesMap = {
            'jan':0, 'fev':1, 'mar':2, 'abr':3, 'mai':4, 'jun':5,
            'jul':6, 'ago':7, 'set':8, 'out':9, 'nov':10, 'dez':11
        };
        for (let key in mesesMap) {
            if (nomeMes.startsWith(key)) { mes = mesesMap[key]; break; }
        }
    }

    if (dia && mes !== undefined) {
        const mesF = String(mes + 1).padStart(2, '0');
        const diaF = String(dia).padStart(2, '0');
        const novaDataStr = `${anoAtual}-${mesF}-${diaF}`;
        
        const inputData = document.getElementById('input-data');
        if (inputData.value !== novaDataStr) {
            inputData.value = novaDataStr;
            
            alert(`✨ Data detectada no Resumo: ${diaF}/${mesF}.\nO sistema carregou a tabela correspondente para você!`);
            
            await window.processarDataCalendario();
            
            // Restaura o texto limpo, pois o banco de dados carregou os números da semana
            document.getElementById('texto-resumo').value = textoLimpo;
        }
    }
};
