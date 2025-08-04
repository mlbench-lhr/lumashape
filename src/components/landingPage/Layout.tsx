// components/Layout.tsx
import Header from './Header';
import Footer from './Footer';
import Banner from './Banner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="">{children}</main> {/* <-- Added padding */}
      <Footer />
    </div>
  );
};

export default Layout;
