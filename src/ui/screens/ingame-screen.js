import { state } from '../../core/state.js';
import { soundManager } from '../../core/sound-manager.js';
import { renderVikingsList } from '../vikings-list.js';
import { selectRandomViking, breakChosenRune, resetChosenRune, breakMultipleRunes } from '../runes-circle.js';
import { alertPopup } from '../alert-popup.js';
import { persistence } from '../../core/persistence.js';
import { Typewriter } from '../typewriter.js';

let isAnimationInProgress = false;
let gameEnded = false;
let thorRageUsed = false;

export function resetGameState() {
    gameEnded = false;
    isAnimationInProgress = false;
    thorRageUsed = false;
    persistence.setGameEnded(false);
    persistence.setWinnerName(null);

    const chosenNameEl = document.getElementById('chosenVikingName');
    if (chosenNameEl) {
        chosenNameEl.textContent = '';
        chosenNameEl.classList.remove('visible');
    }

    const sacrificeActionButton = document.getElementById('sacrifice-action');
    if (sacrificeActionButton) {
        sacrificeActionButton.disabled = false;
        sacrificeActionButton.style.pointerEvents = 'auto';
    }

    const thorRageText = document.getElementById('thor-rage-text');
    if (thorRageText) {
        thorRageText.classList.add('hidden');
    }

    resetChosenRune();
}

export function setGameEnded(value) {
    gameEnded = value;
}

export function getGameEnded() {
    return gameEnded;
}

export async function restoreWinner(winnerName) {
    const winnerRune = state.getVikingRune(winnerName);
    if (!winnerRune) return;

    const runeElements = state.getRuneElements();
    const winnerRuneElement = runeElements.find(el =>
        el.dataset.vikingName === winnerName && !el.classList.contains('broken')
    );

    if (winnerRuneElement) {
        runeElements.forEach(r => {
            r.classList.remove('chosen', 'dimmed');
        });
        winnerRuneElement.classList.add('chosen');
    }

    const chosenNameEl = document.getElementById('chosenVikingName');
    if (chosenNameEl) {
        chosenNameEl.textContent = winnerName;
        chosenNameEl.classList.add('visible');
    }

    const winnerMessage = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="font-size: 32px;">The winner is:</div>
            <div style="display: flex; align-items: center; gap: 15px; font-size: 36px;">
                <img src="${winnerRune.url}" alt="Winner rune" style="width: 55px; height: 55px;" />
                <span>${winnerName}</span>
            </div>
        </div>
    `;

    const result = await alertPopup.show(winnerMessage, false, 'Credits', '', true, 'winner-alert');

    if (result) {
        const creditScreen = document.getElementById('credit-screen');
        const ingameScreen = document.getElementById('ingame-screen');
        if (creditScreen && ingameScreen) {
            ingameScreen.style.display = 'none';
            creditScreen.style.display = 'flex';
            soundManager.stop('ingame');
            soundManager.stop('game-end');
            soundManager.play('forest');
            persistence.save();
        }
    }
}

export function initIngameScreen() {
    const ingameScreen = document.getElementById('ingame-screen');
    const ingameHomeButton = document.getElementById('ingame-home-button');
    const sacrificeActionButton = document.getElementById('sacrifice-action');
    const ingameBackgroundVideo = document.getElementById('ingame-background-video');
    const ingameBackgroundVideoMobile = document.getElementById('ingame-background-video-mobile');
    const thorCharacter = document.getElementById('thor-character');
    const homeScreen = document.getElementById('home-screen');
    const bubble = document.querySelector(".bubble.right");

    preloadThorImages();

    resetGameState();

    const typewriter = new Typewriter(bubble, null, {
        deleteSpeed: 30,
        typeSpeed: 50,
        minDelay: 4000,
        maxDelay: 6000,
        pauseBeforeTyping: 200,
        checkActive: () => {
            return !getGameEnded() && ingameScreen.style.display !== 'none';
        }
    });

    const observer = new MutationObserver(() => {
        if (ingameScreen.style.display !== 'none' && ingameScreen.style.display !== '') {
            typewriter.start();
        } else {
            typewriter.stop();
        }
    });

    observer.observe(ingameScreen, { attributes: true, attributeFilter: ['style'] });

    if (ingameScreen.style.display !== 'none' && ingameScreen.style.display !== '') {
        typewriter.start();
    }

    if (ingameHomeButton) {
        ingameHomeButton.addEventListener('click', () => {
            typewriter.stop();
            handleHomeClick(ingameScreen, homeScreen, ingameBackgroundVideo, ingameBackgroundVideoMobile);
        });
    }

    if (sacrificeActionButton) {
        sacrificeActionButton.addEventListener('click', () => handleSacrifice(thorCharacter));
    }

    playBackgroundVideo(ingameBackgroundVideo, ingameBackgroundVideoMobile);

    async function handleHomeClick(ingameScreen, homeScreen, ingameBackgroundVideo, ingameBackgroundVideoMobile) {
        const confirmar = await alertPopup.confirm('Are you sure you want to go back?\nYou will lose all progress.');

        if (confirmar) {
            state.clearVikings();
            state.resetAvailableRunes();
            renderVikingsList();
            resetGameState();

            if (ingameBackgroundVideo) ingameBackgroundVideo.pause();
            if (ingameBackgroundVideoMobile) ingameBackgroundVideoMobile.pause();

            if (ingameScreen && homeScreen) {
                ingameScreen.style.display = 'none';
                homeScreen.style.display = 'flex';
                soundManager.stop('ingame');
                soundManager.play('forest');
                persistence.clear();
                persistence.save();
            }
        }
    }

    let isAnimationInProgress = false;

    function handleSacrifice(thorCharacter) {
        if (isAnimationInProgress || gameEnded) return;

        isAnimationInProgress = true;
        if (sacrificeActionButton) {
            sacrificeActionButton.disabled = true;
            sacrificeActionButton.style.pointerEvents = 'none';
        }

        const runeElements = state.getRuneElements();
        const unbrokenRunes = runeElements.filter(el => !el.classList.contains('broken'));
        const shouldThorRage = !thorRageUsed && unbrokenRunes.length > 4 && Math.random() < 0.15;
        
        let runesToBreak = 1;
        if (shouldThorRage) {
            thorRageUsed = true;
            const percentage = 0.3 + Math.random() * 0.2;
            runesToBreak = Math.max(2, Math.floor(unbrokenRunes.length * percentage));
            
            const thorRageText = document.getElementById('thor-rage-text');
            if (thorRageText) {
                thorRageText.classList.remove('hidden');
            }
        }

        selectRandomViking();

        const animationDelay = shouldThorRage ? 2000 : 0;
        const thorRageBreakDelay = shouldThorRage ? 300 : 0;

        if (shouldThorRage) {
            setTimeout(() => {
                const thorRageText = document.getElementById('thor-rage-text');
                if (thorRageText) {
                    thorRageText.classList.add('hidden');
                }
            }, animationDelay + 300);
        }

        setTimeout(() => {
            if (thorCharacter) {
                thorCharacter.classList.add('thor-character-mad');
            }
        }, 500 + animationDelay);

        setTimeout(() => {
            soundManager.play('lightning-effect');

            const lightningAnimation = document.getElementById('lightning-animation');
            if (lightningAnimation) {
                const img = lightningAnimation.querySelector('img');
                if (img) {
                    const baseUrl = 'https://res.cloudinary.com/diycpogap/image/upload/v1764270037/lightning-animation-final_sa1xdi.gif';
                    img.src = baseUrl + '?t=' + Date.now();
                }
                lightningAnimation.classList.remove('hidden');
                
                setTimeout(() => {
                    if (lightningAnimation) {
                        lightningAnimation.classList.add('hidden');
                    }
                }, 1900);
            }
        }, 750 + animationDelay);

        setTimeout(() => {
            let eliminatedVikings = [];
            if (shouldThorRage && runesToBreak > 1) {
                eliminatedVikings = breakMultipleRunes(runesToBreak);
            } else {
                const eliminatedViking = breakChosenRune();
                if (eliminatedViking) {
                    eliminatedVikings = [eliminatedViking];
                }
            }

            eliminatedVikings.forEach(eliminatedViking => {
                if (eliminatedViking) {
                    const vikings = state.getVikings();
                    const index = vikings.indexOf(eliminatedViking);
                    if (index !== -1) {
                        state.removeViking(index);
                    }
                }
            });

            setTimeout(() => {
                if (thorCharacter) {
                    thorCharacter.classList.remove('thor-character-mad');
                }
                resetChosenRune();
                persistence.save();

                const remainingVikings = state.getVikings();
                if (remainingVikings.length === 1) {
                    gameEnded = true;
                    setGameEnded(true);
                    const winnerName = remainingVikings[0];
                    persistence.setGameEnded(true);
                    persistence.setWinnerName(winnerName);
                    persistence.save();
                    typewriter.stop();

                    soundManager.fadeOut('ingame', 1000, () => {
                        soundManager.stop('ingame');
                        setTimeout(() => {
                            soundManager.play('game-end');
                        }, 300);
                    });

                    setTimeout(() => {
                        selectWinner(winnerName);
                    }, 500);
                } else {
                    isAnimationInProgress = false;
                    if (sacrificeActionButton) {
                        sacrificeActionButton.disabled = false;
                        sacrificeActionButton.style.pointerEvents = 'auto';
                    }
                }
            }, 3500);
        }, 2250 + animationDelay + thorRageBreakDelay);
    }

    function selectWinner(winnerName) {
        const runeElements = state.getRuneElements();
        const winnerRuneElement = runeElements.find(el =>
            el.dataset.vikingName === winnerName && !el.classList.contains('broken')
        );

        if (winnerRuneElement) {
            runeElements.forEach(r => {
                r.classList.remove('chosen', 'dimmed');
            });
            winnerRuneElement.classList.add('chosen');

            const chosenNameEl = document.getElementById('chosenVikingName');
            if (chosenNameEl) {
                chosenNameEl.textContent = winnerName;
                chosenNameEl.classList.add('visible');
            }
        }

        setTimeout(() => {
            showWinner(winnerName);
        }, 2000);
    }

    async function showWinner(winnerName) {
        await restoreWinner(winnerName);
    }
}

function preloadThorImages() {
    const desktopMadImage = new Image();
    const mobileMadImage = new Image();
    desktopMadImage.src = 'https://res.cloudinary.com/diycpogap/image/upload/v1762902368/thor-background-shouting_quv4zf.png';
    mobileMadImage.src = 'https://res.cloudinary.com/diycpogap/image/upload/v1762902299/thor-mobile-background-shouting_imbjrs.png';
}

function playBackgroundVideo(ingameBackgroundVideo, ingameBackgroundVideoMobile) {
    const isMobile = window.innerWidth <= 768;
    const videoToPlay = isMobile ? ingameBackgroundVideoMobile : ingameBackgroundVideo;
    if (videoToPlay) {
        videoToPlay.play().catch(() => { });
    }
}

