'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Closet Admin</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Overview</span>
            <Link href="/dashboard" className="nav-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 10L10 3L17 10V17C17 17.5304 16.7893 18.0391 16.4142 18.4142C16.0391 18.7893 15.5304 19 15 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 19V10H13V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Dashboard
            </Link>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Catalog</span>
            <Link href="/dashboard/products" className="nav-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 6L10 2L3 6V14L10 18L17 14V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 18V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Products
            </Link>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Sales</span>
            <Link href="/dashboard/orders" className="nav-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2H4C2.89543 2 2 2.89543 2 4V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16V4C18 2.89543 17.1046 2 16 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Orders
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="nav-link back-to-store">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 10H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 15L5 10L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f8f9fa;
        }

        .admin-sidebar {
          width: 260px;
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: white;
          text-decoration: none;
        }

        .sidebar-logo svg {
          color: #6366f1;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 12px;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.4);
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link svg {
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-to-store {
          color: rgba(255, 255, 255, 0.5);
        }

        .back-to-store:hover {
          color: white;
        }

        .admin-main {
          flex: 1;
          margin-left: 260px;
          padding: 32px;
          min-height: 100vh;
        }

        @media (max-width: 1024px) {
          .admin-sidebar {
            width: 220px;
          }
          .admin-main {
            margin-left: 220px;
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
