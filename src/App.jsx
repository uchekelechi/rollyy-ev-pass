import { AppProvider, useAppState } from './state/AppContext';
import Screen1Voice from './screens/Screen1Voice';
import Screen2Stations from './screens/Screen2Stations';
import Screen3Booking from './screens/Screen3Booking';
import Screen4Pass from './screens/Screen4Pass';
import Screen5Session from './screens/Screen5Session';
import Screen6Receipt from './screens/Screen6Receipt';
import './index.css';

const SCREENS = {
  1: Screen1Voice,
  2: Screen2Stations,
  3: Screen3Booking,
  4: Screen4Pass,
  5: Screen5Session,
  6: Screen6Receipt
};

function Flow() {
  const { state } = useAppState();
  const Screen = SCREENS[state.screen] || Screen1Voice;
  return (
    <main className="app-shell">
      <Screen />
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Flow />
    </AppProvider>
  );
}
