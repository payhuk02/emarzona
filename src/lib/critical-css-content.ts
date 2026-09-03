export const criticalCSS = `
/* Variables CSS critiques - Minimales pour FCP */
:root {
  --background: 0 0% 100%;
  --foreground: 220 40% 10%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --radius: 0.5rem;
}

/* Reset minimal */
*,::before,::after {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter Variable',Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size: 1rem;
  line-height: 1.625;
  margin: 0;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

/* Container minimal */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Typographie critique */
h1,h2,h3 {
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}

/* Images critiques */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Boutons critiques */
button {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

/* Focus visible */
*:focus-visible {
  outline: 3px solid hsl(var(--primary));
  outline-offset: 2px;
}
`;
