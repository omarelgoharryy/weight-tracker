import { render } from 'preact';
import '@fontsource-variable/nunito/wght.css';
import { App } from './app';
import './styles.css';

render(<App />, document.getElementById('app')!);
