import { Link, type LinkProps } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';

type StoreCreateCtaLinkProps = Omit<LinkProps, 'to'> & {
  to?: never;
};

/**
 * CTA « créer une boutique » : dashboard settings si connecté, sinon inscription avec retour post-auth.
 */
export function StoreCreateCtaLink({ state, ...props }: StoreCreateCtaLinkProps) {
  const { user } = useAuth();

  if (user) {
    return <Link to={STORE_CREATE_PATH} state={state} {...props} />;
  }

  return (
    <Link
      to="/register"
      state={{
        ...(typeof state === 'object' && state !== null ? state : {}),
        from: STORE_CREATE_PATH,
      }}
      {...props}
    />
  );
}
