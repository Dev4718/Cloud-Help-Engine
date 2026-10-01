const progressStorageKey = 'cloudHelpEngine.completedGuides';
const bookmarkStorageKey = 'cloudHelpEngine.savedGuides';
const searchInput = document.getElementById('guide-search');
const guideGrid = document.getElementById('guide-grid');
const comingSoonCard = document.getElementById('coming-soon-card');
const sortSelect = document.getElementById('guide-sort');
const filterButtons = [...document.querySelectorAll('.filter-button')];
const pathStepButtons = [...document.querySelectorAll('.path-step[data-step]')];
const guideCards = [...document.querySelectorAll('.guide-card')];
const completionButtons = [...document.querySelectorAll('.completion-toggle')];
const bookmarkButtons = [...document.querySelectorAll('.bookmark-toggle')];
const resultCount = document.getElementById('result-count');
const emptyState = document.getElementById('empty-state');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const progressTrack = document.getElementById('progress-track');
const progressFill = document.getElementById('progress-fill');
const continueButton = document.getElementById('continue-button');
const guideReader = document.getElementById('guide-reader');
const readerScroll = document.getElementById('reader-scroll');
const readerProgress = document.getElementById('reader-progress');
const readerProgressFill = document.getElementById('reader-progress-fill');
const readerTocLinks = [...document.querySelectorAll('.reader-toc a')];
const readerSections = [...document.querySelectorAll('.reader-section')];
const readerCategory = document.getElementById('reader-category');
const readerTitle = document.getElementById('reader-title');
const readerSummary = document.getElementById('reader-summary');
const readerBody = document.getElementById('reader-body');
const readerTryThis = document.getElementById('reader-try-this');
const readerCode = document.getElementById('reader-code');
const readerGlossary = document.getElementById('reader-glossary-terms');
const readerQuiz = document.getElementById('reader-quiz-questions');
const quizProgress = document.getElementById('quiz-progress');
const quizCompletion = document.getElementById('quiz-completion');
const readerNextLink = document.getElementById('reader-next-link');
const readerClose = document.getElementById('reader-close');
const copyExampleButton = document.getElementById('copy-example');
const copyStatus = document.getElementById('copy-status');
let currentReaderCard = null;
let readerObserver = null;
const guideDataByIdPromise = fetch('/data/guides.json')
    .then((response) => {
        if (!response.ok) throw new Error('Could not load guide data');
        return response.json();
    })
    .then((guides) => new Map(guides.map((guide) => [guide.id, guide])))
    .catch(() => new Map());
let activeFilter = 'all';
let completedGuideIds = new Set();
let savedGuideIds = new Set();
const currentGuideIds = new Set(guideCards.map((card) => card.dataset.guideId));

try {
    const storedCompletionIds = JSON.parse(localStorage.getItem(progressStorageKey) || '[]');
    if (Array.isArray(storedCompletionIds)) {
        completedGuideIds = new Set(storedCompletionIds.filter((id) => currentGuideIds.has(id)));
    }
} catch (error) {
    completedGuideIds = new Set();
}

try {
    const storedBookmarks = JSON.parse(localStorage.getItem(bookmarkStorageKey) || '[]');
    if (Array.isArray(storedBookmarks)) {
        savedGuideIds = new Set(storedBookmarks.filter((id) => currentGuideIds.has(id)));
    }
} catch (error) {
    savedGuideIds = new Set();
}

function updateGuides() {
    const query = searchInput.value.trim().toLowerCase();
    const stepFilter = activeFilter.startsWith('step-') ? activeFilter.slice(5) : null;
    let visibleCount = 0;

    guideCards.forEach((card) => {
        const matchesTopic = activeFilter === 'all'
            || activeFilter === 'saved'
            || card.dataset.category === activeFilter
            || card.dataset.pathStep === stepFilter;
        const matchesSaved = activeFilter !== 'saved' || savedGuideIds.has(card.dataset.guideId);
        const matchesSearch = !query || card.textContent.toLowerCase().includes(query) || card.dataset.search.includes(query);
        card.hidden = !(matchesTopic && matchesSaved && matchesSearch);
        if (!card.hidden) visibleCount += 1;
    });

    comingSoonCard.hidden = activeFilter !== 'all' || query.length > 0;
    resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'guide' : 'guides'}`;
    emptyState.hidden = visibleCount !== 0;
}

function updateCompletionCard(card) {
    const completed = completedGuideIds.has(card.dataset.guideId);
    const button = card.querySelector('.completion-toggle');

    card.classList.toggle('is-complete', completed);
    button.classList.toggle('is-complete', completed);
    button.setAttribute('aria-pressed', String(completed));
    button.setAttribute('aria-label', `${completed ? 'Mark incomplete' : 'Mark complete'}: ${card.querySelector('h3').textContent}`);
    button.querySelector('.completion-label').textContent = completed ? 'Completed' : 'Mark complete';
}

function updatePathProgress() {
    pathStepButtons.forEach((button) => {
        const step = button.dataset.step;
        const stepCards = guideCards.filter((card) => card.dataset.pathStep === step);
        const completedCount = stepCards.filter((card) => completedGuideIds.has(card.dataset.guideId)).length;
        const title = button.querySelector('.path-step-title').textContent;

        button.querySelector('.path-step-progress').textContent = `${completedCount}/${stepCards.length}`;
        button.setAttribute('aria-label', `${completedCount} of ${stepCards.length} completed. Filter to step ${step}: ${title}`);
    });
}

function updateProgress() {
    const completedCount = guideCards.filter((card) => completedGuideIds.has(card.dataset.guideId)).length;
    const totalCount = guideCards.length;
    const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

    progressLabel.textContent = `${completedCount} of ${totalCount} completed`;
    progressPercent.textContent = `${percent}%`;
    progressTrack.setAttribute('aria-valuemax', String(totalCount));
    progressTrack.setAttribute('aria-valuenow', String(completedCount));
    progressFill.style.width = `${percent}%`;
    updatePathProgress();
}

function saveProgress() {
    try {
        localStorage.setItem(progressStorageKey, JSON.stringify([...completedGuideIds]));
    } catch (error) {
        // Keep this session interactive when browser storage is unavailable.
    }
}

function updateBookmarkCard(card) {
    const isSaved = savedGuideIds.has(card.dataset.guideId);
    const button = card.querySelector('.bookmark-toggle');
    const title = card.querySelector('h3').textContent;
    const label = isSaved ? `Remove bookmark: ${title}` : `Save for later: ${title}`;

    card.classList.toggle('is-saved', isSaved);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', label);
    button.title = label;
}

function saveBookmarks() {
    try {
        localStorage.setItem(bookmarkStorageKey, JSON.stringify([...savedGuideIds]));
    } catch (error) {
        // Keep this session interactive when browser storage is unavailable.
    }
}

function updateFilterCounts() {
    filterButtons.forEach((button) => {
        const countElement = button.querySelector('.filter-count');
        if (!countElement) return;

        const filter = button.dataset.filter;
        const count = filter === 'all'
            ? guideCards.length
            : filter === 'saved'
                ? savedGuideIds.size
                : guideCards.filter((card) => card.dataset.category === filter).length;
        countElement.textContent = String(count);
    });
}

const glossaryDefinitions = {
    'availability zone': 'An isolated location within a cloud region, designed to reduce the impact of local failures.',
    region: 'A geographic area where a cloud provider operates infrastructure and services.',
    orchestration: 'Automated coordination of application components, containers, or infrastructure tasks.'
};

function appendGlossaryTerms(container, text) {
    const matcher = /\b(availability zones?|orchestration|regions?)\b/gi;
    let lastIndex = 0;

    for (const match of text.matchAll(matcher)) {
        container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const matchedTerm = match[0];
        const definition = matchedTerm.toLowerCase().startsWith('availability zone')
            ? glossaryDefinitions['availability zone']
            : matchedTerm.toLowerCase().startsWith('region')
                ? glossaryDefinitions.region
                : glossaryDefinitions.orchestration;
        const term = document.createElement('span');

        term.className = 'glossary-term';
        term.tabIndex = 0;
        term.title = definition;
        term.dataset.definition = definition;
        term.setAttribute('role', 'note');
        term.setAttribute('aria-label', `${matchedTerm}: ${definition}`);
        term.textContent = matchedTerm;
        container.appendChild(term);
        lastIndex = match.index + matchedTerm.length;
    }

    container.appendChild(document.createTextNode(text.slice(lastIndex)));
}

function renderGlossary() {
    readerGlossary.replaceChildren();
    Object.entries(glossaryDefinitions).forEach(([term, definition]) => {
        const item = document.createElement('p');
        const label = document.createElement('span');
        label.className = 'glossary-term';
        label.tabIndex = 0;
        label.title = definition;
        label.dataset.definition = definition;
        label.setAttribute('role', 'note');
        label.setAttribute('aria-label', `${term}: ${definition}`);
        label.textContent = term;
        item.append(label, document.createTextNode(`: ${definition}`));
        readerGlossary.appendChild(item);
    });
}

function markGuideCompleted(card) {
    const guideId = card.dataset.guideId;
    if (completedGuideIds.has(guideId)) return;

    completedGuideIds.add(guideId);
    updateCompletionCard(card);
    updateProgress();
    saveProgress();
}

function renderGuideQuiz(card, questions) {
    readerQuiz.replaceChildren();
    quizCompletion.textContent = '';
    quizCompletion.classList.remove('quiz-complete');
    let answeredCount = 0;
    let correctCount = 0;

    if (!questions || questions.length < 3 || questions.length > 5) {
        quizProgress.textContent = 'Quiz questions are unavailable for this guide.';
        return;
    }

    quizProgress.textContent = `Answer all ${questions.length} questions to complete this guide.`;
    questions.forEach((item, questionIndex) => {
        const question = document.createElement('fieldset');
        const legend = document.createElement('legend');
        const options = document.createElement('div');
        const feedback = document.createElement('p');

        question.className = 'quiz-question';
        legend.textContent = `${questionIndex + 1}. ${item.question}`;
        options.className = 'quiz-options';
        feedback.className = 'quiz-feedback';
        feedback.setAttribute('aria-live', 'polite');

        item.options.forEach((optionText, optionIndex) => {
            const option = document.createElement('button');
            option.className = 'quiz-option';
            option.type = 'button';
            option.textContent = optionText;
            option.addEventListener('click', () => {
                if (question.dataset.answered === 'true') return;

                question.dataset.answered = 'true';
                answeredCount += 1;
                const isCorrect = optionIndex === item.answer;
                if (isCorrect) correctCount += 1;

                [...options.children].forEach((choice, index) => {
                    choice.disabled = true;
                    if (index === item.answer) choice.classList.add('is-correct');
                    else if (index === optionIndex) choice.classList.add('is-incorrect');
                });

                feedback.classList.toggle('is-correct', isCorrect);
                feedback.classList.toggle('is-incorrect', !isCorrect);
                feedback.textContent = `${isCorrect ? 'Correct.' : 'Not quite.'} ${item.explanation}`;
                quizProgress.textContent = `${answeredCount} of ${questions.length} answered.`;

                if (answeredCount === questions.length) {
                    quizCompletion.classList.add('quiz-complete');
                    quizCompletion.textContent = `Quiz finished: ${correctCount} of ${questions.length} correct. This guide is completed.`;
                    markGuideCompleted(card);
                }
            });
            options.appendChild(option);
        });

        question.append(legend, options, feedback);
        readerQuiz.appendChild(question);
    });
}

function updateReaderProgress() {
    const maxScroll = readerScroll.scrollHeight - readerScroll.clientHeight;
    const progress = maxScroll > 0 ? Math.min(100, (readerScroll.scrollTop / maxScroll) * 100) : 0;
    readerProgressFill.style.width = `${progress}%`;
    readerProgress.setAttribute('aria-valuenow', String(Math.round(progress)));
}

function observeReaderSections() {
    if (readerObserver) readerObserver.disconnect();
    readerObserver = new IntersectionObserver((entries) => {
        const visibleSections = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top);
        if (!visibleSections.length) return;

        const currentId = visibleSections[0].target.id;
        readerTocLinks.forEach((link) => {
            const active = link.hash === `#${currentId}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }, { root: readerScroll, rootMargin: '-12% 0px -70% 0px', threshold: 0 });

    readerSections.forEach((section) => readerObserver.observe(section));
}

async function openGuideReader(card) {
    currentReaderCard = card;
    const guideDataById = await guideDataByIdPromise;
    const guide = guideDataById.get(card.dataset.guideId);
    if (!guide) return;

    readerCategory.textContent = guide.category;
    readerCategory.className = `eyebrow category-badge category-${guide.category.toLowerCase()}`;
    readerTitle.textContent = guide.title;
    readerSummary.textContent = guide.summary;
    readerBody.replaceChildren();
    appendGlossaryTerms(readerBody, guide.body);
    readerTryThis.textContent = guide.tryThis;
    readerCode.textContent = '# Application environment settings\nCLOUD_REGION=us-east-1\nAPP_ENV=production';
    copyStatus.textContent = '';
    renderGlossary();
    renderGuideQuiz(card, guide.quiz);

    const cardIndex = guideCards.indexOf(card);
    const nextCard = guideCards[cardIndex + 1];
    readerNextLink.textContent = nextCard ? nextCard.querySelector('h3').textContent : 'Return to the guide library';
    readerNextLink.onclick = (event) => {
        event.preventDefault();
        if (nextCard) openGuideReader(nextCard);
        else guideReader.close();
    };

    readerScroll.scrollTop = 0;
    readerProgressFill.style.width = '0%';
    readerProgress.setAttribute('aria-valuenow', '0');
    if (!guideReader.open) guideReader.showModal();
    observeReaderSections();
    updateReaderProgress();
}

function setGuideNoteOpen(card, isOpen) {
    if (isOpen) openGuideReader(card);
}

function prepareGuideCardFooters() {
    guideCards.forEach((card) => {
        const metadata = card.querySelector('.guide-meta');
        const number = metadata.querySelector('.guide-number');
        const category = metadata.querySelector('.category-label');
        const readTime = [...metadata.children].find((element) => element.tagName === 'SPAN'
            && element !== number
            && element !== category
            && !element.classList.contains('difficulty-badge'));
        const difficulty = metadata.querySelector('.difficulty-badge');
        const bookmark = metadata.querySelector('.bookmark-toggle');
        const completion = metadata.querySelector('.completion-toggle');
        const detail = card.querySelector('.guide-detail');
        const details = card.querySelector('details');
        const footer = document.createElement('footer');
        const noteToggle = document.createElement('button');
        const noteLabel = document.createElement('span');
        const noteArrow = document.createElement('span');
        const actions = document.createElement('div');

        readTime.classList.add('guide-read-time');
        readTime.textContent = readTime.textContent.trim().toLowerCase();
        metadata.replaceChildren(number, category, readTime, difficulty);

        detail.id = `${card.dataset.guideId}-field-note`;
        detail.hidden = true;
        details.remove();

        noteToggle.className = 'field-note-toggle';
        noteToggle.type = 'button';
        noteToggle.setAttribute('aria-expanded', 'false');
        noteToggle.setAttribute('aria-controls', detail.id);
        noteLabel.className = 'field-note-label';
        noteLabel.textContent = 'Open field note';
        noteArrow.className = 'field-note-arrow';
        noteArrow.setAttribute('aria-hidden', 'true');
        noteArrow.textContent = '\u2192';
        noteToggle.append(noteLabel, noteArrow);
        noteToggle.addEventListener('click', () => setGuideNoteOpen(card, true));

        actions.className = 'guide-card-actions';
        actions.append(bookmark, completion);
        footer.className = 'guide-card-footer';
        footer.append(noteToggle, actions);
        card.append(detail, footer);
    });
}

function sortGuideCards() {
    const mode = sortSelect.value;
    const sortedCards = [...guideCards].sort((first, second) => {
        const numberOrder = Number(first.dataset.number) - Number(second.dataset.number);

        if (mode === 'shortest') {
            return Number(first.dataset.minutes) - Number(second.dataset.minutes) || numberOrder;
        }
        if (mode === 'newest') {
            return -numberOrder;
        }

        return Number(first.dataset.pathStep) - Number(second.dataset.pathStep) || numberOrder;
    });

    sortedCards.forEach((card) => guideGrid.insertBefore(card, comingSoonCard));
}

function addNextUpSuggestions() {
    guideCards.forEach((card) => {
        card.id = card.dataset.guideId;
    });
}

readerScroll.addEventListener('scroll', updateReaderProgress, { passive: true });
readerClose.addEventListener('click', () => guideReader.close());
guideReader.addEventListener('close', () => {
    if (readerObserver) readerObserver.disconnect();
    if (currentReaderCard) {
        const fieldNoteButton = currentReaderCard.querySelector('.field-note-toggle');
        if (fieldNoteButton) fieldNoteButton.focus();
    }
});
guideReader.addEventListener('click', (event) => {
    if (event.target === guideReader) guideReader.close();
});

copyExampleButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(readerCode.textContent);
        copyStatus.textContent = 'Copied to clipboard.';
    } catch (error) {
        const fallback = document.createElement('textarea');
        fallback.value = readerCode.textContent;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.appendChild(fallback);
        fallback.select();
        const copied = document.execCommand('copy');
        fallback.remove();
        copyStatus.textContent = copied ? 'Copied to clipboard.' : 'Copy was unavailable in this browser.';
    }
});

function addCategoryIcons() {
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const categories = new Set(guideCards.map((card) => card.dataset.category));
    const categoryTargets = [
        ...guideCards.map((card) => ({
            element: card.querySelector('.guide-meta > span:nth-child(2)'),
            category: card.dataset.category,
            isCardLabel: true
        })),
        ...filterButtons
            .filter((button) => categories.has(button.dataset.filter))
            .map((button) => ({ element: button, category: button.dataset.filter }))
    ];

    categoryTargets.forEach(({ element, category, isCardLabel }) => {
        const icon = document.createElementNS(svgNamespace, 'svg');
        const use = document.createElementNS(svgNamespace, 'use');

        icon.setAttribute('class', 'category-icon');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');
        use.setAttribute('href', `#category-${category}`);
        icon.appendChild(use);
        element.classList.add('category-badge', `category-${category}`);
        if (isCardLabel) element.classList.add('category-label');
        element.prepend(icon);
    });
}

function selectFilter(button) {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
    });
    pathStepButtons.forEach((stepButton) => stepButton.classList.remove('is-active'));
    updateGuides();
}

addCategoryIcons();
prepareGuideCardFooters();
addNextUpSuggestions();

filterButtons.forEach((button) => {
    button.addEventListener('click', () => selectFilter(button));
});

pathStepButtons.forEach((button) => {
    button.addEventListener('click', () => {
        searchInput.value = '';
        activeFilter = `step-${button.dataset.step}`;
        filterButtons.forEach((filterButton) => {
            filterButton.classList.remove('is-active');
            filterButton.setAttribute('aria-pressed', 'false');
        });
        pathStepButtons.forEach((stepButton) => stepButton.classList.toggle('is-active', stepButton === button));
        updateGuides();
        document.getElementById('guide-library').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

sortSelect.addEventListener('change', sortGuideCards);

completionButtons.forEach((button) => {
    const card = button.closest('.guide-card');
    updateCompletionCard(card);

    button.addEventListener('click', () => {
        const guideId = card.dataset.guideId;
        if (completedGuideIds.has(guideId)) completedGuideIds.delete(guideId);
        else completedGuideIds.add(guideId);

        updateCompletionCard(card);
        updateProgress();
        saveProgress();
    });
});

bookmarkButtons.forEach((button) => {
    const card = button.closest('.guide-card');
    updateBookmarkCard(card);

    button.addEventListener('click', () => {
        const guideId = card.dataset.guideId;
        if (savedGuideIds.has(guideId)) savedGuideIds.delete(guideId);
        else savedGuideIds.add(guideId);

        updateBookmarkCard(card);
        updateFilterCounts();
        saveBookmarks();
        updateGuides();
    });
});

updateFilterCounts();
updateProgress();
updateGuides();

searchInput.addEventListener('input', updateGuides);
document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        event.preventDefault();
        searchInput.focus();
    }
    if (event.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        updateGuides();
        searchInput.blur();
    }
});

document.getElementById('surprise-button').addEventListener('click', () => {
    if (!guideCards.some((card) => !card.hidden)) {
        searchInput.value = '';
        selectFilter(filterButtons[0]);
    }
    const choices = guideCards.filter((card) => !card.hidden);
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    if (!chosen) return;
    setGuideNoteOpen(chosen, true);
    chosen.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

continueButton.addEventListener('click', () => {
    const nextCard = guideCards.find((card) => !completedGuideIds.has(card.dataset.guideId)) || guideCards[0];
    if (!nextCard) return;

    searchInput.value = '';
    selectFilter(filterButtons[0]);
    setGuideNoteOpen(nextCard, true);
    nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
