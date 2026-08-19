import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import CreateInvoice from './pages/CreateInvoice';
import PaymentPage from './pages/PaymentPage';
import Profile from '../pages/Profile';

const MobileAnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<CreateInvoice />} />
                <Route path="/pay" element={<PaymentPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<CreateInvoice />} />
            </Routes>
        </AnimatePresence>
    );
};

export const MobileApp = () => {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* BACKGROUND GRADIENT */}
            <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-screen h-[800px] z-0 pointer-events-none flex justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-radial from-neon-primary/5 via-transparent to-transparent opacity-50" />
            </div>

            <Navbar />

            <main className="relative z-10 pt-24 px-4 pb-32 md:pb-12">
                <MobileAnimatedRoutes />
            </main>
        </div>
    );
};
