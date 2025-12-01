import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/layout/themeprovider";
import MainRouter from "./router/MainRouter";

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <MainRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
