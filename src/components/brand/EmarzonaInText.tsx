import { Fragment } from 'react';
import { EmarzonaBrandName } from '@/components/brand/EmarzonaBrandName';

const EMARZONA_TOKEN = 'Emarzona';

/** Remplace « Emarzona » dans un texte par le mot-symbole bicolore. */
export function EmarzonaInText({ children }: { children: string }) {
  if (!children.includes(EMARZONA_TOKEN)) {
    return <>{children}</>;
  }

  const parts = children.split(EMARZONA_TOKEN);

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? <EmarzonaBrandName /> : null}
        </Fragment>
      ))}
    </>
  );
}
