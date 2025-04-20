const pdf = require('html-pdf-node');
const fs = require('fs');

function generateHTML(user, questions = []) {
    if (!Array.isArray(questions)) {
        console.error('❌ Error: questions is not an array', questions);
        questions = [];
    }

    const answeredHTML = questions.map((q, i) => {
        const ans = user.answers?.find(a => a.id == q.id);
        const selected = ans?.selected || 'N/A';
        const correct = q.answer;

        const optionsHtml = q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let classes = '';
            if (opt === correct) classes += ' correct';
            if (opt === selected) {
                classes += ' selected';
                if (opt !== correct) classes += ' wrong';
            }            

            return `<li class="${classes}">${letter}. ${opt}</li>`;
        }).join('');

        return `
            <div class="question">
                ${q.image_url ? `<img src="${q.image_url}" />` : ''}
                <h3>Q${i + 1}. ${q.question}</h3>
                <ul class="options">${optionsHtml}</ul>
                ${q.explanation ? `<p class="explanation">🧠 ${q.explanation}</p>` : ''}
                <hr/>
            </div>`;
    }).join('');

    return `
    <html>
        <head>
            <style>
                body { font-family: sans-serif; padding: 30px; }
                .question { margin-bottom: 20px; }
                .options li { margin-bottom: 5px; }
                .correct { color: green; font-weight: bold; }
                .wrong { color: red; }
                .selected { text-decoration: underline; }
                img { max-width: 300px; max-height: 300px; margin: 10px 0; }
                .explanation { font-style: italic; color: gray; }
            </style>
        </head>
        <body>
            <h1>📄 Exam Report for ${user.firstName}</h1>
            <p>Score: <strong>${user.score}</strong> out of <strong>${questions.length}</strong></p>
            ${answeredHTML}
        </body>
    </html>`;
}

async function generatePDFReport(user) {
    const html = generateHTML(user, user.examQuestions); // your function above
    const file = { content: html };

    const pdfBuffer = await pdf.generatePdf(file, { format: 'A4' });
    const filename = `report_${user.chatId}_${Date.now()}.pdf`;

    const filepath = `./reports/${filename}`;
    fs.writeFileSync(filepath, pdfBuffer);

    return filepath;
}

module.exports = {
    generatePDFReport
}
