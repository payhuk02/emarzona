/**
 * Wrapper animé pour ReviewCard
 * Date : 27 octobre 2025
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedReviewCardProps {
  children: ReactNode;
  index?: number;
}

export const AnimatedReviewCard = ({ children, index = 0 }: AnimatedReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1, // Staggered animation
        ease: 'easeOut',
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Bouton de vote animé
 */
export const AnimatedVoteButton = ({ children, ...props }: any) => {
  return (
    <motion.button
      {...props}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};

/**
 * Étoile animée
 */
export const AnimatedStar = ({ children, index = 0, ...props }: any) => {
  return (
    <motion.div
      {...props}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.05,
      }}
      whileHover={{ scale: 1.2, rotate: 5 }}
    >
      {children}
    </motion.div>
  );
};

