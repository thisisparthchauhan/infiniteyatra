import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App.jsx';

try {
  console.log("Attempting to render App...");
  // Note: we can't fully render BrowserRouter on server easily like this, 
  // but just loading the module might throw the error we need.
  console.log(typeof App);
} catch (error) {
  console.error("Render failed:", error);
}
