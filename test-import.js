import { pathToFileURL } from 'url';
const importPath = pathToFileURL('./src/main.jsx').href;
import(importPath).then(m => console.log("Loaded successfully")).catch(e => console.error(e));
