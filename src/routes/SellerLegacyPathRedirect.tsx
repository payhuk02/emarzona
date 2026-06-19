import { Navigate, useParams } from 'react-router-dom';

interface Props {
  /** Chemin cible avec paramètres dynamiques, ex. `/dashboard/courses/:courseId/gamification` */
  to: string;
}

/** Redirige une route legacy vendeur vers son équivalent canonique sous `/dashboard`. */
export function SellerLegacyPathRedirect({ to }: Props) {
  const params = useParams();
  let target = to;
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      target = target.replace(`:${key}`, value);
    }
  }
  return <Navigate to={target} replace />;
}
