import { Navigate } from 'react-router-dom';

/** Ancienne route dashboard « Mes cours » → portail acheteur (inscriptions). */
export default function MyCoursesRedirect() {
  return <Navigate to="/account/courses" replace />;
}
