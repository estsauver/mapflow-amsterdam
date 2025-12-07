import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* All routes render the same Index page - routing state is handled by dialogs */}
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<Index />} />
        <Route path="/contact" element={<Index />} />
        <Route path="/projects" element={<Index />} />
        <Route path="/projects/:projectId" element={<Index />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
