import "@/styles/globals.css";
import ContextProvider from '../context';

export default function App({ Component, pageProps }) {
  // For Pages Router, we don't have access to cookies in _app.js
  // The cookie handling will be done client-side
  return (
    <ContextProvider cookies={null}>
      <Component {...pageProps} />
    </ContextProvider>
  );
}
