import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import Layout from './components/Layout';
import { Protected, Spinner } from './components/ui';
import { AuthProvider, SiteProvider, ToastProvider } from './lib/context';
import Home from './pages/Home';

// Découpage du code par section pour un chargement rapide
const L = (factory, name) => lazy(() => factory().then((m) => ({ default: m[name] })));
const agency = () => import('./pages/Agency');
const portfolio = () => import('./pages/Portfolio');
const blog = () => import('./pages/Blog');
const contact = () => import('./pages/Contact');
const courses = () => import('./pages/Courses');
const authP = () => import('./pages/Auth');
const account = () => import('./pages/account/Account');
const admin = () => import('./pages/admin/Admin');
const editor = () => import('./pages/admin/CourseEditor');

const About = L(agency, 'About');
const Services = L(agency, 'Services');
const Portfolio = L(portfolio, 'Portfolio');
const ProjectDetail = L(portfolio, 'ProjectDetail');
const Blog = L(blog, 'Blog');
const Post = L(blog, 'Post');
const Contact = L(contact, 'Contact');
const Quote = L(contact, 'Quote');
const Verify = L(contact, 'Verify');
const Legal = L(contact, 'Legal');
const NotFound = L(contact, 'NotFound');
const Courses = L(courses, 'Courses');
const Compare = L(courses, 'Compare');
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Learn = lazy(() => import('./pages/Learn'));
const Login = L(authP, 'Login');
const Register = L(authP, 'Register');
const Forgot = L(authP, 'Forgot');
const Reset = L(authP, 'Reset');
const AccountLayout = L(account, 'AccountLayout');
const Dashboard = L(account, 'Dashboard');
const MyCourses = L(account, 'MyCourses');
const Certificates = L(account, 'Certificates');
const Orders = L(account, 'Orders');
const Favorites = L(account, 'Favorites');
const Notes = L(account, 'Notes');
const Notifications = L(account, 'Notifications');
const Profile = L(account, 'Profile');
const AdminLayout = L(admin, 'AdminLayout');
const AdminDashboard = L(admin, 'AdminDashboard');
const AdminResource = L(admin, 'AdminResource');
const SiteContent = L(admin, 'SiteContent');
const AdminCourses = L(editor, 'AdminCourses');
const CourseEditor = L(editor, 'CourseEditor');

const S = (el) => <Suspense fallback={<Spinner />}>{el}</Suspense>;
const STAFF = ['admin', 'instructor'];

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="a-propos" element={S(<About />)} />
        <Route path="services" element={S(<Services />)} />
        <Route path="portfolio" element={S(<Portfolio />)} />
        <Route path="portfolio/:slug" element={S(<ProjectDetail />)} />
        <Route path="formations" element={S(<Courses />)} />
        <Route path="formations/comparer" element={S(<Compare />)} />
        <Route path="formations/:slug" element={S(<CourseDetail />)} />
        <Route path="blog" element={S(<Blog />)} />
        <Route path="blog/:slug" element={S(<Post />)} />
        <Route path="contact" element={S(<Contact />)} />
        <Route path="devis" element={S(<Quote />)} />
        <Route path="verifier" element={S(<Verify />)} />
        <Route path="verifier/:number" element={S(<Verify />)} />
        <Route path="mentions-legales" element={S(<Legal page="mentions-legales" />)} />
        <Route path="confidentialite" element={S(<Legal page="confidentialite" />)} />
        <Route path="cgv" element={S(<Legal page="cgv" />)} />
        <Route path="paiement/:slug" element={<Protected>{S(<Checkout />)}</Protected>} />
        <Route path="*" element={S(<NotFound />)} />
      </Route>
      <Route element={<Layout bare />}>
        <Route path="connexion" element={S(<Login />)} />
        <Route path="inscription" element={S(<Register />)} />
        <Route path="mot-de-passe-oublie" element={S(<Forgot />)} />
        <Route path="reinitialiser" element={S(<Reset />)} />
        <Route path="apprendre/:slug" element={<Protected>{S(<Learn />)}</Protected>} />
        <Route path="compte" element={<Protected>{S(<AccountLayout />)}</Protected>}>
          <Route index element={S(<Dashboard />)} />
          <Route path="formations" element={S(<MyCourses />)} />
          <Route path="attestations" element={S(<Certificates />)} />
          <Route path="achats" element={S(<Orders />)} />
          <Route path="favoris" element={S(<Favorites />)} />
          <Route path="notes" element={S(<Notes />)} />
          <Route path="notifications" element={S(<Notifications />)} />
          <Route path="profil" element={S(<Profile />)} />
        </Route>
        <Route path="admin" element={<Protected role={STAFF}>{S(<AdminLayout />)}</Protected>}>
          <Route index element={S(<AdminDashboard />)} />
          <Route path="formations" element={S(<AdminCourses />)} />
          <Route path="formations/:id" element={S(<CourseEditor />)} />
          <Route path="categories" element={S(<AdminResource name="categories" />)} />
          <Route path="exercices" element={S(<AdminResource name="submissions" />)} />
          <Route path="attestations" element={S(<AdminResource name="certificates" />)} />
          <Route path="avis" element={S(<AdminResource name="reviews" />)} />
          <Route path="commentaires" element={S(<AdminResource name="comments" />)} />
          <Route path="paiements" element={<Protected role={['admin']}>{S(<AdminResource name="orders" />)}</Protected>} />
          <Route path="coupons" element={S(<AdminResource name="coupons" />)} />
          <Route path="devis" element={S(<AdminResource name="quotes" />)} />
          <Route path="messages" element={S(<AdminResource name="messages" />)} />
          <Route path="portfolio" element={S(<AdminResource name="projects" />)} />
          <Route path="blog" element={S(<AdminResource name="posts" />)} />
          <Route path="newsletter" element={S(<AdminResource name="newsletter" />)} />
          <Route path="utilisateurs" element={<Protected role={['admin']}>{S(<AdminResource name="users" />)}</Protected>} />
          <Route path="contenu" element={<Protected role={['admin']}>{S(<SiteContent />)}</Protected>} />
          <Route path="journal" element={<Protected role={['admin']}>{S(<AdminResource name="activity" />)}</Protected>} />
        </Route>
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SiteProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SiteProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
