import { render } from 'preact';
import '@fontsource-variable/figtree/wght.css';
import { App } from './app';
import './styles.css';

render(<App />, document.getElementById('app')!);
