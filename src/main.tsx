import './polyfill';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { BlogPost } from './components/BlogPost';
import { About } from './pages/About.tsx'
import { TimelinePage } from './pages/TimelinePage.tsx'
import { GalleryPage } from './pages/GalleryPage.tsx'
import { FriendsPage } from './pages/FriendsPage.tsx'
import { 
  LoginPage, 
  AdminLayout, 
  AdminDashboard,
  PostsManagement,
  PostEditor,
  PhotosManagement 
} from './pages/admin'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
       <Routes>
         {/* 前台路由 */}
         <Route path="/" element={<App />} />
         <Route path="/posts/:id" element={<BlogPost />} />
         <Route path="/tech/:id" element={<BlogPost />} />
         <Route path="/life/:id" element={<BlogPost />} />
         <Route path="/about" element={<About />} />
         <Route path="/timeline" element={<TimelinePage />} />
         <Route path="/gallery" element={<GalleryPage />} />
         <Route path="/friends" element={<FriendsPage />} />
         
         {/* 管理后台路由 */}
         <Route path="/admin/login" element={<LoginPage />} />
         <Route path="/admin" element={
           <ProtectedRoute>
             <AdminLayout />
           </ProtectedRoute>
         }>
           <Route index element={<AdminDashboard />} />
           <Route path="posts" element={<PostsManagement />} />
           <Route path="posts/new" element={<PostEditor />} />
           <Route path="posts/:type/:filename/edit" element={<PostEditor />} />
           <Route path="photos" element={<PhotosManagement />} />
         </Route>
       </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

