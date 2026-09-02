// Haptic Feedback Bridge for Mobile & Web Browsers
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

class HapticsService {
  trigger(style: HapticStyle = 'light') {
    if (typeof window === 'undefined' || !window.navigator) return

    // Vibration API fallback for mobile web / WebView
    if ('vibrate' in window.navigator) {
      try {
        switch (style) {
          case 'light':
            window.navigator.vibrate(15)
            break
          case 'medium':
            window.navigator.vibrate(30)
            break
          case 'heavy':
            window.navigator.vibrate(50)
            break
          case 'success':
            window.navigator.vibrate([20, 50, 20])
            break
          case 'warning':
            window.navigator.vibrate([40, 40, 40])
            break
          case 'error':
            window.navigator.vibrate([60, 40, 60, 40])
            break
          default:
            window.navigator.vibrate(20)
        }
      } catch {
        // Silently ignore if blocked by browser permissions
      }
    }
  }

  onQuizAnswerSelected() {
    this.trigger('light')
  }

  onQuizCompleted(scorePercentage: number) {
    if (scorePercentage >= 80) {
      this.trigger('success')
    } else if (scorePercentage >= 50) {
      this.trigger('medium')
    } else {
      this.trigger('warning')
    }
  }

  onVoiceInterruption() {
    this.trigger('heavy')
  }
}

export const hapticsService = new HapticsService()
