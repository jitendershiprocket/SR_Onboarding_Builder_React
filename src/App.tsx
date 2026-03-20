import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import BuilderPage from './pages/BuilderPage';
import SchemaList from './components/SchemaList/SchemaList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/builder" replace />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/schemas" element={<SchemaList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
