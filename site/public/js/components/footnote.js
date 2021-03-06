import { MBComponent } from '../music-box-component.js';
import { isSilentNotePresentInSong } from '../common/silent-notes.js';
import classNames from '../vendor/classnames.js';

export class Footnote extends MBComponent {
  constructor() {
    super({
      renderTrigger: 'songState.songData*',
      element: document.querySelector('#footnote')
    });
  }

  render() {
    this.element.className = classNames('footnote', {
      'footnote--hidden': !isSilentNotePresentInSong()
    });

    this.element.innerHTML = `
      <p>Some notes are silent because mechanical DIY music boxes can't play notes in close succession</p>
    `;
  }
}
