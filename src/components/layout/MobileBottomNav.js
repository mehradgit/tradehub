// src/components/layout/MobileBottomNav.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./MobileBottomNav.module.css";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
    {
        label: "Home",
        href: "/",
        icon: "fa-house",
        matchExact: true,
    },
    {
        label: "Products",
        href: "/products",
        icon: "fa-box",
        matchPrefix: "/products",
    },
    {
        label: "Requests",
        href: "/requests",
        icon: "fa-cart-shopping",
        matchPrefix: "/requests",
    },
    {
        label: "Suppliers",
        href: "/profiles",
        icon: "fa-building",
        matchPrefix: "/profiles",
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            // Scrolling down → hide
            // Scrolling up → show
            if (current > lastScroll && current > 100) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            setLastScroll(current);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScroll]);
    // Does the current path match the item?
    const isActive = (item) => {
        if (!pathname) return false;
        if (item.matchExact) return pathname === item.href;
        if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
        return false;
    };

    // Fifth item: based on the login status
    const accountItem =
        status === "authenticated"
            ? {
                label: "Account",
                href: "/dashboard",
                icon: "fa-user",
                matchPrefix: "/dashboard",
            }
            : {
                label: "Sign In",
                href: "/login",
                icon: "fa-right-to-bracket",
                matchPrefix: "/login",
            };

    const allItems = [...NAV_ITEMS, accountItem];

    return (
        <nav className={styles.bottomNav} aria-label="Mobile navigation">
            <ul className={styles.navList}>
                {allItems.map((item) => {
                    const active = isActive(item);
                    return (
                        <li key={item.href} className={styles.navItem}>
                            <Link
                                href={item.href}
                                className={`${styles.navLink} ${active ? styles.active : ""}`}
                                aria-current={active ? "page" : undefined}
                            >
                                <span className={styles.iconWrap}>
                                    <i className={`fa-solid ${item.icon}`}></i>
                                    {active && <span className={styles.activeDot}></span>}
                                </span>
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}