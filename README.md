# Digital Voice Shield

Deteção de Clonagem Vocal e Deepfakes de Áudio.

Aplicação de cibersegurança que analisa ficheiros de áudio e fluxos de microfone em tempo real para detetar voz sintética. O sistema extrai 48 features acústicas por amostra (MFCCs, deltas, delta-deltas e features espectrais) e classifica o áudio com um modelo SVM, apresentando ao utilizador um **Índice de Sinteticidade** entre 0 e 100%.

Desenvolvido no âmbito da unidade curricular de Laboratório de Projeto em Engenharia Informática (LPEI), Licenciatura em Engenharia Informática, UTAD - 2025/2026.

---

## Funcionalidades

- **Análise de ficheiro**: upload de `.wav`, `.mp3` ou `.flac`, com espectrograma Mel, métricas acústicas e espectrais, e scores de artefactos de síntese
- **Análise em tempo real**: captura contínua via microfone, com logs forenses de cada análise (probe) e limiar de alerta configurável
- **Histórico e exportação**: histórico de análises da sessão, exportável em PDF (ficheiro) ou CSV (tempo real)

---

## Stack Tecnológico

| Camada | Tecnologias |
|---|---|
| Backend | Python, FastAPI, librosa, scikit-learn |
| Frontend | React, TypeScript, Tailwind CSS |
| Modelo | SVM (kernel RBF), otimizado com GridSearchCV |

---

## Instalação

### Windows

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### Mac/Linux

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

O backend fica disponível em `http://localhost:8000` (documentação Swagger em `/docs`), e o frontend em `http://localhost:5173`.

---

## Resultados do Modelo

O classificador SVM foi treinado sobre 3025 amostras (1513 reais + 1512 sintéticas) provenientes de seis fontes distintas (ASVspoof 2019, Mozilla Common Voice, Edge TTS, Google TTS e ElevenLabs) e otimizado com `GridSearchCV` (kernel RBF, C=10, gamma=scale).

A tabela seguinte apresenta as métricas de desempenho do SVM no conjunto de teste (605 amostras): accuracy, precision, recall e F1-score, que no conjunto dão uma visão completa da eficácia do modelo na classificação. Os resultados mostram um ótimo desempenho, com 93.1% de accuracy e as restantes métricas todas próximas dos 93%.

| Métrica | Valor |
|---|---|
| Accuracy | 93.1% |
| Precision | 93.0% |
| Recall | 93.0% |
| F1-Score | 93.0% |

A matriz de confusão abaixo confirma esse desempenho. Das 605 amostras, apenas 15 áudios reais foram classificados como sintéticos, e 27 sintéticos como reais. Os erros estão distribuídos de forma equilibrada entre as duas classes, o que mostra que o modelo não está enviesado.

<img width="534" height="425" alt="Confusion_Matrix" src="https://github.com/user-attachments/assets/72f48828-bf3b-426f-b656-6d761d18f9a8" />


---

## Estrutura do Projeto

```
digital-voice-shield/
├── backend/
│   ├── analyzer/
│   │   ├── feature_extractor.py
│   │   ├── detector.py
│   │   ├── artifacts.py
│   │   ├── realtime.py
│   │   └── report_generator.py
│   ├── data/
│   ├── models/
│   ├── train.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        ├── hooks/
        ├── services/
        ├── types/
        └── lib/
```

---

## Limitações Conhecidas

- A accuracy do modelo (93.1%) não atinge a meta inicial de 95%, devido à diversidade limitada do dataset face aos sistemas TTS mais recentes;
- A análise em tempo real está limitada à captura via microfone do dispositivo; não há suporte a fluxos VoIP;
- O deploy gratuito (Render Free) está sujeito a *cold start*: a primeira análise após um período de inatividade demora cerca de 3 minutos a devolver resultado (tanto na análise de ficheiro como em tempo real), enquanto a instância do servidor arranca. Análises seguintes respondem em poucos segundos. Em desenvolvimento local (backend e frontend corridos directamente, sem o deploy gratuito), este atraso inicial não existe, onde a primeira análise demora cerca de 13 segundos.
