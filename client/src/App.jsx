import { Routes, Route } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import HomePage from './pages/HomePage.jsx';
import ChargingPage from './pages/ChargingPage.jsx';
import BotFleetPage from './pages/BotFleetPage.jsx';
import BotDispatchPage from './pages/BotDispatchPage.jsx';
import ReservationPage from './pages/ReservationPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ReservationConfirmedPage from './pages/ReservationConfirmedPage.jsx';
import ParkingPage from './pages/ParkingPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import CarWashPage from './pages/CarWashPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import WeatherPage from './pages/WeatherPage.jsx';

export default function App() {
  return (
    <LocationProvider>
      <div className="app-shell">
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/charging" element={<ChargingPage />} />
            <Route path="/charging/bot" element={<BotFleetPage />} />
            <Route path="/charging/bot/:id" element={<BotDispatchPage />} />
            <Route path="/:kind/reserve" element={<ReservationPage />} />
            <Route path="/:kind/reserve/:id/pay" element={<PaymentPage />} />
            <Route path="/:kind/reserve/:id/confirmed" element={<ReservationConfirmedPage />} />
            <Route path="/parking" element={<ParkingPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/carwash" element={<CarWashPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/weather" element={<WeatherPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </LocationProvider>
  );
}
