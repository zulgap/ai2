import React from 'react';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link href="/">Multi-Agent AI System</Link>
            </div>
            <ul className={styles.navLinks}>
                <li>
                    <Link href="/">Home</Link>
                </li>
                <li>
                    <Link href="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link href="/api/auth/login">Login</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;