const languageMap = {
  "py": 71,
  "java": 62,
  "cpp": 54,
  "c": 50,
  "js": 63
};

const monacoLangMap = {
  54: "cpp",
  62: "java",
  71: "python",
  63: "javascript",
  50: "c"
};

let editor;

// Load Monaco Editor
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'cpp',
    theme: 'vs-dark',
    automaticLayout: true
  });
});

// Change Monaco language when dropdown changes
document.getElementById("language").addEventListener("change", () => {
  const langId = document.getElementById("language").value;
  const lang = monacoLangMap[langId];
  if (editor && lang) {
    monaco.editor.setModelLanguage(editor.getModel(), lang);
  }
});

// Handle file input
document.getElementById("codeFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    editor.setValue(e.target.result);
    const ext = file.name.split('.').pop();
    const detectedLangId = languageMap[ext];
    if (detectedLangId) {
      document.getElementById("language").value = detectedLangId;
      monaco.editor.setModelLanguage(editor.getModel(), monacoLangMap[detectedLangId]);
    }
  };
  reader.readAsText(file);
});

// Drag & drop support
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('codeFile');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  fileInput.files = e.dataTransfer.files;

  const reader = new FileReader();
  reader.onload = function (event) {
    editor.setValue(event.target.result);
    const ext = file.name.split('.').pop();
    const detectedLangId = languageMap[ext];
    if (detectedLangId) {
      document.getElementById("language").value = detectedLangId;
      monaco.editor.setModelLanguage(editor.getModel(), monacoLangMap[detectedLangId]);
    }
  };
  reader.readAsText(file);
});

// Run code function
const runCode = async () => {
  const sourceCode = editor.getValue();
  const languageId = document.getElementById("language").value;
  const input = document.getElementById("input").value;
  const outputEl = document.getElementById("output");

  if (!sourceCode.trim()) {
    outputEl.textContent = "Please write or upload some code.";
    return;
  }

  outputEl.textContent = "Running...";

  try {
    const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": "771c02bf9amshd8a4ff179f8179dp162c9fjsnbfe4a2487057" // replace with your key
      },
      body: JSON.stringify({
        source_code: sourceCode,
        stdin: input,
        language_id: parseInt(languageId)
      })
    });

    const { token } = await response.json();

    setTimeout(async () => {
      const result = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "x-rapidapi-key": "771c02bf9amshd8a4ff179f8179dp162c9fjsnbfe4a2487057"
        }
      });

      const data = await result.json();
      if (data.stdout) {
        outputEl.textContent = data.stdout;
      } else if (data.stderr) {
        outputEl.textContent = "Error:\n" + data.stderr;
      } else {
        outputEl.textContent = "Compilation Error:\n" + data.compile_output;
      }
    }, 3000);
  } catch (err) {
    outputEl.textContent = "Something went wrong: " + err.message;
  }
};

// Connect run icon
document.getElementById("runIconBtn").addEventListener("click", runCode);
