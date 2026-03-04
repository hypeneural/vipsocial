/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API when available
 */

type HapticPattern = number | number[];

const canVibrate = (): boolean => {
    return typeof navigator !== "undefined" && "vibrate" in navigator;
};

const vibrate = (pattern: HapticPattern): boolean => {
    if (!canVibrate()) return false;
    try {
        return navigator.vibrate(pattern);
    } catch {
        return false;
    }
};

export const haptic = {
    /**
     * Light haptic feedback - subtle tap
     */
    light: (): boolean => vibrate(10),

    /**
     * Medium haptic feedback - button press
     */
    medium: (): boolean => vibrate(25),

    /**
     * Heavy haptic feedback - significant action
     */
    heavy: (): boolean => vibrate(50),

    /**
     * Success haptic feedback - celebration pattern
     */
    success: (): boolean => vibrate([10, 50, 10]),

    /**
     * Error haptic feedback - warning pattern
     */
    error: (): boolean => vibrate([50, 30, 50, 30, 50]),

    /**
     * Warning haptic feedback - attention pattern
     */
    warning: (): boolean => vibrate([30, 20, 30]),

    /**
     * Selection change feedback
     */
    selection: (): boolean => vibrate(5),

    /**
     * Custom pattern
     */
    custom: (pattern: HapticPattern): boolean => vibrate(pattern),

    /**
     * Check if haptic feedback is supported
     */
    isSupported: canVibrate,
};

// Alias for alternative naming
export const haptics = haptic;

export default haptic;

