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
        
        const txtT1 = document.getElementById('texto-resumo-t1');
        const txtT2 = document.getElementById('texto-resumo-t2');

        if (docSnap.exists()) {
            dadosAtuais = docSnap.data().dados;
            // Se tiver resumo antigo não mapeado, joga pro T1 pra não perder
            if(txtT1) txtT1.value = docSnap.data().resumo_t1 || docSnap.data().resumo || "";
            if(txtT2) txtT2.value = docSnap.data().resumo_t2 || "";
        } else {
            dadosAtuais = getEstruturaZerada();
            if(txtT1) txtT1.value = "";
            if(txtT2) txtT2.value = "";
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

    const txtT1 = document.getElementById('texto-resumo-t1');
    const txtT2 = document.getElementById('texto-resumo-t2');
    
    const resumoT1 = txtT1 ? txtT1.value.replace(/[*_~]/g, '').trim() : "";
    const resumoT2 = txtT2 ? txtT2.value.replace(/[*_~]/g, '').trim() : "";

    try {
        await setDoc(doc(db, COLECAO_BD, chaveBancoAtual), {
            dados: dadosAtuais,
            resumo_t1: resumoT1,
            resumo_t2: resumoT2,
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
                id: doc.id, 
                dados: doc.data().dados, 
                resumo_t1: doc.data().resumo_t1 || doc.data().resumo || "", 
                resumo_t2: doc.data().resumo_t2 || "", 
                atualizado: doc.data().ultimaAtualizacao
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
        
        accContent.innerHTML = gerarHTMLCardsResponsivos(item.dados, item.resumo_t1, item.resumo_t2); 

        accHeader.onclick = () => { accItem.classList.toggle('active'); };
        accItem.appendChild(accHeader); accItem.appendChild(accContent); container.appendChild(accItem);
    });
}

function gerarHTMLCardsResponsivos(dadosDaSemana, resumoT1, resumoT2) {
    let totaisDias = [0, 0, 0, 0, 0]; 
    let totalGeralSemana = 0;
    
    let html = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
    const areas = ['Fabricação', 'Estrutural', 'Mont. Final', 'Painéis'];
    const diasNomes = ['seg', 'ter', 'qua', 'qui', 'sex'];

    areas.forEach(nomeArea => {
        html += `<div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">`;
        html += `<div style="background: #f8fafc; padding: 10px 15px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border);"><i class="fa-solid fa-layer-group" style="color: var(--primary); margin-right: 8px;"></i>${nomeArea}</div>`;
        
        ['1º', '2º'].forEach(nomeTurno => {
            const linha = dadosDaSemana.find(d => d.area === nomeArea && d.turno === nomeTurno);
            if(linha) {
                let somaLinha = 0; 
                let cellsHtml = '';
                
                linha.dias.forEach((val, i) => {
                    let num = val === "" ? 0 : parseInt(val);
                    somaLinha += num; 
                    totaisDias[i] += num;
                    cellsHtml += `
                    <div style="display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 6px 2px; border-radius: 6px; border: 1px solid var(--border);">
                        <span style="font-size: 0.65rem; font-weight: 600; color: var(--text-light); text-transform: uppercase;">${diasNomes[i]}</span>
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1rem; margin-top: 2px;">${val === "" ? "-" : val}</span>
                    </div>`;
                });
                
                totalGeralSemana += somaLinha;

                cellsHtml += `
                    <div style="display: flex; flex-direction: column; align-items: center; background: #eff6ff; padding: 6px 2px; border-radius: 6px; border: 1px solid #bfdbfe;">
                        <span style="font-size: 0.65rem; font-weight: 700; color: var(--primary-dark); text-transform: uppercase;">Tot</span>
                        <span style="font-weight: 700; color: var(--primary-dark); font-size: 1rem; margin-top: 2px;">${somaLinha}</span>
                    </div>`;

                html += `
                <div style="padding: 10px 15px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 600; font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">${nomeTurno} TURNO</div>
                    <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px;">
                        ${cellsHtml}
                    </div>
                </div>`;
            }
        });
        html += `</div>`;
    });

    html += `
    <div style="border: 2px solid var(--primary-dark); border-radius: 8px; overflow: hidden; margin-top: 0.5rem;">
        <div style="background: var(--primary-dark); padding: 10px; font-weight: 700; color: white; text-align: center; font-size: 0.9rem;">TOTAL GERAL DA SEMANA</div>
        <div style="padding: 10px 15px; background: #f8fafc;">
            <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px;">`;
    
    for(let i=0; i<5; i++) {
        html += `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 0.65rem; font-weight: 600; color: var(--text-light); text-transform: uppercase;">${diasNomes[i]}</span>
                    <span style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${totaisDias[i]}</span>
                </div>`;
    }
    
    html += `
                <div style="display: flex; flex-direction: column; align-items: center; background: var(--primary); border-radius: 6px; padding: 4px 0;">
                    <span style="font-size: 0.65rem; font-weight: 700; color: #e0e7ff; text-transform: uppercase;">Total</span>
                    <span style="font-weight: 700; color: white; font-size: 1.1rem;">${totalGeralSemana}</span>
                </div>
            </div>
        </div>
    </div></div>`;

    // JUNTA OS DOIS RESUMOS NA MESMA SANFONA
    if (resumoT1 || resumoT2) {
        let textoCombinadoHTML = "";
        if (resumoT1) {
            textoCombinadoHTML += `<strong style="color: var(--primary-dark); text-transform: uppercase; font-size: 0.85rem;">■ 1º TURNO:</strong><br>${resumoT1}`;
        }
        if (resumoT2) {
            if(resumoT1) textoCombinadoHTML += `<br><br>`; // Dá um espaço se os dois existirem
            textoCombinadoHTML += `<strong style="color: var(--primary-dark); text-transform: uppercase; font-size: 0.85rem;">■ 2º TURNO:</strong><br>${resumoT2}`;
        }

        html += `
        <details style="margin-top: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <summary style="padding: 12px 15px; font-weight: 700; color: var(--brand-dark); cursor: pointer; outline: none;">
                <i class="fa-solid fa-align-left" style="color: var(--primary); margin-right: 8px;"></i> Resumo Gerencial da Semana <span style="font-size: 0.8rem; color: var(--text-light); font-weight: 500; margin-left: 5px;">(Toque para ler)</span>
            </summary>
            <div style="padding: 15px; border-top: 1px solid var(--border); white-space: pre-wrap; font-size: 0.95rem; color: var(--text-main); line-height: 1.6; background: #f8fafc;">${textoCombinadoHTML}</div>
        </details>`;
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

            // COMBINA OS TEXTOS PARA O EXCEL
            let textoCombinadoExcel = "";
            if (item.resumo_t1) textoCombinadoExcel += "[1º TURNO]\n" + item.resumo_t1 + "\n\n";
            if (item.resumo_t2) textoCombinadoExcel += "[2º TURNO]\n" + item.resumo_t2;
            textoCombinadoExcel = textoCombinadoExcel.trim();

            let saltoProximaTabela = 12; 

            if (textoCombinadoExcel) {
                const linhaResumo = linhaFinal + 2; 
                const linhaResumoFim = linhaResumo + 6; 
                worksheet.mergeCells(`A${linhaResumo}:I${linhaResumoFim}`);
                
                const cellR = worksheet.getCell(`A${linhaResumo}`);
                cellR.value = "📝 RESUMO GERENCIAL DA SEMANA:\n\n" + textoCombinadoExcel;
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

window.processarDataResumo = async function(elementId) {
    const el = document.getElementById(elementId);
    const textoOriginal = el.value;
    const textoLimpo = textoOriginal.replace(/[*_~]/g, '');
    el.value = textoLimpo;

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
            // Restaura o texto colado após a troca de semana
            document.getElementById(elementId).value = textoLimpo;
        }
    }
};
