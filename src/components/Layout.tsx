import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Fade each page in on navigation. Opacity only: a transform here would
          break the position:fixed pop-ups that pages render (poster viewer, profiles). */}
      <motion.main
        key={pathname}
        className="page-main flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  );
};
