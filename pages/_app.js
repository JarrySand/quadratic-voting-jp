import "react-datetime/css/react-datetime.css"; // React datetime styling
import "react-accessible-accordion/dist/fancy-example.css"; // React accordion styling
import "../styles/global.css"; // Global CSS styling
import { SessionProvider } from "next-auth/react"

// Chart.js v4 tree-shaking setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Default application setup
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
