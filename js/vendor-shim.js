const CrazyGames = {
  SDK: {
    ad: {
      requestAd(type, callbacks = {}) {
        console.log(`[CrazyGames] Ad requested: ${type}`);
        setTimeout(() => {
          if (callbacks.adFinished) callbacks.adFinished();
          if (type === 'rewarded' && callbacks.adRewarded) callbacks.adRewarded();
        }, 1500);
      }
    },
    game: {
      sdkGameLoadingStart() { console.log('[CG] loadingStart'); },
      sdkGameLoadingStop()  { console.log('[CG] loadingStop'); },
      gameplayStart()       { console.log('[CG] gameplayStart'); },
      gameplayStop()        { console.log('[CG] gameplayStop'); },
    }
  }
};
