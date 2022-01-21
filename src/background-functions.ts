export const channels = ['get-settings', 'get-thcrap-config', 'set-settings', 'pick-exe', 'pick-hdi', 'check-neko-project-path', 'configure-thcrap',
    'run-custom-game', 'pick-linux-exe', 'pick-folder', 'pick-banner', 'get-wine-version', 'look-for-wine', 'run-game', 'check-banner',
    'load-img', 'try-load-local-thcrap-profile', 'load-local-thcrap-repositories', 'try-load-local-thcrap-patch', 'try-load-remote-thcrap-patch',
    'load-thcrap-repository-by-url', 'run-pc98-game', 'save-thcrap-repository-file', 'save-thcrap-patch-file', 'save-thcrap-profile', 'load-thcrap-game-profiles',
    'save-thcrap-game-profiles', 'load-img-from-exe', 'open-folder'] as const;
export type Channel = typeof channels[number];