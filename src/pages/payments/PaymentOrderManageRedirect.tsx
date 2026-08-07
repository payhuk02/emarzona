import { Navigate, useParams } from 'react-router-dom';

/** Compatibilité : ancienne URL /payments/:orderId/manage */
export default function PaymentOrderManageRedirect() {
  const { orderId } = useParams<{ orderId: string }>();
  if (!orderId) {
    return <Navigate to="/dashboard/payment-management" replace />;
  }
  return <Navigate to={`/dashboard/payment-management/${orderId}`} replace />;
}
