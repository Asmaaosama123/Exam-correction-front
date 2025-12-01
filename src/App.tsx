import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/layout/themeprovider";
import { QueryProvider } from "./providers/QueryProvider";
import { Toaster } from "./components/ui/sonner";
import MainRouter from "./router/MainRouter";

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <BrowserRouter>
          <MainRouter />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
};

export default App;
