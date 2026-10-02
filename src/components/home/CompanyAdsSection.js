// src/components/home/CompanyAdsSection.js


import Image from "next/image";
import styles from "./CompanyAdsSection.module.css";

// ============================================================
// Data
// ============================================================
const MAIN_AD = {
    companyName: "OceanBridge Lines",
    companyType: "International Shipping & Logistics",
    companyIcon: "fa-ship",
    title: "Move Your Food Business Across Every Ocean.",
    description:
        "OceanBridge Lines provides reliable sea freight solutions for food exporters, importers, manufacturers and distributors. Connect your cargo with major global trade routes.",
    features: [
        { icon: "fa-ship", label: "Ocean Freight" },
        { icon: "fa-temperature-low", label: "Reefer Containers" },
        { icon: "fa-box", label: "FCL & LCL" },
        { icon: "fa-earth-americas", label: "120+ Ports" },
    ],
    ctaText: "Request Freight Quote",
    link: "/advertise",
    image: "/images/ads/nordicfresh-storage.jpg",
    imageAlt: "OceanBridge Lines — Global Ocean Freight for Food Trade",
};

const COMPANY_ADS = [
    {
        label: "Sponsored",
        image: "/images/ads/gulfport-logistics.jpg",
        imageAlt: "GulfPort Logistics — Freight & Customs Services",
        icon: "fa-truck-fast",
        iconColor: "#2563eb",
        name: "GulfPort Logistics",
        type: "Freight & Customs",
        title: "Your Cargo. Our Network.",
        description:
            "Door-to-door logistics, customs clearance and international freight solutions.",
        link: "#",
    },
    {
        label: "Featured",
        image: "/images/ads/meridian-brokers.jpg",
        imageAlt: "Meridian Food Brokers — International Food Trade",
        icon: "fa-handshake",
        iconColor: "#7c3aed",
        name: "Meridian Food Brokers",
        type: "International Food Trade",
        title: "Find Buyers. Close Deals.",
        description:
            "Professional food trade agents connecting producers with international buyers.",
        link: "#",
    },
    {
        label: "Sponsored",
        image: "/images/ads/gulfport-logistics.jpg",
        imageAlt: "NordicFresh Storage — Cold Chain & Warehousing",
        icon: "fa-warehouse",
        iconColor: "#d97706",
        name: "NordicFresh Storage",
        type: "Cold Chain & Warehousing",
        title: "Store Food. Ship With Confidence.",
        description:
            "Temperature-controlled storage and distribution for food businesses.",
        link: "#",
    },
];

const SERVICE_ADS = [
    {
        icon: "fa-plane",
        name: "SkyRoute Cargo",
        desc: "Fast Air Freight Worldwide",
        link: "#",
    },
    {
        icon: "fa-file-invoice",
        name: "TradeSure Finance",
        desc: "Trade Finance & Payment Solutions",
        link: "#",
    },
    {
        icon: "fa-passport",
        name: "GlobalCert Services",
        desc: "Food Certificates & Inspection",
        link: "#",
    },
    {
        icon: "fa-boxes-stacked",
        name: "Atlas Fulfillment",
        desc: "Global Warehousing & Distribution",
        link: "#",
    },
];

// ============================================================
// Component
// ============================================================
export default function CompanyAdsSection() {
    return (
        <section className={styles.adSection} id="services">
            {/* =====================================================
          Section Heading
      ===================================================== */}
            {/* ===== Heading ===== */}
            <div className={styles.adHeader}>
                <div className={styles.adHeaderText}>
                    <div className={styles.adHeadingBadge}>
                        <i className="fa-solid fa-bullhorn"></i>
                        Featured Business Services
                    </div>
                    <h2>Trusted Partners for Global Food Trade</h2>
                    <p>
                        Professional companies helping food businesses source, ship, store
                        and trade products worldwide.
                    </p>
                </div>

                <a href="/advertise" className={styles.adHeaderLink}>
                    Advertise Your Company
                    <i className="fa-solid fa-arrow-right"></i>
                </a>
            </div>

            {/* =====================================================
          Main Sponsored Ad
      ===================================================== */}
            <div className={styles.companyAdMain}>
                <div className={styles.adMainImageWrap}>
                    <Image
                        src={MAIN_AD.image}
                        alt={MAIN_AD.imageAlt}
                        fill
                        sizes="(max-width: 900px) 100vw, 1380px"
                        priority
                        style={{ objectFit: "cover" }}
                    />
                </div>

                <div className={styles.adMainContent}>
                    <span className={styles.sponsored}>
                        <i className="fa-solid fa-star"></i>
                        Sponsored Company
                    </span>

                    <div className={styles.adCompany}>
                        <div className={styles.adCompanyLogo}>
                            <i className={`fa-solid ${MAIN_AD.companyIcon}`}></i>
                        </div>
                        <div>
                            <div className={styles.adCompanyName}>
                                {MAIN_AD.companyName}
                            </div>
                            <span className={styles.adCompanyType}>
                                {MAIN_AD.companyType}
                            </span>
                        </div>
                    </div>

                    <h3>{MAIN_AD.title}</h3>
                    <p>{MAIN_AD.description}</p>

                    <div className={styles.adFeatures}>
                        {MAIN_AD.features.map((f, i) => (
                            <span key={i} className={styles.adFeature}>
                                <i className={`fa-solid ${f.icon}`}></i>
                                {f.label}
                            </span>
                        ))}
                    </div>

                    <a href={MAIN_AD.link} className={styles.adMainButton}>
                        {MAIN_AD.ctaText}
                        <i className="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </div>

            {/* =====================================================
          Three Company Ads
      ===================================================== */}
            <div className={styles.companyAdGrid}>
                {COMPANY_ADS.map((ad, i) => (
                    <article key={i} className={styles.companyAdCard}>
                        <div className={styles.companyAdCardImage}>
                            <Image
                                src={ad.image}
                                alt={ad.imageAlt}
                                fill
                                sizes="(max-width: 650px) 100vw, (max-width: 900px) 50vw, 450px"
                                style={{ objectFit: "cover" }}
                            />
                            <span className={styles.adLabel}>{ad.label}</span>
                        </div>

                        <div className={styles.adCardBody}>
                            <div className={styles.adCardBrand}>
                                <div
                                    className={styles.adCardLogo}
                                    style={{ color: ad.iconColor }}
                                >
                                    <i className={`fa-solid ${ad.icon}`}></i>
                                </div>
                                <div>
                                    <strong>{ad.name}</strong>
                                    <small>{ad.type}</small>
                                </div>
                            </div>

                            <h4>{ad.title}</h4>
                            <p>{ad.description}</p>

                            <div className={styles.adCardBottom}>
                                <span className={styles.adCardVerified}>
                                    <i className="fa-solid fa-circle-check"></i>
                                    Verified Company
                                </span>

                                <a href={ad.link} className={styles.adCardLink}>
                                    View Company
                                    <i className="fa-solid fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* =====================================================
          Service Mini Ads
      ===================================================== */}
            <div className={styles.serviceAds}>
                {SERVICE_ADS.map((s, i) => (
                    <a key={i} href={s.link} className={styles.serviceAd}>
                        <div className={styles.serviceAdIcon}>
                            <i className={`fa-solid ${s.icon}`}></i>
                        </div>
                        <div>
                            <strong>{s.name}</strong>
                            <small>{s.desc}</small>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}