/**
 * Переключить звук
 */
function toggleSound() {
    if (!window.soundManager) return;

    const enabled = window.soundManager.toggle();
    const btn = document.getElementById('toggleSoundBtn');
    const icon = btn.querySelector('.sound-icon');
    const text = btn.querySelector('.sound-text');

    if (enabled) {
        icon.textContent = '🔊';
        text.textContent = 'Звук вкл.';
    } else {
        icon.textContent = '🔇';
        text.textContent = 'Звук выкл.';
    }
}
