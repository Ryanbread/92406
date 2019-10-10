import { musicBoxStore } from '../music-box-store.js';
import { minifyMap } from '../state.js';

export const urlManager = {
  currentVersion: '0',
  lastInternalUrlChange: '',

  getStateFromUrlAsync() {
    if (!location.hash) {
      return Promise.resolve();
    }

    // Our state data begins at character "2" because "0" is the "#" and "1" is the version number.
    const dataToLoad = location.hash.substring(2);
    return JsonUrl('lzma').decompress(dataToLoad)
      .then(decompressedObject => {
        const invertedMinifyMap = {};
        Object.keys(minifyMap).forEach(key => {
          invertedMinifyMap[minifyMap[key]] = key;
        });

        const unminifiedSongState = this.cloneDeepWithRenamedKeys(decompressedObject, invertedMinifyMap);
        return unminifiedSongState;
      })
      .catch(error => {
        console.warn('The song could not be loaded from the URL.', error);
        return false;
      });
  },

  saveStateToUrlAsync() {
    const minifiedSongState = this.cloneDeepWithRenamedKeys(musicBoxStore.state.songState, minifyMap);

    return JsonUrl('lzma').compress(minifiedSongState).then(result => {
      const newHash = `${this.currentVersion}${result}`;
      this.lastInternalUrlChange = newHash;

      location.href = `#${newHash}`;
    });
  },

  // We use this function to minify our state object before storing it in the URL, and
  // unminify it after removing it from the URL. This shortens the URL by ≈50 characters.
  cloneDeepWithRenamedKeys(object, renameMap) {
    if (!object) {
      return object;
    }

    let newObj = Array.isArray(object) ? [] : {};
    for (const key in object) {
      let value = object[key];
      let renamedKey = renameMap[key] ? renameMap[key] : key;
      newObj[renamedKey] = (typeof value === "object") ? this.cloneDeepWithRenamedKeys(value, renameMap) : value;
    }

    return newObj;
  },

  subscribeUrlToStateChanges() {
    musicBoxStore.subscribe('songState', this.saveStateToUrlAsync.bind(this));
  },

  // This fixes an edge-case where a user on the site would click the "back" button,
  // "forward" button, or a bookmarked link to another musicboxfun.com url, and the
  // song wouldn't load because the hashchange wouldn't re-render the page. We could
  // further optimize this case by rerendering specific components without reloading
  // the entire page.
  subscribeUrlToExternalHashChanges() {
    window.addEventListener('hashchange', event => {
      const newHash = event.newURL.split('#')[1];
      if (newHash !== this.lastInternalUrlChange) {
        location.reload();
      }
    });
  },
};
