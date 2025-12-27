import { useTranslation } from 'react-i18next';

const PaymentCancel = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">{t('payments.cancelled.title', 'Paiement annulé ❌')}</h1>
      <p>{t('payments.cancelled.description', 'Votre transaction a été annulée. Vous pouvez réessayer plus tard.')}</p>
    </div>
  );
};

export default PaymentCancel;






