document.addEventListener("DOMContentLoaded", () => {
  const quizContainer = document.querySelector(".quiz-container");
  const introScreen = document.querySelector(".intro-screen");
  const nameScreen = document.getElementById("nameScreen"); // New: Get name screen
  const quizScreen = document.querySelector(".quiz-screen");
  const wheelScreen = document.querySelector(".wheel-screen");
  const resultScreen = document.querySelector(".result-screen");

  const nameInput = document.getElementById("userNameInput"); // New: Get name input
  const continueWithNameButton = document.getElementById("continueWithName"); // New: Get continue with name button
  const continueSimplifiedButton =
    document.getElementById("continueSimplified"); // New: Get simplified button
  const startButton = document.querySelector(".start-button");
  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const optionsContainer = document.querySelector(".options-container");
  const nextButton = document.querySelector(".next-button");
  const quizProgressSection = document.querySelector(".quiz-progress-section"); // New: Get the quiz progress section
  const progressBarElements = document.querySelectorAll(".progress-bar");
  const pointsDisplay = document.querySelector(".points-display");
  const resultTitle = document.getElementById("result-title");
  const recommendationsContainer = document.querySelector(
    ".recommendations-container",
  );
  const timerElement = document.getElementById("timer");
  const confettiContainer = document.getElementById("confetti-container");

  // Audio context for immediate sound response (like the wheel)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  let userName = ""; // Default name is now an empty string
  let currentQuestionIndex = 0;
  let userAnswers = {};
  let userPoints = 0; // Initialize user points
  let userDiscount = 0; // Initialize user discount
  let timerInterval;

  // Function to play immediate click sound (like the wheel)
  function playClickSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.05,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.06);
  }

  // Function to create and display points feedback
  function createPointsFeedback(points, targetElement) {
    if (!targetElement) return;

    const feedbackElement = document.createElement("div");
    feedbackElement.classList.add("points-feedback");
    feedbackElement.textContent = `+${points} PONTOS`;

    document.body.appendChild(feedbackElement); // Append first to get dimensions

    // Position the feedback element next to the target element
    const rect = targetElement.getBoundingClientRect();

    // Calculate horizontal position: left edge of popup at 10% from the left edge of the button
    const leftPosition = rect.left + rect.width * 0.1;

    // Calculate vertical position: top edge of popup at 60% from the top edge of the button
    const topPosition = rect.top + window.scrollY + rect.height * 0.6;

    feedbackElement.style.position = "absolute";
    feedbackElement.style.left = `${leftPosition}px`;
    feedbackElement.style.top = `${topPosition}px`;
    feedbackElement.style.zIndex = "10000";

    // Animate out and remove
    setTimeout(() => {
      feedbackElement.classList.add("fade-out");
      feedbackElement.style.transform = "translateY(-20px)"; // Move up
    }, 50);

    setTimeout(() => {
      feedbackElement.remove();
    }, 2500); // Remove after 2.5 seconds
  }

  // Function to launch confetti
  function launchConfetti() {
    if (!confettiContainer) return;

    const colors = [
      "#ffeb3b",
      "#ff9800",
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
    ];
    const numConfetti = 50;

    for (let i = 0; i < numConfetti; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confettiContainer.appendChild(confetti);
    }

    setTimeout(() => {
      confettiContainer.innerHTML = ""; // Clear confetti after some time
    }, 5000);
  }

  const quizData = [
    {
      type: "question",
      question: "Olá, {userName}! Qual sua experiência com charutos?",
      image: "https://i.ibb.co/JrLTWTy/1.jpg",
      options: [
        {
          text: "🆕 Sou iniciante, nunca fumei",
          value: "iniciante",
          points: 10,
        },
        { text: "🔄 Fumo ocasionalmente", value: "ocasional", points: 20 },
        {
          text: "🎯 Sou conhecedor/aficionado",
          value: "conhecedor",
          points: 30,
        },
        { text: "🤔 Apenas curioso por enquanto", value: "curioso", points: 5 },
      ],
    },
    {
      type: "break",
      content:
        "🎯 Cada pessoa tem um perfil único, {userName}. Vamos descobrir o seu!",
      image: "https://i.ibb.co/Y4g3vrw/2.jpg",
    },
    {
      type: "question",
      question: "Que tipo de bebida você mais aprecia?",
      image: "https://i.ibb.co/FB7v9gG/3.jpg",
      options: [
        { text: "🥃 Whisky", value: "whisky", points: 25 },
        { text: "🥂 Rum", value: "rum", points: 20 },
        { text: "🍷 Vinho Tinto", value: "vinho", points: 15 },
        { text: "☕ Café", value: "cafe", points: 10 },
        { text: "🍺 Cerveja artesanal", value: "cerveja", points: 18 },
        { text: "🚫 Não costumo beber", value: "nao-bebo", points: 5 },
      ],
    },
    {
      type: "break",
      content:
        "🍷 A arte da harmonização perfeita: <br/><br/> 🥃 Whisky + Charutos Cubanos = Notas de carvalho <br/> 🥂 Rum + Charutos Dominicanos = Doçura equilibrada <br/> 🍷 Vinho + Charutos Nicaraguenses = Complexidade única",
      image:
        "https://assets.website-files.com/62c8e30903328e1245787679/62d98d8d3844f2e519c5c179_charutos-cubanos-online-p-800.jpeg",
    },
    {
      type: "question",
      question: "Como você descreveria seu paladar ideal?",
      image: "https://i.ibb.co/njzLbXm/5.jpg",
      options: [
        { text: "🍃 Suave e aromático", value: "suave", points: 10 },
        { text: "🌳 Médio com notas amadeiradas", value: "medio", points: 20 },
        { text: "🔥 Encorpado e intenso", value: "encorpado", points: 30 },
        {
          text: "❓ Não sei ainda, preciso de sugestões",
          value: "nao-sei",
          points: 15,
        },
      ],
    },
    {
      type: "break",
      content:
        "🎯 Como um bom vinho, cada charuto conta uma história única através de seus sabores",
      image: "https://optimizer.dooca.store/479/files/screenshot-20220722-135957-chrome.jpg",
    },
    {
      type: "question",
      question: "Em qual ocasião você planeja degustar?",
      image: "https://i.ibb.co/RB9GS33/6.jpg",
      options: [
        {
          text: "🧘‍♂️ Momento de relaxamento pessoal",
          value: "relaxamento",
          points: 20,
        },
        { text: "🎉 Celebração especial", value: "celebracao", points: 25 },
        { text: "👥 Reunião com amigos", value: "amigos", points: 15 },
        { text: "🍽️ Após um jantar", value: "jantar", points: 18 },
        { text: "🎯 Apenas experimentar", value: "experimentar", points: 10 },
      ],
    },
    {
      type: "question",
      question: "Quanto tempo para sua experiência?",
      image: "https://i.ibb.co/qMZnLsY/7.jpg",
      options: [
        { text: "⏱️ 20-30 minutos", value: "20-30min", points: 10 },
        { text: "⏰ 45-60 minutos", value: "45-60min", points: 20 },
        { text: "🕐 Mais de 1 hora", value: "1hr+", points: 30 },
        {
          text: "🤔 Não tenho preferência",
          value: "sem-preferencia-tempo",
          points: 15,
        },
      ],
    },
    {
      type: "question",
      question: "Qual a faixa de investimento considerada?",
      image: "https://i.ibb.co/MRcYSY5/9.jpg",
      options: [
        { text: "💰 Até R$ 50", value: "ate-50", points: 10 },
        { text: "💰💰 R$ 50-100", value: "50-100", points: 20 },
        { text: "💰💰💰 R$ 100-200", value: "100-200", points: 30 },
        { text: "💎 Acima de R$ 200", value: "acima-200", points: 40 },
        { text: "🤫 Prefiro não informar", value: "nao-informar", points: 5 },
      ],
    },
    {
      type: "break",
      content: "Analisando suas respostas",
      image: "https://c.tenor.com/oJKQsEPQrYIAAAAd/tenor.gif",
      specialProgressBar: true, // Flag to identify this special break
    },
  ];

  const recommendations = [
    {
      name: "Charuto Cubano Clássico",
      origin: "Cuba 🇨🇺",
      flavor:
        "🌟 Perfil de sabor: Notas amadeiradas, terrosas e um toque de especiarias.",
      time: "⏱️ Tempo de degustação: 45-60 minutos",
      pairing:
        "🍷 Harmonização: Ideal com Whisky Single Malt ou Rum envelhecido.",
      price: "💰 Preço especial: R$ 85,00",
      minPoints: 100, // Example point threshold
    },
    {
      name: "Charuto Dominicano Suave",
      origin: "República Dominicana 🇩🇴",
      flavor:
        "🌟 Perfil de sabor: Leve e cremoso, com notas de baunilha e cedro.",
      time: "⏱️ Tempo de degustação: 30-45 minutos",
      pairing:
        "🍷 Harmonização: Perfeito com Café gourmet ou Vinho Branco suave.",
      price: "💰 Preço especial: R$ 60,00",
      minPoints: 50,
    },
    {
      name: "Charuto Nicaraguense Intenso",
      origin: "Nicarágua 🇳🇮",
      flavor:
        "🌟 Perfil de sabor: Encorpado, com notas de pimenta, cacau e café.",
      time: "⏱️ Tempo de degustação: Mais de 1 hora",
      pairing:
        "🍷 Harmonização: Excelente com Vinho Tinto encorpado ou Cerveja Artesanal escura.",
      price: "💰 Preço especial: R$ 110,00",
      minPoints: 75,
    },
  ];

  function updateProgressBar(progress) {
    progressBarElements.forEach((bar) => {
      bar.style.width = `${progress}%`;
    });
  }

  function updatePointsDisplay() {
    pointsDisplay.textContent = `${userPoints} PONTOS`;
  }

  function showScreen(screen) {
    introScreen.style.display = "none";
    nameScreen.style.display = "none"; // New: Hide name screen
    quizScreen.style.display = "none";
    wheelScreen.style.display = "none";
    resultScreen.style.display = "none";
    screen.style.display = "block";
  }

  function startQuiz() {
    playClickSound(); // Play sound on start button click
    showScreen(nameScreen); // New: Go to name screen instead of quiz screen
    currentQuestionIndex = 0;
    userPoints = 0; // Reset points for a new quiz
    updatePointsDisplay();
  }

  function loadQuestion() {
    if (currentQuestionIndex < quizData.length) {
      const item = quizData[currentQuestionIndex];
      updateProgressBar(((currentQuestionIndex + 1) / quizData.length) * 100);

      // Always show progress section and points display by default
      quizProgressSection.style.display = "flex";
      pointsDisplay.style.display = "block";

      if (item.type === "question") {
        if (currentQuestionIndex === 0) {
          launchConfetti(); // Launch confetti on the first question
        }
        questionText.innerHTML = item.question.replace(/{userName}/g, userName); // Replace placeholder
        questionImage.src = item.image || ""; // Set image source
        questionImage.style.display = item.image ? "block" : "none"; // Show if image exists
        optionsContainer.innerHTML = "";
        item.options.forEach((option) => {
          const optionElement = document.createElement("div");
          optionElement.classList.add("option");
          optionElement.innerHTML = `<span class="option-icon">${option.text.split(" ")[0]}</span>${option.text.substring(option.text.indexOf(" ") + 1)}`;
          optionElement.dataset.value = option.value;
          optionElement.dataset.points = option.points; // Store points
          optionElement.addEventListener("click", () => {
            playClickSound(); // Play sound on option click
            selectOption(optionElement, item.question);
          });
          optionsContainer.appendChild(optionElement);
        });
        nextButton.style.display = "none"; // Ensure next button is always hidden for questions
        nextButton.classList.remove("break-mode"); // Remove break mode class for questions
      } else if (item.type === "break") {
        questionText.innerHTML = `<div class="break-section"><p>${item.content.replace(/{userName}/g, userName)}</p></div>`; // Replace placeholder
        questionImage.src = item.image || "";
        questionImage.style.display = item.image ? "block" : "none";
        optionsContainer.innerHTML = "";

        if (item.specialProgressBar) {
          // Hide top progress bar and points display for this special break
          quizProgressSection.style.display = "none";
          pointsDisplay.style.display = "none";

          // Create and animate special progress bar
          const specialProgressBarContainer = document.createElement("div");
          specialProgressBarContainer.classList.add(
            "special-progress-bar-container",
          );
          const specialProgressBar = document.createElement("div");
          specialProgressBar.classList.add("special-progress-bar");
          specialProgressBarContainer.appendChild(specialProgressBar);
          optionsContainer.appendChild(specialProgressBarContainer); // Append to optionsContainer

          // Animate the bar
          let progress = 0;
          const interval = setInterval(() => {
            if (progress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                nextQuestion(null); // Automatically advance, no element clicked
              }, 500); // Small delay before advancing
            } else {
              progress += 2; // Adjust speed here
              specialProgressBar.style.width = `${progress}%`;
            }
          }, 100); // Update every 100ms (slower animation)

          nextButton.style.display = "none"; // Hide next button for auto-advance breaks
          nextButton.classList.remove("break-mode"); // Remove break mode class for auto-advance breaks
        } else {
          nextButton.style.display = "block"; // Original behavior for other breaks
          nextButton.textContent = "Continuar ✨";
          nextButton.classList.add("break-mode"); // Add break mode class for consistent styling
        }
      }
    } else {
      showResult();
    }
  }

  function selectOption(selectedOption, question) {
    // Remove 'selected' from all options for the current question
    Array.from(optionsContainer.children).forEach((option) => {
      option.classList.remove("selected");
    });
    selectedOption.classList.add("selected");
    userAnswers[question] = {
      value: selectedOption.dataset.value,
      points: parseInt(selectedOption.dataset.points),
    };
    // For question types, automatically advance. For break types, show the next button.
    const currentItem = quizData[currentQuestionIndex];
    if (currentItem.type === "question") {
      nextQuestion(selectedOption); // Pass selectedOption
    } else if (currentItem.type === "break") {
      nextButton.style.display = "block";
      nextButton.textContent = "Continuar ✨";
      nextButton.classList.add("break-mode"); // Add break mode class for consistent styling
    }
  }

  function nextQuestion(selectedElement = null) {
    // Receive selectedElement
    const currentItem = quizData[currentQuestionIndex];
    if (currentItem.type === "question") {
      const pointsEarned = userAnswers[currentItem.question].points; // Get points earned for this question
      userPoints += pointsEarned; // Add points
      updatePointsDisplay();
      if (selectedElement) {
        createPointsFeedback(pointsEarned, selectedElement); // Show feedback
      }
    }
    currentQuestionIndex++;
    if (currentQuestionIndex >= quizData.length) {
      // Quiz finished, show wheel instead of result
      showWheel();
    } else {
      loadQuestion();
    }
  }

  function showWheel() {
    showScreen(wheelScreen);
    updateProgressBar(100);

    // Update the welcome message with user's name
    const wheelTitle = wheelScreen.querySelector("h2");
    if (wheelTitle) {
      wheelTitle.textContent = `🎯 ${userName}, você ganhou uma chance especial!`;
    }

    // Initialize the wheel
    if (window.roleta && typeof window.roleta.init === "function") {
      window.roleta.init();
    }
  }

  function showResult() {
    showScreen(resultScreen);
    resultTitle.textContent = `🎯 ${userName}, selecionamos estas recomendações exclusivas:`; // Use userName
    recommendationsContainer.innerHTML = "";

    // Filter recommendations based on user points
    const filteredRecommendations = recommendations.filter(
      (rec) => userPoints >= rec.minPoints,
    );

    if (filteredRecommendations.length > 0) {
      filteredRecommendations.forEach((rec) => {
        const recElement = document.createElement("div");
        recElement.classList.add("recommendation-item");
        recElement.innerHTML = `
                    <h3>${rec.name}</h3>
                    <p><strong>📍 Origem:</strong> ${rec.origin}</p>
                    <p>${rec.flavor}</p>
                    <p>${rec.time}</p>
                    <p>${rec.pairing}</p>
                    <p>${rec.price}</p>
                    <button class="cta-button small-cta">Garantir Este 🎯</button>
                `;
        recommendationsContainer.appendChild(recElement);
      });
    } else {
      recommendationsContainer.innerHTML =
        "<p>Não encontramos recomendações com base nas suas respostas. Por favor, tente novamente!</p>";
    }

    startTimer(15 * 60); // 15 minutes
  }

  // Roleta class implementation (original version)
  class Roleta {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.spinButton = null;
      this.resultDiv = null;

      // Configuração do áudio para som de roleta
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.tickSound = null;
      this.lastTickTime = 0;
      this.tickInterval = null;

      this.opcoes = ["10% OFF", "20% OFF", "30% OFF", "40% OFF"];
      this.cores = ["#d4a574", "#c4b097", "#b8a085", "#a89375"];
      this.descontos = [10, 20, 30, 40];

      this.anguloAtual = 0;
      this.girando = false;
      this.duracaoAnimacao = 3000;
      this.inicioAnimacao = 0;

      this.initialized = false;
    }

    init() {
      this.canvas = document.getElementById("wheel");
      if (!this.canvas) {
        console.error("Canvas não encontrado");
        return false;
      }

      this.ctx = this.canvas.getContext("2d");
      this.spinButton = document.getElementById("spin-wheel");
      this.resultDiv = document.getElementById("wheel-result");

      if (!this.spinButton) {
        console.error("Botão de girar não encontrado");
        return false;
      }

      this.spinButton.addEventListener("click", () => this.girar());
      this.desenharRoleta();
      this.initialized = true;
      console.log("Roleta inicializada com sucesso");
      return true;
    }

    desenharRoleta() {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const radius = 140;
      const setorAngulo = (2 * Math.PI) / this.opcoes.length;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Desenhar círculo externo branco
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
      this.ctx.strokeStyle = "#e8e2d9";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Desenhar setores
      for (let i = 0; i < this.opcoes.length; i++) {
        const anguloInicio = i * setorAngulo + this.anguloAtual;
        const anguloFim = (i + 1) * setorAngulo + this.anguloAtual;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, anguloInicio, anguloFim);
        this.ctx.closePath();

        // Gradient para cada setor
        const gradient = this.ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius,
        );
        gradient.addColorStop(0, this.lightenColor(this.cores[i], 0.2));
        gradient.addColorStop(1, this.cores[i]);

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Separadores brancos
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 3;

        this.ctx.stroke();

        // Texto
        const anguloTexto = anguloInicio + setorAngulo / 2;
        const textRadius = radius * 0.65;
        const textX = centerX + Math.cos(anguloTexto) * textRadius;
        const textY = centerY + Math.sin(anguloTexto) * textRadius;

        this.ctx.save();
        this.ctx.translate(textX, textY);
        this.ctx.rotate(anguloTexto + Math.PI / 2);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font =
          "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowColor = "rgba(0,0,0,0.3)";
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.fillText(this.opcoes[i], 0, 0);

        this.ctx.restore();
      }

      // Centro dourado
      const centerGradient = this.ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        25,
      );
      centerGradient.addColorStop(0, "#f4e4c1");
      centerGradient.addColorStop(1, "#d4a574");

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      this.ctx.fillStyle = centerGradient;
      this.ctx.fill();

      // Borda branca do centro
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 4;
      this.ctx.stroke();

      // Círculo interno menor
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#8b6f47";
      this.ctx.fill();
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    lightenColor(color, factor) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
    }

    girar() {
      if (this.girando) return;

      this.girando = true;
      this.spinButton.disabled = true;
      this.resultDiv.textContent = "Girando...";

      // Iniciar som de tick-tack da roleta
      this.ultimoAngulo = this.anguloAtual;
      this.ultimoTempo = Date.now();

      const rotacaoMinima = 5 * 2 * Math.PI;
      const rotacaoExtra = Math.random() * 4 * Math.PI;
      const rotacaoTotal = rotacaoMinima + rotacaoExtra;

      this.inicioAnimacao = Date.now();
      const inicio = this.inicioAnimacao;

      const animar = () => {
        const tempoDecorrido = Date.now() - inicio;
        const progresso = Math.min(tempoDecorrido / this.duracaoAnimacao, 1);

        const progressoEased = 1 - Math.pow(1 - progresso, 3);

        this.anguloAtual = progressoEased * rotacaoTotal;
        this.desenharRoleta();

        // Controlar som baseado na velocidade real da roleta
        this.controlarSomBaseadoNaVelocidade();

        if (progresso < 1) {
          requestAnimationFrame(animar);
        } else {
          this.finalizarGiro();
        }
      };

      requestAnimationFrame(animar);
    }

    controlarSomBaseadoNaVelocidade() {
      const agora = Date.now();
      const tempoDecorrido = agora - this.ultimoTempo;

      if (tempoDecorrido > 0) {
        // Calcular velocidade angular (radianos por segundo)
        const deltaAngulo = this.anguloAtual - this.ultimoAngulo;
        const velocidade = Math.abs(deltaAngulo) / (tempoDecorrido / 1000);

        // Só tocar som se a velocidade for significativa
        if (
          velocidade > 0.5 &&
          agora - this.lastTickTime > this.calcularIntervaloSom(velocidade)
        ) {
          this.tocarTickSom(velocidade);
          this.lastTickTime = agora;
        }

        this.ultimoAngulo = this.anguloAtual;
        this.ultimoTempo = agora;
      }
    }

    calcularIntervaloSom(velocidade) {
      // Intervalo entre ticks baseado na velocidade (mais rápido quando mais veloz)
      const intervaloMinimo = 50; // ms (máxima velocidade)
      const intervaloMaximo = 300; // ms (mínima velocidade)
      return (
        intervaloMinimo +
        (intervaloMaximo - intervaloMinimo) * (1 - Math.min(velocidade / 20, 1))
      );
    }

    tocarTickSom(velocidade) {
      // Frequência baseada na velocidade (mais agudo quando mais rápido)
      const frequenciaMinima = 400; // Hz
      const frequenciaMaxima = 1200; // Hz
      const frequencia =
        frequenciaMinima +
        (frequenciaMaxima - frequenciaMinima) * Math.min(velocidade / 30, 1);

      // Volume baseado na velocidade (mais alto quando mais rápido)
      const volume = 0.08 + 0.04 * Math.min(velocidade / 25, 1);

      if (this.tickSound) {
        this.tickSound.stop();
      }

      this.tickSound = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      this.tickSound.type = "sine";
      this.tickSound.frequency.setValueAtTime(
        frequencia,
        this.audioContext.currentTime,
      );

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 0.04,
      );

      this.tickSound.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      this.tickSound.start();
      this.tickSound.stop(this.audioContext.currentTime + 0.05);
    }

    pararSom() {
      // Parar qualquer som atual
      if (this.tickSound) {
        this.tickSound.stop();
        this.tickSound = null;
      }
    }

    finalizarGiro() {
      this.girando = false;
      this.spinButton.disabled = false;

      // Parar som de tick-tack da roleta
      this.pararSom();

      // Som final quando para completamente
      this.tocarSomFinal();

      // Lançar confetes e tocar som de vitória estilo Duolingo
      this.tocarSomVitoria();
      launchConfetti();
    }

    tocarSomFinal() {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 0.2,
      );

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.25);

      const setorAngulo = (2 * Math.PI) / this.opcoes.length;

      // Cálculo correto: o ponteiro está no topo (90 graus = π/2)
      // Precisamos ajustar o ângulo para que o topo seja o ponto de referência
      const anguloAjustado = (this.anguloAtual + Math.PI / 2) % (2 * Math.PI);
      const anguloNormalizado = (2 * Math.PI - anguloAjustado) % (2 * Math.PI);

      // As opções são desenhadas em ordem horária a partir do topo
      const indiceVencedor =
        Math.floor(anguloNormalizado / setorAngulo) % this.opcoes.length;

      const resultado = this.opcoes[indiceVencedor];
      const desconto = this.descontos[indiceVencedor];

      this.resultDiv.textContent = `🎉 Parabéns! Você ganhou ${desconto}% de desconto!`;

      // Add discount to user data
      userDiscount = desconto;

      // Animação de resultado
      this.resultDiv.style.animation = "bounce 0.6s ease-out";
      setTimeout(() => {
        this.resultDiv.style.animation = "";
      }, 600);

      // Auto-proceed to results after 3 seconds
      setTimeout(() => {
        showResult();
      }, 3000);
    }

    tocarSomVitoria() {
      // Som de vitória estilo Duolingo - mais animado e celebratório
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Primeira nota (mais aguda)
      oscillator1.type = "sine";
      oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime); // Lá5

      // Segunda nota (mais grave)
      oscillator2.type = "sine";
      oscillator2.frequency.setValueAtTime(
        659,
        this.audioContext.currentTime + 0.1,
      ); // Mi5

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 0.3,
      );

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator1.start();
      oscillator2.start(this.audioContext.currentTime + 0.1);

      oscillator1.stop(this.audioContext.currentTime + 0.3);
      oscillator2.stop(this.audioContext.currentTime + 0.4);
    }

    drawOnShow() {
      if (this.initialized) {
        this.desenharRoleta();
      }
    }
  }

  // Create global roleta instance
  window.roleta = new Roleta();

  // Add event listener for wheel screen visibility
  const wheelObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "style") {
        const displayStyle = window.getComputedStyle(wheelScreen).display;
        if (displayStyle !== "none" && window.roleta) {
          window.roleta.drawOnShow();
        }
      }
    });
  });

  if (wheelScreen) {
    wheelObserver.observe(wheelScreen, { attributes: true });
  }

  function startTimer(duration) {
    let timer = duration;
    let minutes, seconds;
    timerInterval = setInterval(() => {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      timerElement.textContent = minutes + ":" + seconds;

      if (--timer < 0) {
        clearInterval(timerInterval);
        timerElement.textContent = "Tempo Esgotado!";
        // Optionally disable CTA or show a message
      }
    }, 1000);
  }

  startButton.addEventListener("click", startQuiz);

  // New: Event listeners for name screen buttons
  continueWithNameButton.addEventListener("click", () => {
    playClickSound();
    userName = nameInput.value.trim(); // Get name or default to empty string
    showScreen(quizScreen);
    loadQuestion();
  });

  continueSimplifiedButton.addEventListener("click", () => {
    playClickSound();
    userName = ""; // Set to empty string if simplified experience
    showScreen(quizScreen);
    loadQuestion();
  });

  nextButton.addEventListener("click", () => {
    playClickSound(); // Play sound on next button click
    nextQuestion(null); // No element clicked for next button
  });

  // Initial screen display
  showScreen(introScreen);
});
