import { Navigate } from 'react-router-dom';

/** Ancienne route dashboard → portail acheteur (onglet licences). */
export default function MyLicensesRedirect() {
  return <Navigate to="/account/digital?tab=licenses" replace />;
}
